# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

No test runner is configured. There is no lint script; Vite handles it at build time.

## Deployment

The project has **two live deployments** that must stay in sync:

| Remote | Repo | Hosting | Notes |
|--------|------|---------|-------|
| `origin` | `Nagdy11/Nexus101-Project` | **Netlify** (primary) | May be ISP-blocked in some countries |
| `vercel` | `Adamhelmy33/Nexus101-Project` | **Vercel** (backup) | Fork; same codebase |

**Always push to both remotes on every commit** so they stay in sync:

```bash
git push origin main
git push vercel main
```

`netlify.toml` configures the Netlify build. The build command uses `--legacy-peer-deps` due to peer-dep conflicts in the dependency tree. `vercel.json` configures SPA fallback for Vercel.

## Architecture Overview

**Nexus 101** is a React 18 + Vite SPA — an EdTech platform for Egyptian university students (currently University of Hertfordshire / UH only). It presents a course catalog, directs all purchases to an external Google Form, and provides an AI Study Buddy tutor. There is **no in-site checkout, no payment processing, no video streaming, and no wallet/points system**.

### Provider tree

```
BrowserRouter → AuthProvider → <App />
```

`App.jsx` handles page transitions (Framer Motion) and hides the navbar/footer on admin and login routes.

### State management

All state is React Context — no Redux or Zustand.

- **AuthContext** (`src/contexts/AuthContext.jsx`) — current user, login/logout/register, `isAdmin` flag, 30-second heartbeat ping

### Data persistence

Auth state is **Supabase-backed** via `src/lib/supabase.js`. The `profiles` table stores extended user info populated by the `handle_new_user()` Postgres trigger on signup.

## Course Hierarchy (Supabase schema)

```
University (UH only)
  └── Subject  (engineering / physiotherapy / pharmacy)
        └── Track  (ifp / level-4)
              └── Course  (one module, e.g. "Cardiology")
                    └── course_items  (Test 1 / Test 2 / Final — varies per course)
                          └── course_item_parts  (3 standard parts each — mostly unused placeholders; video hosting was removed)
```

### Key table fields

| Table | Important columns |
|-------|-------------------|
| `subject_visibility` | `subject`, `track`, `is_visible`, `whatsapp_group_url` |
| `courses` | `published`, `buy_form_url`, `bundle_price_egp`, `free_revision_youtube_url` |
| `course_items` | `published`, `price_egp` |
| `bundles` | Cross-module bundles (e.g. "Cardio + Neuro") |
| `bundle_components` | Join table linking `bundles` → `courses` |
| `instructors` | Real instructor profiles |
| `course_instructors` | Join table linking instructors to courses |

### Pricing

- **Per-item price**: `course_items.price_egp`
- **Module bundle**: `courses.bundle_price_egp` — buying all items in a course together
- **Cross-module bundles**: `bundles` + `bundle_components` tables — combos spanning multiple courses within the same subject/track (e.g. "Cardio + Neuro")

Prices are **read from Supabase**, not from `nexus.config.js` (that file is now largely vestigial and can be ignored for pricing).

## Purchasing Flow

**All purchasing is 100% external.** Every "Buy" button links to `courses.buy_form_url`, which is a Google Form URL. Google Forms are grouped by the 5 subject/track combinations. No payment processing happens in the app.

## Visibility Controls

Visibility is controlled directly via the **Supabase Table Editor** — no code changes needed:

- `subject_visibility.is_visible` — toggle an entire subject/track on/off
- `courses.published` — show/hide a specific module
- `course_items.published` — show/hide a specific test/item

## Per-Subject Features

Each subject/track has two special features configured in Supabase:

1. **WhatsApp group popup** — `subject_visibility.whatsapp_group_url` — shown on every page visit for that subject/track (component: `WhatsAppGroupPopup.jsx`)
2. **Free revision video** — `courses.free_revision_youtube_url` — one free YouTube revision video slot per module, shown on the course detail page

## Routing & Pages

Routes are declared in `App.jsx`. `ProtectedRoute` wraps admin routes using `useAuth()`.

| Route | Page | Notes |
|-------|------|-------|
| `/` | `Home.jsx` | Landing page |
| `/store` | `Store.jsx` | Course catalog with subject/track filters |
| `/course/:id` | `CourseDetail.jsx` | Module detail, items, pricing, buy links |
| `/team` | `Team.jsx` | Team/instructor profiles |
| `/contact` | `Contact.jsx` | Contact form |
| `/login` | `Login.jsx` | Auth (Supabase) |
| `/admin-nexus` | `Admin.jsx` | Admin dashboard — students grouped by major |

## Signup & Profiles

Registration collects and stores these fields on the `profiles` table (populated by the `handle_new_user()` Supabase trigger):

- `name`
- `email` — must be `@gmail.com`
- `whatsapp_number`
- `is_returning_student`
- `referral_source`
- `high_school_system`
- `major_subject`
- `major_study_level`

## Admin Dashboard (`/admin-nexus`)

- Lists all registered students grouped by their `major_subject`
- Shows all signup profile fields per student
- Only accessible to users with `isAdmin === true`

## Lib Layer

| File | Responsibility |
|------|----------------|
| `src/lib/supabase.js` | Supabase client initialisation |
| `src/lib/auth.js` | Auth helpers, `pingActiveViewer()` |
| `src/lib/studyBuddy.js` | Claude API call (with mock fallback if no API key) |

### Hooks

| File | Responsibility |
|------|----------------|
| `src/hooks/useCatalog.js` | Fetches and shapes the full course catalog from Supabase (subjects → tracks → courses → items → bundles) |

## Key Components

| Component | Purpose |
|-----------|---------|
| `WhatsAppGroupPopup.jsx` | Per-subject WhatsApp group prompt, shown on every visit |
| `WhatsAppButton.jsx` | Floating WhatsApp support button |
| `WhatsAppTutorButton.jsx` | Floating Study Buddy / AI tutor button |
| `ParallaxBackground.jsx` | Decorative parallax effect on Home |
| `AnimatedCounter.jsx` | Animated stats counter |

## Study Buddy (AI tutor)

`src/lib/studyBuddy.js` calls the Claude API with a curriculum-aware prompt. Falls back gracefully to a mock response if `ANTHROPIC_API_KEY` is absent.

## Styling

Tailwind CSS v4 (configured via `@theme` directive in `src/index.css`, no separate `tailwind.config.*` file). Framer Motion handles page transitions and micro-animations.

## Environment Variables

Copy `.env.example` → `.env` and fill in:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY          # for Study Buddy; optional — falls back to mock
VITE_WHATSAPP_NUMBER
VITE_SUPPORT_EMAIL
```

The following are **no longer needed** and should not be added:
- `VITE_PAYMOB_*` — payment processing removed
- `BUNNY_*` — video streaming removed

## Removed Systems (do not re-add)

The following were intentionally removed from the codebase:

| System | What was removed |
|--------|-----------------|
| **Wallet / points** | `WalletContext`, `WalletProvider`, `src/lib/wallet.js`, wallet UI components |
| **Video streaming** | Bunny.net integration, `BunnyVideoPlayer`, `src/lib/bunny.js`, `CourseViewer.jsx` |
| **Paymob payments** | `api/paymob.js`, `Checkout.jsx`, all client payment flow |
| **Student dashboard** | Student-facing `Dashboard.jsx`, `MyCourses.jsx` |
| **Custom Course Builder** | `SyllabusUploader`, `PlaylistBuilder`, `CustomCoursePlayer`, `src/lib/customCourse.js` |
| **Legacy lib files** | `src/lib/progress.js`, `src/lib/pricing.js`, `src/lib/courseCache.js` |

## Git Workflow

- Always commit and push directly to `main`
- Do **NOT** create pull requests or feature branches
- Push to **both** remotes (`origin` → Netlify, `vercel` → Vercel) on every commit
