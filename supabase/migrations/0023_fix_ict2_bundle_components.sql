-- ═══════════════════════════════════════════════════════════════════
-- Nexus 101 — Fix ICT2 Sem 1 Bundle Components
-- ═══════════════════════════════════════════════════════════════════
-- Root cause identified:
--   Migration 0020 searched for ci.slug = 'test-2' to build ICT2
--   bundle_components. But the actual "Exam 2" item has slug = 'final'
--   (the course_items table schema only allows: test-1, test-2, final).
--   At data entry time, "Exam 2" was stored under the 'final' slug,
--   NOT 'test-2'. So the INSERT returned 0 rows — silent no-op.
--
-- Effect: ICT2 Sem 1 bundle has 0 bundle_components → renders:
--   - "Coming soon" button (buyFormUrl = null, no component to pull url from)
--   - blank "Includes:" line (componentsList = '')
--   - no "Save 15%" pill (listPrice = 0, discountPct = 0)
--
-- Fix: Insert the two missing bundle_components using the correct
--   item IDs (slug='final' for both Chem1 and Bio1 Exam 2 items).
--
-- Confirmed IDs (verified live against DB):
--   ICT2 bundle:   d2000000-0003-0000-0000-000000000001
--   Chem1 course:  b1000000-0000-0000-0000-00000000001b  (slug: uh-pharma-chem1-ifp)
--   Chem1 Exam2:   919ec7e9-564d-415a-887b-61e23e885e3e  (slug: final, title: Exam 2, price: 800)
--   Bio1 course:   b1000000-0000-0000-0000-00000000001c  (slug: uh-pharma-bio1-ifp)
--   Bio1 Exam2:    ccf6c143-36a9-419f-9660-e9e08c6f3a6c  (slug: final, title: Exam 2, price: 800)
-- ═══════════════════════════════════════════════════════════════════

-- ── STEP 1: Insert missing bundle_components for ICT2 Sem 1 ──────

-- Chem1 Exam 2 component (slug='final' is what "Exam 2" uses in this DB)
INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT
  'd2000000-0003-0000-0000-000000000001',
  c.id,
  ci.id
FROM courses c
JOIN course_items ci ON ci.course_id = c.id
WHERE c.slug  = 'uh-pharma-chem1-ifp'
  AND ci.slug = 'final'
  AND ci.title ILIKE '%exam 2%'
ON CONFLICT DO NOTHING;

-- Bio1 Exam 2 component
INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT
  'd2000000-0003-0000-0000-000000000001',
  c.id,
  ci.id
FROM courses c
JOIN course_items ci ON ci.course_id = c.id
WHERE c.slug  = 'uh-pharma-bio1-ifp'
  AND ci.slug = 'final'
  AND ci.title ILIKE '%exam 2%'
ON CONFLICT DO NOTHING;

-- Fallback: if title filter was too strict, try without it
INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT
  'd2000000-0003-0000-0000-000000000001',
  c.id,
  ci.id
FROM courses c
JOIN course_items ci ON ci.course_id = c.id
WHERE c.slug  = 'uh-pharma-chem1-ifp'
  AND ci.slug = 'final'
  AND NOT EXISTS (
    SELECT 1
    FROM bundle_components bc2
    WHERE bc2.bundle_id  = 'd2000000-0003-0000-0000-000000000001'
      AND bc2.course_id  = c.id
  )
ON CONFLICT DO NOTHING;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT
  'd2000000-0003-0000-0000-000000000001',
  c.id,
  ci.id
FROM courses c
JOIN course_items ci ON ci.course_id = c.id
WHERE c.slug  = 'uh-pharma-bio1-ifp'
  AND ci.slug = 'final'
  AND NOT EXISTS (
    SELECT 1
    FROM bundle_components bc2
    WHERE bc2.bundle_id  = 'd2000000-0003-0000-0000-000000000001'
      AND bc2.course_id  = c.id
  )
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION — Run these after the fix to confirm
-- ═══════════════════════════════════════════════════════════════════

-- V1: ICT2 bundle + its components
SELECT
  b.id               AS bundle_id,
  b.name             AS bundle_name,
  b.price_egp        AS bundle_price,
  b.published,
  c.slug             AS course_slug,
  c.title            AS course_title,
  c.buy_form_url,
  ci.slug            AS item_slug,
  ci.title           AS item_title,
  ci.price_egp       AS item_price
FROM bundles b
JOIN bundle_components bc ON bc.bundle_id = b.id
JOIN courses c             ON c.id = bc.course_id
LEFT JOIN course_items ci  ON ci.id = bc.item_id
WHERE b.id = 'd2000000-0003-0000-0000-000000000001'
ORDER BY c.slug;

-- V2: Calculated UI values (what Store.jsx will compute)
SELECT
  b.name                            AS bundle_name,
  b.price_egp                       AS real_price,
  SUM(ci.price_egp)                 AS list_price,
  SUM(ci.price_egp) - b.price_egp  AS savings_egp,
  ROUND(
    (SUM(ci.price_egp) - b.price_egp) / SUM(ci.price_egp) * 100
  )                                 AS discount_pct,
  BOOL_OR(c.buy_form_url IS NOT NULL) AS has_buy_url,
  STRING_AGG(
    c.title || ' (' || ci.title || ')',
    ' + '
    ORDER BY c.slug
  )                                 AS includes_text
FROM bundles b
JOIN bundle_components bc ON bc.bundle_id = b.id
JOIN courses c             ON c.id = bc.course_id
JOIN course_items ci       ON ci.id = bc.item_id
WHERE b.id = 'd2000000-0003-0000-0000-000000000001'
GROUP BY b.id, b.name, b.price_egp;

-- V3: Side-by-side comparison ICT1 vs ICT2 Sem 1
SELECT
  b.name,
  b.price_egp,
  b.published,
  COUNT(bc.id)                        AS component_count,
  BOOL_OR(c.buy_form_url IS NOT NULL) AS has_buy_url,
  SUM(ci.price_egp)                   AS list_price,
  ROUND(
    CASE WHEN SUM(ci.price_egp) > 0
    THEN (SUM(ci.price_egp) - b.price_egp) / SUM(ci.price_egp) * 100
    ELSE 0 END
  )                                   AS discount_pct,
  STRING_AGG(
    c.title || ' (' || ci.title || ')',
    ' + '
    ORDER BY c.slug
  )                                   AS includes_text
FROM bundles b
LEFT JOIN bundle_components bc ON bc.bundle_id = b.id
LEFT JOIN courses c             ON c.id = bc.course_id
LEFT JOIN course_items ci       ON ci.id = bc.item_id
WHERE b.subject = 'pharmacy'
  AND b.study_level = 'ifp'
  AND b.published = true
  AND b.name ILIKE '%chem%'
  AND b.name ILIKE '%bio%'
GROUP BY b.id, b.name, b.price_egp, b.published
ORDER BY b.name;
