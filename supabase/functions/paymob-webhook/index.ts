// ═══════════════════════════════════════════════
// Edge Function: paymob-webhook
// ═══════════════════════════════════════════════
// Paymob calls this URL after every transaction with:
//   • The transaction object (POST body)
//   • An HMAC SHA-512 signature in ?hmac=…
//
// CRITICAL: never credit the wallet on success-redirect from the iframe —
// only credit when this webhook arrives AND the HMAC verifies.
//
// Set this URL in Paymob:
//   https://<your-project>.supabase.co/functions/v1/paymob-webhook
//
// Env vars to set:
//   PAYMOB_HMAC_SECRET           ← from Paymob dashboard → Settings → Account Info
//   SUPABASE_URL                  ← auto
//   SUPABASE_SERVICE_ROLE_KEY     ← auto

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const url   = new URL(req.url)
    const hmac  = url.searchParams.get('hmac') || ''
    const body  = await req.json()
    const obj   = body?.obj || body                 // Paymob wraps under 'obj'

    /* ── 1. Verify HMAC ── */
    const ok = await verifyPaymobHmac(obj, hmac)
    if (!ok) {
      console.warn('[paymob-webhook] HMAC failed', { paymobTxn: obj?.id })
      return new Response('Invalid HMAC', { status: 400 })
    }

    /* ── 2. Connect to DB ── */
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const orderId  = String(obj?.order?.id)
    const txnId    = String(obj?.id)
    const success  = obj?.success === true
    const amount   = Number(obj?.amount_cents)

    /* ── 3. Update / find the paymob_transactions row ── */
    const { data: existing } = await supabase
      .from('paymob_transactions')
      .select('*')
      .eq('paymob_order_id', orderId)
      .maybeSingle()

    if (!existing) {
      console.warn('[paymob-webhook] no matching order_id; storing anyway')
    }

    const newStatus = success ? 'paid' : 'failed'
    await supabase.from('paymob_transactions')
      .update({
        paymob_txn_id:    txnId,
        status:           newStatus,
        hmac_signature:   hmac,
        hmac_verified:    true,
        callback_payload: obj,
        updated_at:       new Date().toISOString(),
      })
      .eq('paymob_order_id', orderId)

    /* ── 4. If paid, credit the wallet (idempotent RPC) ── */
    if (success && existing?.user_id) {
      const idempotency = `paymob:${txnId}`
      const { data: rpc, error } = await supabase.rpc('credit_wallet', {
        p_user_id:         existing.user_id,
        p_points:          existing.bundle_points,
        p_idempotency_key: idempotency,
        p_reference_id:    txnId,
        p_meta:            { integration: existing.integration_id, amount_cents: amount },
      })
      if (error) {
        console.error('[paymob-webhook] credit_wallet error', error)
        return new Response('credit failed', { status: 500 })
      }
      return Response.json({ ok: true, credited: rpc })
    }

    return Response.json({ ok: true, status: newStatus })
  } catch (e) {
    console.error('[paymob-webhook]', e)
    return new Response('error', { status: 500 })
  }
})

/* ─── HMAC SHA-512 verification ─────────────────
   Paymob concatenates a fixed list of fields (alphabetical order)
   and HMAC-SHA512s with your secret. Reference:
   https://docs.paymob.com/docs/hmac-calculation
   ─────────────────────────────────────────────── */
async function verifyPaymobHmac(obj: any, hmac: string): Promise<boolean> {
  const secret = Deno.env.get('PAYMOB_HMAC_SECRET')
  if (!secret || !hmac) return false

  // Paymob's documented HMAC field order:
  const fields = [
    obj?.amount_cents,
    obj?.created_at,
    obj?.currency,
    obj?.error_occured,
    obj?.has_parent_transaction,
    obj?.id,
    obj?.integration_id,
    obj?.is_3d_secure,
    obj?.is_auth,
    obj?.is_capture,
    obj?.is_refunded,
    obj?.is_standalone_payment,
    obj?.is_voided,
    obj?.order?.id,
    obj?.owner,
    obj?.pending,
    obj?.source_data?.pan,
    obj?.source_data?.sub_type,
    obj?.source_data?.type,
    obj?.success,
  ]
  const concat = fields.map(v => v === undefined || v === null ? '' : String(v)).join('')

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(concat))
  const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
  return timingSafeEqual(hex, hmac)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let res = 0
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return res === 0
}
