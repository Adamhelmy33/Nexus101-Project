-- ═══════════════════════════════════════════════════════════════════
-- Nexus 101 — Remove 2 duplicate Pharma ICT bundles
-- ═══════════════════════════════════════════════════════════════════
-- Two pre-existing duplicate bundles appeared after migration 0020
-- inserted the correct ICT1/ICT2 bundles. These duplicates have:
--   • Old names: "Pharma Bundle: Chemistry 1 + Biology 1 (Exam 1/2, Sem 1)"
--   • Old price: 1,190 EGP  (shows "Save 26%" — not on pricing sheet)
--   • Same course components as the correct ICT1/ICT2 Sem 1 bundles
--
-- Safe: we match by BOTH name fragment AND price to avoid accidentally
-- touching the correct ICT1/ICT2 bundles (which are named differently
-- and priced at 1,360 EGP).
-- ═══════════════════════════════════════════════════════════════════

-- ── STEP 1: Identify the duplicate bundle IDs ────────────────────
-- Run this SELECT first to confirm exactly which rows will be deleted:
SELECT id, name, price_egp
FROM bundles
WHERE subject = 'pharmacy'
  AND study_level = 'ifp'
  AND price_egp = 1190
  AND name ILIKE '%pharma bundle%';

-- ── STEP 2: Delete bundle_components for the duplicates first ────
-- (Defensive — removes child rows regardless of whether cascade is set)
DELETE FROM bundle_components
WHERE bundle_id IN (
  SELECT id FROM bundles
  WHERE subject = 'pharmacy'
    AND study_level = 'ifp'
    AND price_egp = 1190
    AND name ILIKE '%pharma bundle%'
);

-- ── STEP 3: Delete the duplicate bundle rows ─────────────────────
DELETE FROM bundles
WHERE subject = 'pharmacy'
  AND study_level = 'ifp'
  AND price_egp = 1190
  AND name ILIKE '%pharma bundle%';

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION — Run these after the deletes
-- ═══════════════════════════════════════════════════════════════════

-- V1: Confirm exactly 6 Pharma IFP bundles remain with correct prices
SELECT
  b.id,
  b.name,
  b.price_egp,
  b.published,
  COUNT(bc.id) AS component_count
FROM bundles b
LEFT JOIN bundle_components bc ON bc.bundle_id = b.id
WHERE b.subject = 'pharmacy'
  AND b.study_level = 'ifp'
GROUP BY b.id, b.name, b.price_egp, b.published
ORDER BY b.price_egp DESC, b.name;

-- V2: For each bundle, show what buy_form_url its components resolve to
-- (NULL = "Coming soon" button; non-null = "Buy This Bundle" button)
SELECT
  b.name                         AS bundle_name,
  b.price_egp,
  c.slug                         AS course_slug,
  c.buy_form_url,
  ci.slug                        AS item_slug,
  CASE WHEN ci.id IS NULL THEN 'whole module' ELSE 'individual item' END AS component_type
FROM bundles b
JOIN bundle_components bc ON bc.bundle_id = b.id
JOIN courses c             ON c.id = bc.course_id
LEFT JOIN course_items ci  ON ci.id = bc.item_id
WHERE b.subject = 'pharmacy'
  AND b.study_level = 'ifp'
ORDER BY b.price_egp DESC, b.name, c.slug, ci.slug;
