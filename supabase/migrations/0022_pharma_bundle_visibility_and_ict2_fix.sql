-- ═══════════════════════════════════════════════════════════════════
-- Nexus 101 — Hide Sem 2 Pharma bundles + fix ICT2 Sem 1 buy button
-- ═══════════════════════════════════════════════════════════════════
-- Changes:
--   1. Set published = false on all 3 Semester 2 Pharma bundles
--   2. Fix "Coming soon" on ICT2 Sem 1 by ensuring:
--      a) bundle_components rows exist (Chemistry 1 test-2 + Biology 1 test-2)
--      b) The component courses (Chem1, Bio1) have buy_form_url set,
--         copied from the working Sem 1 Whole Modules bundle's courses
--
-- Visibility mechanism: Store.jsx line 640 → .eq('published', true)
-- Buy button mechanism: Store.jsx line 1186-1205 → buyFormUrl from
--   first bundle_component whose course.buy_form_url is non-null
-- ═══════════════════════════════════════════════════════════════════

-- ── STEP 1: Hide the 3 Semester 2 bundles ────────────────────────

UPDATE bundles
SET published = false
WHERE subject = 'pharmacy'
  AND study_level = 'ifp'
  AND (
    name ILIKE '%semester 2%'
    OR name ILIKE '%sem 2%'
  );

-- ── STEP 2: Fix ICT2 Sem 1 buy_form_url ──────────────────────────

-- 2a. Ensure bundle_components exist for ICT2 Sem 1
--     (Chemistry 1 test-2 + Biology 1 test-2)
--     The bundle name from migration 0020: 'Pharma ICT2 Bundle: Chemistry 1 + Biology 1 (Exam 2, Sem 1)'
INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT b.id, ci.course_id, ci.id
FROM bundles b
CROSS JOIN (
  SELECT ci.id, ci.course_id
  FROM course_items ci
  JOIN courses c ON c.id = ci.course_id
  WHERE c.slug = 'uh-pharma-chem1-ifp'
    AND ci.slug = 'test-2'
) ci
WHERE b.name ILIKE '%ict2%'
  AND b.name ILIKE '%chem%'
  AND b.name ILIKE '%bio%'
  AND b.name ILIKE '%sem 1%'
  AND b.subject = 'pharmacy'
ON CONFLICT DO NOTHING;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT b.id, ci.course_id, ci.id
FROM bundles b
CROSS JOIN (
  SELECT ci.id, ci.course_id
  FROM course_items ci
  JOIN courses c ON c.id = ci.course_id
  WHERE c.slug = 'uh-pharma-bio1-ifp'
    AND ci.slug = 'test-2'
) ci
WHERE b.name ILIKE '%ict2%'
  AND b.name ILIKE '%chem%'
  AND b.name ILIKE '%bio%'
  AND b.name ILIKE '%sem 1%'
  AND b.subject = 'pharmacy'
ON CONFLICT DO NOTHING;

-- 2b. Copy buy_form_url from Chemistry 1 and Biology 1 courses
--     to themselves (ensure it's set) by pulling from whichever
--     Sem 1 Pharma bundle component already has it.
--     If courses.buy_form_url is already set, this is a no-op.
--     If it's NULL on Chem1, copy it from the first Sem 1 bundle
--     component that has a non-null buy_form_url on any Pharma course.
UPDATE courses
SET buy_form_url = (
  SELECT c2.buy_form_url
  FROM bundle_components bc
  JOIN bundles b ON b.id = bc.bundle_id
  JOIN courses c2 ON c2.id = bc.course_id
  WHERE b.subject = 'pharmacy'
    AND b.study_level = 'ifp'
    AND b.published = true
    AND c2.buy_form_url IS NOT NULL
  LIMIT 1
)
WHERE slug = 'uh-pharma-chem1-ifp'
  AND buy_form_url IS NULL;

UPDATE courses
SET buy_form_url = (
  SELECT c2.buy_form_url
  FROM bundle_components bc
  JOIN bundles b ON b.id = bc.bundle_id
  JOIN courses c2 ON c2.id = bc.course_id
  WHERE b.subject = 'pharmacy'
    AND b.study_level = 'ifp'
    AND b.published = true
    AND c2.buy_form_url IS NOT NULL
  LIMIT 1
)
WHERE slug = 'uh-pharma-bio1-ifp'
  AND buy_form_url IS NULL;

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION — Run these after the changes above
-- ═══════════════════════════════════════════════════════════════════

-- V1: All 6 Pharma IFP bundles — published state + price
SELECT
  b.name,
  b.price_egp,
  b.published,
  CASE WHEN b.published THEN '✅ LIVE' ELSE '🔒 HIDDEN' END AS status
FROM bundles b
WHERE b.subject = 'pharmacy'
  AND b.study_level = 'ifp'
ORDER BY b.published DESC, b.price_egp DESC, b.name;

-- V2: Buy button state — does each published bundle have a buy_form_url?
SELECT
  b.name                                     AS bundle_name,
  b.price_egp,
  b.published,
  BOOL_OR(c.buy_form_url IS NOT NULL)        AS has_buy_url,
  CASE
    WHEN NOT b.published                   THEN '🔒 Hidden (intended)'
    WHEN BOOL_OR(c.buy_form_url IS NOT NULL) THEN '🛒 Buy button active'
    ELSE                                        '⚠️  Coming soon (missing buy_form_url)'
  END AS button_state
FROM bundles b
JOIN bundle_components bc ON bc.bundle_id = b.id
JOIN courses c             ON c.id = bc.course_id
WHERE b.subject = 'pharmacy'
  AND b.study_level = 'ifp'
GROUP BY b.id, b.name, b.price_egp, b.published
ORDER BY b.published DESC, b.price_egp DESC, b.name;

-- V3: Confirm buy_form_url is set on the Sem 1 Pharma courses
SELECT slug, title, buy_form_url
FROM courses
WHERE slug IN (
  'uh-pharma-chem1-ifp',
  'uh-pharma-bio1-ifp'
)
ORDER BY slug;
