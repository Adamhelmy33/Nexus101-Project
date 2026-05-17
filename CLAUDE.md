# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

No test runner is configured. There is no lint script; Vite handles it at build time.

Deploy to Netlify: `netlify.toml` is configured. The build command includes `--legacy-peer-deps` due to peer-dep conflicts in the dependency tree.

## Architecture Overview

**Nexus 101** is a React 18 + Vite SPA — an EdTech platform for Egyptian university students. It covers course sales, video streaming (Bunny.net HLS), a points-based wallet, AI tutoring (Claude), and admin analytics.

### Provider tree

```
BrowserRouter → AuthProvider → WalletProvider → <App />
```

`App.jsx` handles page transitions (Framer Motion) and hides the navbar/footer on fullscreen routes (admin, login, video player).

### State management

All state is React Context — no Redux or Zustand.

- **AuthContext** (`src/contexts/AuthContext.jsx`) — current user, login/logout/register, `isAdmin` flag, 30s heartbeat ping
- **WalletContext** (`src/contexts/WalletContext.jsx`) — points balance, ledger, tier, free-course progress, cross-tab sync via `storage` events

### Data persistence

Auth and wallet are **localStorage-based** (client-side only), deliberately designed so the auth/wallet layer can be swapped to Supabase or Firebase without touching any UI components. The wallet uses an **append-only ledger** — balance is always re-derived from ledger rows, never stored as a mutable field.

### Pricing — single source of truth

**`nexus.config.js`** is the canonical source for all pricing logic: per-course price overrides, per-university defaults, global fallback, loyalty tier thresholds, "Buy 3 Get 1 Free" bundle multiplier, shelf bundle definitions, and Study Buddy daily limits. **Never hardcode prices or tier thresholds in components** — always pull from this config or from the helpers in `src/lib/pricing.js`.

### Lib layer

| File | Responsibility |
|---|---|
| `src/lib/pricing.js` | `pointsCostFor()`, `recommendedBundleFor()`, currency conversion |
| `src/lib/wallet.js` | Ledger read/write, `getWalletState()`, `creditWallet()`, `redeemCourse()` |
| `src/lib/auth.js` | localStorage auth, `initAuthDB()` seed, `pingActiveViewer()` |
| `src/lib/studyBuddy.js` | Claude API call (with mock fallback if no API key) |
| `src/lib/bunny.js` | HMAC-signed HLS URLs from backend, demo HLS fallback |
| `src/lib/customCourse.js` | AI syllabus parsing, segment matching, playlist builder |

### API (Netlify/Vercel serverless)

- `api/paymob.js` — server-side Paymob payment key creation (secrets never reach client)
- `api/study-buddy.js` — Claude 3.5 Sonnet with curriculum-aware prompt; graceful fallback if `ANTHROPIC_API_KEY` is absent

### Data constants

`src/data/constants.js` defines the 4 universities, 12+ courses, founders, team, and seed demo accounts. `src/data/topics.js` provides course-aware context injected into Study Buddy prompts. `src/data/segments.js` holds video segment metadata.

### Routing & protection

Routes are declared in `App.jsx`. `ProtectedRoute` wraps auth-gated and admin-only routes using `useAuth()`. Admin routes require `isAdmin === true`.

### Styling

Tailwind CSS v4 (configured via `@theme` directive in `src/index.css`, not a separate `tailwind.config.*` file). Framer Motion is the primary animation library — page transitions and widget interactions both use it.

### Video streaming

`src/components/video/BunnyVideoPlayer.jsx` uses HLS.js to play Bunny.net streams. Signed URLs are fetched from `api/bunny.js` (or a demo fallback) and refreshed on a configurable interval defined in `nexus.config.js`. `SocialDRMOverlay` deters screen-recording.

## Environment variables

Copy `.env.example` → `.env` and fill in:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `VITE_PAYMOB_*` keys
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`
- `BUNNY_*` credentials
- `VITE_WHATSAPP_NUMBER`, `VITE_SUPPORT_EMAIL`

## Git workflow
- Always commit and push directly to `main`
- Do NOT create pull requests or feature branches
