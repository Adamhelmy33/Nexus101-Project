# Nexus 101 — Phase 2 Architecture & Setup Guide

This document explains everything that was added in Phase 2 and how to flip from the local-storage demo to a real production backend.

---

## What Got Built (already running on `npm run dev`)

| Feature | Where it lives | Demo route |
|---|---|---|
| Nexus Points wallet (ledger + balance) | `src/lib/wallet.js` | `/wallet` |
| Wallet balance badge in navbar | `src/components/wallet/WalletBalanceBadge.jsx` | top-right pill when signed in |
| Free-course progress bar | `src/components/wallet/FreeCourseProgress.jsx` | dashboard + wallet |
| Loyalty tier (Bronze/Silver/Gold/Platinum) | `src/components/wallet/LoyaltyTierCard.jsx` | dashboard + wallet |
| 1200-point bundle purchase modal | `src/components/wallet/BundlePurchaseModal.jsx` | wallet "Buy Points" button |
| Course checkout in points | `src/pages/Checkout.jsx` | `/checkout/<course-id>` |
| Watch-session tracking + topic mastery | `src/lib/progress.js` | (background) |
| Skill Heatmap (CSS grid, mastery-driven) | `src/components/dashboard/SkillHeatmap.jsx` | `/dashboard` |
| Hours chart (Recharts stacked bars) | `src/components/dashboard/HoursChart.jsx` | `/dashboard` |
| Student dashboard | `src/pages/Dashboard.jsx` | `/dashboard` |
| AI Study Buddy chat widget | `src/components/studyBuddy/StudyBuddyWidget.jsx` | floating button (bottom-right) |

---

## Demo Flow (no backend required)

1. `npm run dev` → http://localhost:5173
2. Sign in as `demo@student.com` / `demo123`
3. Top-right of navbar shows your Nexus Points pill (starts at 0)
4. Click → opens `/wallet`
5. Click **Buy 1200 NXP** → simulated Paymob flow → wallet updates
6. Go to **Store** → pick a module → checkout pays in points (1000 NXP)
7. Open `/dashboard` → Skill Heatmap, hours chart, loyalty tier, free-course progress
8. Click the floating ✨ button (bottom-right) → Study Buddy chat (smart mock until you wire Anthropic key)
9. Repeat the bundle-buy 5 times → watch the free-course progress unlock at 1000 residual

---

## Switching from localStorage Demo to Real Production

The whole demo is structured so swapping the backend = changing 3 small files. Everything else stays.

### 1. Create the Supabase project

```bash
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push        # applies all migrations in supabase/migrations/
npx supabase functions deploy paymob-init
npx supabase functions deploy paymob-webhook
npx supabase functions deploy study-buddy-chat
```

### 2. Set the secrets (in Supabase dashboard → Project Settings → Edge Functions)

```
PAYMOB_API_KEY            = (Settings → Account Info → API Key)
PAYMOB_HMAC_SECRET        = (Settings → Account Info → HMAC)
PAYMOB_INTEGRATION_CARD   = (Developers → Payment Integrations)
PAYMOB_INTEGRATION_WALLET = (same)
PAYMOB_INTEGRATION_KIOSK  = (same)
PAYMOB_IFRAME_ID          = (Developers → iFrame)
ANTHROPIC_API_KEY         = sk-ant-...
OPENAI_API_KEY            = sk-...
```

### 3. Tell Paymob about your webhook URL

In your Paymob dashboard → **Developers → Transaction Processing Callbacks** → set the **Transaction processed callback** to:

```
https://YOUR-PROJECT.supabase.co/functions/v1/paymob-webhook
```

This is the URL Paymob will hit on every transaction with the HMAC signature.

### 4. Swap the frontend client (3 file changes)

In `src/lib/wallet.js` — replace `getWalletState`, `creditWallet`, `redeemCourse` with calls to:
- `supabase.from('wallet_balances').select(...)`
- `supabase.rpc('credit_wallet', {...})` (server-only — only the webhook calls this)
- `supabase.rpc('redeem_course', { p_course_id })`

In `src/lib/progress.js` — same pattern (Supabase queries instead of localStorage reads).

In `src/lib/studyBuddy.js` — change the `API_PATH` to your Edge Function URL: `https://YOUR-PROJECT.supabase.co/functions/v1/study-buddy-chat`.

### 5. Migrate auth

Replace the localStorage auth in `src/contexts/AuthContext.jsx` with Supabase Auth:

```js
import { supabase } from '../lib/supabase'

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? { ok: false, error: error.message } : { ok: true, user: data.user }
}
```

That's it. The UI code doesn't change.

---

## Wallet Math Cheat Sheet

| Action | Wallet | Lifetime Deposited |
|---|---|---|
| Buy 1200 bundle | +1200 | +1200 |
| Enroll in course | −1000 | (no change) |
| 5 buys + 5 enrolls | 1000 | 6000 |
| Enroll 6th course | 0 | (no change) ← **free** |

Loyalty tiers (cosmetic, by lifetime deposited):
- **Bronze** 0
- **Silver** 5,000+
- **Gold** 15,000+
- **Platinum** 30,000+

---

## What's NOT Built Yet (deliberate next-step work)

- **Real Supabase migration of auth + courses** — code is ready but not wired (see "Switching" above).
- **Course materials ingestion** — the RAG schema exists; you need to write a one-off script that reads PDFs from your storage bucket, chunks them, embeds, and inserts into `course_chunks`. (~50 lines.)
- **Quiz feature inside Study Buddy** — backend supports it (`generateQuiz()` in `studyBuddy.js`), but no dedicated quiz card component yet.
- **Refund flow** — Paymob refund webhooks aren't handled. Decide your policy first (debit wallet? lock account?).
- **Realtime balance updates** — currently the badge updates only after navigation. Easy add: `supabase.channel('wallet').on(...)`.

---

## File Tree (added in Phase 2)

```
src/
├── lib/
│   ├── wallet.js             ← NEW: wallet ledger / balance / redeem
│   ├── progress.js           ← NEW: watch sessions + topic mastery
│   └── studyBuddy.js         ← NEW: AI client w/ smart mock fallback
├── contexts/
│   └── WalletContext.jsx     ← NEW
├── components/
│   ├── wallet/
│   │   ├── WalletBalanceBadge.jsx
│   │   ├── FreeCourseProgress.jsx
│   │   ├── LoyaltyTierCard.jsx
│   │   └── BundlePurchaseModal.jsx
│   ├── dashboard/
│   │   ├── SkillHeatmap.jsx
│   │   └── HoursChart.jsx
│   └── studyBuddy/
│       └── StudyBuddyWidget.jsx
├── pages/
│   ├── Dashboard.jsx         ← NEW
│   └── Wallet.jsx            ← NEW
└── data/
    └── topics.js             ← NEW: per-course skill atoms

supabase/
├── config.toml
├── migrations/
│   ├── 0001_init_schema.sql       ← all 14 tables
│   ├── 0002_rls_policies.sql      ← row-level security
│   ├── 0003_wallet_functions.sql  ← credit_wallet & redeem_course RPCs
│   └── 0004_pgvector_rag.sql      ← AI chunks + match_course_chunks
└── functions/
    ├── paymob-init/index.ts        ← 3-step Paymob auth → order → key
    ├── paymob-webhook/index.ts     ← HMAC-validated callback → credit wallet
    └── study-buddy-chat/index.ts   ← OpenAI embed → pgvector retrieve → Claude

api/
└── study-buddy.js                  ← Vercel-style fallback (uses Anthropic only)
```
