/**
 * Nexus 101 — Paymob Payment API (Vercel Serverless Function)
 *
 * This file runs on the SERVER — your secret keys are never exposed to the browser.
 *
 * HOW TO FIND YOUR KEYS IN PAYMOB:
 * ──────────────────────────────────
 * 1. Log in at https://accept.paymob.com/portal2/en/login
 * 2. API Key       → Settings → Account Info → "API Key"
 * 3. Integration IDs → Developers → Payment Integrations → select integration → copy the ID number
 * 4. iFrame ID    → Developers → iFrame → copy the ID number
 *
 * FLOW (3 steps):
 * Step 1: Authenticate with Paymob → get auth_token
 * Step 2: Create an Order → get order_id
 * Step 3: Create Payment Key → get payment_key (used in the iframe)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { amount, currency = 'EGP', courseId, studentName, studentEmail, studentPhone, paymentMethod } = req.body

  if (!amount || !courseId || !studentEmail) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const API_KEY             = process.env.PAYMOB_API_KEY
  const INTEGRATION_CARD    = process.env.PAYMOB_INTEGRATION_CARD
  const INTEGRATION_WALLET  = process.env.PAYMOB_INTEGRATION_WALLET
  const IFRAME_ID           = process.env.PAYMOB_IFRAME_ID

  if (!API_KEY) {
    return res.status(500).json({ error: 'Paymob API key not configured. Add PAYMOB_API_KEY to your .env file.' })
  }

  try {
    /* ── Step 1: Authenticate ── */
    const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: API_KEY }),
    })
    const authData = await authRes.json()
    const authToken = authData.token
    if (!authToken) throw new Error('Paymob authentication failed')

    /* ── Step 2: Create Order ── */
    const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(amount * 100),
        currency,
        merchant_order_id: `nexus-${courseId}-${Date.now()}`,
        items: [{
          name: `Nexus 101 — Course: ${courseId}`,
          amount_cents: Math.round(amount * 100),
          description: 'Educational course subscription',
          quantity: 1,
        }],
      }),
    })
    const orderData = await orderRes.json()
    const orderId = orderData.id
    if (!orderId) throw new Error('Failed to create Paymob order')

    /* ── Step 3: Get Payment Key ── */
    const integrationId = paymentMethod === 'wallet' ? INTEGRATION_WALLET : INTEGRATION_CARD

    const keyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: Math.round(amount * 100),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          first_name: studentName?.split(' ')[0] || 'Student',
          last_name:  studentName?.split(' ').slice(1).join(' ') || 'Nexus',
          email: studentEmail,
          phone_number: studentPhone || '+201000000000',
          country: 'EG',
          city: 'Cairo',
          street: 'NA',
          floor: 'NA',
          building: 'NA',
          apartment: 'NA',
        },
        currency,
        integration_id: integrationId,
        lock_order_when_paid: true,
      }),
    })
    const keyData = await keyRes.json()
    const paymentKey = keyData.token
    if (!paymentKey) throw new Error('Failed to get Paymob payment key')

    return res.status(200).json({
      paymentKey,
      orderId,
      iframeId: IFRAME_ID,
      iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentKey}`,
    })
  } catch (err) {
    console.error('[Paymob Error]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
