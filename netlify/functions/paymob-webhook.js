/* ═══════════════════════════════════════════════════════════════════
   Netlify Function — paymob-webhook
   ═══════════════════════════════════════════════════════════════════
   Paymob calls this URL after every transaction (success or fail).
   We:
     1. Verify the HMAC signature to prove it's really from Paymob.
     2. If success=true, update the `purchases` table in Supabase
        with `payment_status = 'success'`.
     3. Credit the user's wallet (via Supabase RPC or direct insert).
     4. Return 200 so Paymob stops retrying.

   Env vars (set in Netlify → Site → Environment variables):
     PAYMOB_HMAC_SECRET        — HMAC secret from Paymob portal
     SUPABASE_URL              — Supabase project URL
     SUPABASE_SERVICE_ROLE_KEY — Service role key (server-only)
   ═══════════════════════════════════════════════════════════════════ */

const crypto = require('crypto')

/* ── Env helpers ──────────────────────────────────────────────── */
function requireEnv(name) {
  const val = process.env[name]
  if (!val || val.startsWith('your_')) {
    throw new Error(`Missing env var: ${name}`)
  }
  return val
}

/* ── Paymob HMAC verification ─────────────────────────────────
   Paymob signs using a specific subset of fields concatenated in
   a defined order. This recreates that string and compares HMACs.
   Reference: https://docs.paymob.com/docs/hmac-calculation
   ─────────────────────────────────────────────────────────────── */
function verifyHmac(data, receivedHmac, secret) {
  /* Paymob HMAC fields — must be in this exact alphabetical order */
  const fields = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order.id',
    'owner',
    'pending',
    'source_data.pan',
    'source_data.sub_type',
    'source_data.type',
    'success',
  ]

  /* Resolve nested keys from the transaction object */
  const resolve = (obj, path) => {
    return path.split('.').reduce((o, k) => (o != null ? o[k] : ''), obj)
  }

  const concatenated = fields
    .map(f => String(resolve(data, f) ?? ''))
    .join('')

  const computed = crypto
    .createHmac('sha512', secret)
    .update(concatenated)
    .digest('hex')

  return computed === receivedHmac
}

/* ── Supabase helper (using service role for server-side writes) ── */
async function supabasePost(path, body) {
  const url = requireEnv('SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  const res = await fetch(`${url}/rest/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        key,
      'Authorization': `Bearer ${key}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase POST ${path} failed (${res.status}): ${text}`)
  }
}

async function supabasePatch(path, body) {
  const url = requireEnv('SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  const res = await fetch(`${url}/rest/v1${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        key,
      'Authorization': `Bearer ${key}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase PATCH ${path} failed (${res.status}): ${text}`)
  }
}

/* ── Main handler ─────────────────────────────────────────────── */
exports.handler = async (event) => {
  /* Paymob sends POST with JSON body + hmac query param */
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const hmacSecret = requireEnv('PAYMOB_HMAC_SECRET')

    /* Parse the callback payload */
    const payload = JSON.parse(event.body || '{}')
    const txn     = payload.obj      // the transaction object
    const type    = payload.type     // 'TRANSACTION' etc.

    if (!txn) {
      console.warn('[paymob-webhook] No transaction object in payload.')
      return { statusCode: 400, body: 'Missing transaction object.' }
    }

    /* ── Step 1: Verify HMAC ──────────────────────── */
    const receivedHmac = event.queryStringParameters?.hmac
      || event.headers?.['x-paymob-hmac']
      || ''

    if (!verifyHmac(txn, receivedHmac, hmacSecret)) {
      console.error('[paymob-webhook] HMAC verification failed.')
      return { statusCode: 403, body: 'HMAC verification failed.' }
    }

    console.log(`[paymob-webhook] HMAC verified ✓ | txn=${txn.id} | success=${txn.success}`)

    /* ── Step 2: Only process successful transactions ── */
    if (!txn.success) {
      console.log(`[paymob-webhook] Transaction ${txn.id} was NOT successful. Skipping.`)
      return { statusCode: 200, body: JSON.stringify({ received: true, processed: false }) }
    }

    /* ── Step 3: Extract metadata from the order ────── */
    const order        = txn.order || {}
    const extra        = txn.payment_key_claims?.extra || {}
    const userEmail    = extra.user_email || order.shipping_data?.email || ''
    const bundlePoints = parseInt(extra.bundle_points || '0', 10)
    const courseId     = extra.course_id || null
    const merchantOrderId = extra.merchant_order_id || order.merchant_order_id || ''

    if (!userEmail) {
      console.warn('[paymob-webhook] No user_email found in transaction metadata.')
      return { statusCode: 200, body: JSON.stringify({ received: true, processed: false, reason: 'no_email' }) }
    }

    /* ── Step 4: Update purchases table ───────────── */
    /* Upsert a row in the paymob_transactions table for audit trail */
    try {
      await supabasePost('/paymob_transactions', {
        paymob_txn_id:      String(txn.id),
        order_id:           String(order.id || ''),
        merchant_order_id:  merchantOrderId,
        user_email:         userEmail,
        amount_cents:       txn.amount_cents,
        currency:           txn.currency || 'EGP',
        payment_status:     'success',
        bundle_points:      bundlePoints,
        course_id:          courseId,
        integration_id:     String(txn.integration_id || ''),
        source_type:        txn.source_data?.type || '',
        source_subtype:     txn.source_data?.sub_type || '',
        raw_payload:        JSON.stringify(payload),
        created_at:         new Date().toISOString(),
      })
      console.log(`[paymob-webhook] Recorded transaction ${txn.id} in paymob_transactions.`)
    } catch (err) {
      /* Log but don't fail — the table may not exist yet in dev */
      console.warn('[paymob-webhook] Could not write paymob_transactions:', err.message)
    }

    /* ── Step 5: Credit wallet in purchases table ──── */
    /* When Paymob succeeds, we mark any pending purchase for this
       merchant_order_id as paid. If your purchases table tracks
       payment_status, we update it here. */
    if (merchantOrderId) {
      try {
        await supabasePatch(
          `/purchases?txn_id=eq.${encodeURIComponent(merchantOrderId)}`,
          { payment_status: 'success' }
        )
        console.log(`[paymob-webhook] Updated purchase ${merchantOrderId} → payment_status=success`)
      } catch (err) {
        console.warn('[paymob-webhook] Could not update purchase:', err.message)
      }
    }

    /* ── Step 6: Credit wallet points via Supabase RPC ── */
    /* When you create the `credit_wallet` RPC in Supabase, uncomment:
    try {
      await supabaseRpc('credit_wallet', {
        p_user_email:    userEmail,
        p_points:        bundlePoints,
        p_paymob_txn_id: String(txn.id),
        p_integration:   txn.source_data?.type || 'card',
        p_amount_egp:    Math.round(txn.amount_cents / 100),
      })
      console.log(`[paymob-webhook] Credited ${bundlePoints} NXP to ${userEmail}`)
    } catch (err) {
      console.error('[paymob-webhook] Failed to credit wallet:', err.message)
    }
    */

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        received:  true,
        processed: true,
        txn_id:    txn.id,
        user:      userEmail,
        points:    bundlePoints,
      }),
    }
  } catch (err) {
    console.error('[paymob-webhook] Error:', err)
    /* Return 200 anyway to prevent Paymob from hammering retries on
       a persistent error. Log the failure for manual investigation. */
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, processed: false, error: err.message }),
    }
  }
}
