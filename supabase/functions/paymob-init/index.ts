// ═══════════════════════════════════════════════
// Edge Function: paymob-init  (config-driven)
// ═══════════════════════════════════════════════
// 3-step Paymob flow — but the bundle size and EGP amount come from
// the frontend (which reads them from nexus.config.js). The webhook
// later credits exactly `bundle_points` to the user's wallet.
//
// Body shape:
//   {
//     user_id:           uuid,
//     integration:       'card' | 'wallet' | 'kiosk',
//     bundle_points:     number,             // from nexus.config.js
//     amount_egp_cents:  number,             // points * exchangeRate * 100
//     exchange_rate:     number,             // snapshot for audit trail
//     bundle_id?:        string,             // optional shelf-bundle id
//   }
//
// Env vars:
//   PAYMOB_API_KEY
//   PAYMOB_INTEGRATION_CARD
//   PAYMOB_INTEGRATION_WALLET
//   PAYMOB_INTEGRATION_KIOSK
//   PAYMOB_IFRAME_ID

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const integrationMap: Record<string, string> = {
  card:   Deno.env.get('PAYMOB_INTEGRATION_CARD')   || '',
  wallet: Deno.env.get('PAYMOB_INTEGRATION_WALLET') || '',
  kiosk:  Deno.env.get('PAYMOB_INTEGRATION_KIOSK')  || '',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405)

  try {
    const {
      user_id,
      integration     = 'card',
      bundle_points,
      amount_egp_cents,
      exchange_rate   = 1,
      bundle_id,
    } = await req.json()

    /* ── Input validation ── */
    if (!user_id) return json({ error: 'Missing user_id' }, 400)
    if (!Number.isInteger(bundle_points) || bundle_points < 100)
      return json({ error: 'Invalid bundle_points' }, 400)
    if (!Number.isInteger(amount_egp_cents) || amount_egp_cents < 100)
      return json({ error: 'Invalid amount_egp_cents' }, 400)

    const integrationId = integrationMap[integration]
    if (!integrationId)
      return json({ error: `No PAYMOB_INTEGRATION_${integration.toUpperCase()} configured` }, 500)

    const apiKey   = Deno.env.get('PAYMOB_API_KEY')
    const iframeId = Deno.env.get('PAYMOB_IFRAME_ID')
    if (!apiKey || !iframeId) return json({ error: 'Paymob not configured' }, 500)

    /* ── Step 1: Auth ── */
    const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    })
    const { token: authToken } = await authRes.json()
    if (!authToken) throw new Error('Paymob auth failed')

    /* ── Step 2: Order ── */
    const merchantOrderId = `nxp-${user_id}-${Date.now()}`
    const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amount_egp_cents,
        currency: 'EGP',
        merchant_order_id: merchantOrderId,
        items: [{
          name: `${bundle_points} Nexus Points bundle`,
          amount_cents: amount_egp_cents,
          description: `Nexus 101 wallet top-up · ${bundle_id || 'custom'}`,
          quantity: 1,
        }],
      }),
    })
    const order = await orderRes.json()
    if (!order?.id) throw new Error('Paymob order creation failed')

    /* ── Insert pending paymob_transactions row (audit trail with snapshot) ── */
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    await supabase.from('paymob_transactions').insert({
      user_id,
      paymob_order_id:  String(order.id),
      amount_egp_cents,
      bundle_points,
      integration_id:   integration,
      status:           'pending',
      exchange_rate,
      points_per_egp:   bundle_points / (amount_egp_cents / 100),
    })

    /* ── Step 3: Payment key ── */
    const keyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amount_egp_cents,
        expiration: 3600,
        order_id: order.id,
        billing_data: {
          first_name: 'Nexus', last_name: 'Student',
          email: 'noreply@nexus101.com',
          phone_number: '+201000000000',
          country: 'EG', city: 'Cairo',
          street: 'NA', floor: 'NA', building: 'NA', apartment: 'NA',
        },
        currency: 'EGP',
        integration_id: integrationId,
        lock_order_when_paid: true,
      }),
    })
    const keyData = await keyRes.json()
    if (!keyData?.token) throw new Error('Paymob payment-key request failed')

    return json({
      ok: true,
      order_id:       order.id,
      iframe_url:     `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${keyData.token}`,
      payment_token:  keyData.token,
      bundle_points,                                   // echoed back for the FE
      amount_egp_cents,
    })
  } catch (e) {
    console.error('[paymob-init]', e)
    return json({ error: e.message || 'unknown error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
