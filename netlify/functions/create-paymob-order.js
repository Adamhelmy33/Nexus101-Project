/* ═══════════════════════════════════════════════════════════════════
   Netlify Function — create-paymob-order
   ═══════════════════════════════════════════════════════════════════
   3-step Paymob "Accept" flow:
     Step 1 → Auth Token       (POST /api/auth/tokens)
     Step 2 → Order Register   (POST /api/ecommerce/orders)
     Step 3 → Payment Key      (POST /api/acceptance/payment_keys)
   Returns the iframe URL so the frontend can open it securely.

   Env vars (set in Netlify → Site → Environment variables):
     PAYMOB_API_KEY            — Secret API key from accept.paymob.com
     PAYMOB_INTEGRATION_CARD   — Integration ID for card payments
     PAYMOB_INTEGRATION_WALLET — Integration ID for wallet payments
     PAYMOB_INTEGRATION_KIOSK  — Integration ID for kiosk / Fawry
     PAYMOB_IFRAME_ID          — iFrame ID from Paymob portal
     SUPABASE_URL              — For optional server-side validation
     SUPABASE_SERVICE_ROLE_KEY — Service role (never exposed to browser)
   ═══════════════════════════════════════════════════════════════════ */

const PAYMOB_BASE = 'https://accept.paymob.com/api'

/* ── Env helpers (fail loudly if missing) ─────────────────────── */
function requireEnv(name) {
  const val = process.env[name]
  if (!val || val.startsWith('your_')) {
    throw new Error(`Missing env var: ${name}. Set it in Netlify → Environment variables.`)
  }
  return val
}

function integrationIdFor(method) {
  const map = {
    card:   'PAYMOB_INTEGRATION_CARD',
    wallet: 'PAYMOB_INTEGRATION_WALLET',
    kiosk:  'PAYMOB_INTEGRATION_KIOSK',
  }
  const envKey = map[method] || map.card
  return requireEnv(envKey)
}

/* ── JSON POST helper ─────────────────────────────────────────── */
async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Paymob ${url} failed (${res.status}): ${text}`)
  }
  return res.json()
}

/* ── Main handler ─────────────────────────────────────────────── */
exports.handler = async (event) => {
  /* Only allow POST */
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const {
      amount_cents,       // total in piasters (e.g. 1200 EGP = 120000 cents)
      bundle_points,      // NXP being purchased (for merchant_order_id)
      currency = 'EGP',
      method = 'card',    // 'card' | 'wallet' | 'kiosk'
      user_email,
      user_name,
      user_phone = 'N/A',
      course_id = null,   // optional — if top-up is tied to a specific course
    } = JSON.parse(event.body || '{}')

    if (!amount_cents || !user_email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'amount_cents and user_email are required.' }),
      }
    }

    const apiKey      = requireEnv('PAYMOB_API_KEY')
    const iframeId    = requireEnv('PAYMOB_IFRAME_ID')
    const integId     = integrationIdFor(method)

    /* ────────────────────────────────────────────────
       Step 1: Authentication Request → auth token
       ──────────────────────────────────────────────── */
    const authRes = await post(`${PAYMOB_BASE}/auth/tokens`, {
      api_key: apiKey,
    })
    const authToken = authRes.token

    /* ────────────────────────────────────────────────
       Step 2: Order Registration
       ──────────────────────────────────────────────── */
    const merchantOrderId = `NXP-${bundle_points || 0}-${Date.now()}`
    const orderRes = await post(`${PAYMOB_BASE}/ecommerce/orders`, {
      auth_token:         authToken,
      delivery_needed:    false,
      amount_cents:       amount_cents,
      currency:           currency,
      merchant_order_id:  merchantOrderId,
      items: [
        {
          name:         `Nexus Points Bundle (${bundle_points} NXP)`,
          amount_cents: amount_cents,
          quantity:     1,
          description:  course_id
            ? `Top-up for course ${course_id}`
            : 'Wallet top-up',
        },
      ],
    })
    const orderId = orderRes.id

    /* ────────────────────────────────────────────────
       Step 3: Payment Key Request → tokenized key
       ──────────────────────────────────────────────── */
    const paymentKeyRes = await post(`${PAYMOB_BASE}/acceptance/payment_keys`, {
      auth_token:     authToken,
      amount_cents:   amount_cents,
      expiration:     3600,                // 1 hour
      order_id:       orderId,
      currency:       currency,
      integration_id: parseInt(integId, 10),
      billing_data: {
        first_name:     (user_name || 'Nexus').split(' ')[0],
        last_name:      (user_name || 'Student').split(' ').slice(1).join(' ') || 'Student',
        email:          user_email,
        phone_number:   user_phone,
        /* Required by Paymob but not used */
        apartment:      'N/A',
        floor:          'N/A',
        street:         'N/A',
        building:       'N/A',
        shipping_method:'N/A',
        postal_code:    'N/A',
        city:           'N/A',
        country:        'EG',
        state:          'N/A',
      },
      /* Pass bundle info so webhook can credit the right amount */
      extra: {
        bundle_points:      String(bundle_points || 0),
        course_id:          course_id || '',
        user_email:         user_email,
        merchant_order_id:  merchantOrderId,
      },
    })

    const paymentToken = paymentKeyRes.token

    /* ── Build the iframe URL ─────────────────────── */
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        iframe_url:          iframeUrl,
        payment_token:       paymentToken,
        order_id:            orderId,
        merchant_order_id:   merchantOrderId,
      }),
    }
  } catch (err) {
    console.error('[create-paymob-order] Error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message || 'Internal server error.' }),
    }
  }
}
