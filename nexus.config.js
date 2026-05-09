/* ╔══════════════════════════════════════════════════════════════════╗
   ║                                                                  ║
   ║    🪙  NEXUS 101 — CENTRAL PRICING CONFIG                        ║
   ║                                                                  ║
   ║    THIS IS THE ONLY FILE YOU EDIT TO CHANGE PRICES.              ║
   ║                                                                  ║
   ║    Open this file in VS Code, change a number, save — every      ║
   ║    page in the app updates automatically. Never hard-code a      ║
   ║    price anywhere else in the codebase.                          ║
   ║                                                                  ║
   ╚══════════════════════════════════════════════════════════════════╝ */

const nexusConfig = {

  /* ═════════════════════════════════════════════════════════════════
     1.  CURRENCY & EXCHANGE RATE
     ═════════════════════════════════════════════════════════════════
     Nexus Points (NXP) are the platform's internal currency.
     `exchangeRate` says how many EGP it costs to buy 1 NXP.
     ───────────────────────────────────────────────────────────────── */
  exchangeRate: 1,                 // 1 NXP = 1 EGP. Change to 0.5 to halve real prices, etc.
  currency: 'EGP',


  /* ═════════════════════════════════════════════════════════════════
     2.  COURSE PRICING (in Nexus Points)
     ═════════════════════════════════════════════════════════════════
     Two layers, looked up in this order:
       (a) `coursePrices[courseId]`           ← per-course override (highest priority)
       (b) `universities[universityId]`       ← per-university default
       (c) `defaultCoursePoints`              ← global fallback
     ───────────────────────────────────────────────────────────────── */
  defaultCoursePoints: 900,

  universities: {
    /* 'id' must match the id in src/data/constants.js → UNIVERSITIES */
    uh:       { defaultCoursePoints: 900,  label: 'University of Hertfordshire' },
    bue:      { defaultCoursePoints: 900,  label: 'British University in Egypt' },
    guc:      { defaultCoursePoints: 1000, label: 'German University in Cairo' },
    coventry: { defaultCoursePoints: 850,  label: 'Coventry @ Knowledge Hub' },
  },

  /* Per-course overrides — only add a course here if its price differs
     from its university's default. Use the course id from constants.js. */
  coursePrices: {
    'guc-dsa':       1100,    // harder course → premium price
    'bue-cpp':        950,
    'uh-prog-fund':   950,
    'cov-networks':   950,    // Networking is a premium Coventry module
  },


  /* ═════════════════════════════════════════════════════════════════
     3.  BUNDLE SHELF — what students see in the wallet
     ═════════════════════════════════════════════════════════════════
     These are pre-set "shelf" bundles users can browse. They are
     SEPARATE from the dynamic per-course bundle suggested at checkout.
     Order matters — first listed appears first.
     ───────────────────────────────────────────────────────────────── */
  bundles: [
    { id: 'starter', points: 1000, label: 'Starter',     description: 'Top up for one course' },
    { id: 'popular', points: 1200, label: 'Most Popular', description: 'One course + residual', popular: true },
    { id: 'duo',     points: 2400, label: 'Duo Pack',     description: 'Two full modules' },
    { id: 'term',    points: 4800, label: 'Term Pass',    description: 'A whole term of revisions', bestValue: true },
  ],


  /* ═════════════════════════════════════════════════════════════════
     4.  LOYALTY MATH — "Buy 3, Get 1 FREE"
     ═════════════════════════════════════════════════════════════════
     Bundle = course_price × bundleMultiplier, rounded UP to roundingStep.

     Default 4/3 means:
       • 750 NP course → 1000 NP bundle (250 residual = 750/3) → 3 buys → free 4th
       • 900 NP course → 1200 NP bundle (300 residual = 900/3) → 3 buys → free 4th

     Change the multiplier to make loyalty faster (smaller multiplier = more residual)
     or slower (closer to 1.0 = thinner residual).
     ───────────────────────────────────────────────────────────────── */
  loyalty: {
    bundleMultiplier:    4 / 3,        // bundle = course × 4/3
    bundleRoundingStep:  100,           // round bundle UP to nearest 100 NXP
    freeCourseAfter:     3,             // marketing copy: "buy N, get 1 free"
  },


  /* ═════════════════════════════════════════════════════════════════
     5.  COSMETIC LOYALTY TIERS  (Bronze / Silver / Gold / Platinum)
     ═════════════════════════════════════════════════════════════════
     Awarded based on lifetime points DEPOSITED (not balance).
     Cosmetic only — no gating, just badge + perk copy.
     ───────────────────────────────────────────────────────────────── */
  tiers: [
    { id: 'bronze',   name: 'Bronze',   min: 0,     color: '#cd7f32', perk: 'Welcome — keep going!' },
    { id: 'silver',   name: 'Silver',   min: 5000,  color: '#9ca3af', perk: 'Priority WhatsApp support' },
    { id: 'gold',     name: 'Gold',     min: 15000, color: '#f0a500', perk: 'Early access to new modules' },
    { id: 'platinum', name: 'Platinum', min: 30000, color: '#7c3aed', perk: 'Free 1-on-1 tutor session per term' },
  ],


  /* ═════════════════════════════════════════════════════════════════
     6.  PAYMOB SETTINGS (frontend-visible bits only — secrets in .env)
     ═════════════════════════════════════════════════════════════════ */
  paymob: {
    minBundlePoints: 500,    // smallest bundle Paymob will accept (hard floor)
    maxBundlePoints: 50000,  // ceiling, prevents typos
  },


  /* ═════════════════════════════════════════════════════════════════
     7.  CUSTOM COURSE GENERATOR  (AI-built playlists from syllabi)
     ═════════════════════════════════════════════════════════════════
     Set generationCostPoints to 0 to make it free for any logged-in user,
     or to e.g. 500 to charge 500 NXP per playlist build.
     ───────────────────────────────────────────────────────────────── */
  customCourse: {
    generationCostPoints: 0,        // free for now — bump to 500 to monetise
    maxSegmentsPerPlaylist: 12,     // cap so playlists stay focused
    minMatchScore: 0.45,            // lower = more permissive RAG matches
  },


  /* ═════════════════════════════════════════════════════════════════
     8.  BUNNY.NET / VIDEO INFRASTRUCTURE
     ═════════════════════════════════════════════════════════════════
     Real keys live in .env (BUNNY_LIBRARY_ID, BUNNY_SECURITY_KEY, etc.)
     This block is just the public-safe runtime knobs.
     ───────────────────────────────────────────────────────────────── */
  bunny: {
    signedUrlTtlSec:    3600,       // signed URL expires after 1 hour
    refreshAtSecRemaining: 600,     // refresh once 10 min are left
    /* When no real Bunny keys are configured, the player falls back to
       this public test stream so the UI is fully functional in demo mode. */
    demoFallbackHls:    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },


  /* ═════════════════════════════════════════════════════════════════
     9.  STUDY BUDDY (AI tutor chat) — fair-use limits
     ═════════════════════════════════════════════════════════════════ */
  studyBuddy: {
    questionsPerDayFree:    30,
    questionsPerDayPremium: 200,    // unlocked at Silver tier and above
  },
}

export default nexusConfig
