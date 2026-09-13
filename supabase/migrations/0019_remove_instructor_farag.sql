-- ═══════════════════════════════════════════════════════════════════
-- Nexus 101 — Remove Mohamed Farag from instructors
-- ═══════════════════════════════════════════════════════════════════
-- Mohamed Farag was inserted directly via the Supabase Table Editor
-- and has no corresponding entry in constants.js or any seed file.
-- No soft-delete pattern exists in this schema; this is a hard DELETE.
--
-- His Eng Math 1 & 2 course_instructors links were already cleared
-- by migration 0018 (which did DELETE … WHERE slug IN
-- ('uh-eng-math1-ifp','uh-eng-math2-ifp')).
-- This migration does a defensive cleanup of any remaining links
-- before removing the row.
-- ═══════════════════════════════════════════════════════════════════

-- ── STEP 1 — Defensive: remove any remaining course_instructors rows ──
-- Farag has no slug in our codebase; match by name to be safe.
DELETE FROM course_instructors
WHERE instructor_id IN (
  SELECT id FROM instructors
  WHERE name ILIKE '%farag%'
);

-- ── STEP 2 — Remove from instructor_universities ─────────────────────
DELETE FROM instructor_universities
WHERE instructor_id IN (
  SELECT id FROM instructors
  WHERE name ILIKE '%farag%'
);

-- ── STEP 3 — Delete the instructor row ───────────────────────────────
DELETE FROM instructors
WHERE name ILIKE '%farag%';

-- ── STEP 4 — Verify: should return 0 rows ────────────────────────────
-- Run this SELECT after the deletes to confirm he is gone:
SELECT id, slug, name FROM instructors WHERE name ILIKE '%farag%';
