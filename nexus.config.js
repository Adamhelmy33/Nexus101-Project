/* ╔══════════════════════════════════════════════════════════════════╗
   ║                                                                  ║
   ║    NEXUS 101 — CENTRAL PRICING CONFIG                            ║
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
     1.  CURRENCY
     ═════════════════════════════════════════════════════════════════ */
  currency: 'EGP',


  /* ═════════════════════════════════════════════════════════════════
     2.  COURSE PRICING (direct EGP)
     ═════════════════════════════════════════════════════════════════
     Three layers, looked up in this order:
       (a) `coursePricesEgp[courseId]`              ← per-course override (highest priority)
       (b) `universities[universityId].defaultCoursePriceEgp`  ← per-university default
       (c) `defaultCoursePriceEgp`                  ← global fallback
     ───────────────────────────────────────────────────────────────── */
  defaultCoursePriceEgp: 900,

  universities: {
    /* 'id' must match the id in src/data/constants.js → UNIVERSITIES */
    uh:       { defaultCoursePriceEgp: 900,  label: 'University of Hertfordshire' },
    bue:      { defaultCoursePriceEgp: 900,  label: 'British University in Egypt' },
    guc:      { defaultCoursePriceEgp: 1000, label: 'German University in Cairo' },
    coventry: { defaultCoursePriceEgp: 850,  label: 'Coventry @ Knowledge Hub' },
  },

  /* Per-course overrides — only add a course here if its price differs
     from its university's default. Use the course id from constants.js. */
  coursePricesEgp: {
    'guc-dsa':       1100,    // harder course → premium price
    'bue-cpp':        950,
    'uh-prog-fund':   950,
    'cov-networks':   950,    // Networking is a premium Coventry module
  },


  /* ═════════════════════════════════════════════════════════════════
     3.  PAYMOB SETTINGS (frontend-visible bits only — secrets in .env)
     ═════════════════════════════════════════════════════════════════ */
  paymob: {},


  /* ═════════════════════════════════════════════════════════════════
     4.  CUSTOM COURSE GENERATOR  (AI-built playlists from syllabi)
     ═════════════════════════════════════════════════════════════════
     Set generationCostPoints to 0 to make it free for any logged-in user,
     or to e.g. 500 to charge 500 EGP per playlist build.
     ───────────────────────────────────────────────────────────────── */
  customCourse: {
    generationCostPoints: 0,        // free for now
    maxSegmentsPerPlaylist: 12,     // cap so playlists stay focused
    minMatchScore: 0.45,            // lower = more permissive RAG matches
  },


  /* ═════════════════════════════════════════════════════════════════
     5.  BUNNY.NET / VIDEO INFRASTRUCTURE
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
     6.  STUDY BUDDY (AI tutor chat) — fair-use limits
     ═════════════════════════════════════════════════════════════════ */
  studyBuddy: {
    questionsPerDayFree:    30,
    questionsPerDayPremium: 200,
  },
}

export default nexusConfig
