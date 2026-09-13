-- ═══════════════════════════════════════════════════════════════════
-- Nexus 101 — IFP Pharma Pricing Update
-- ═══════════════════════════════════════════════════════════════════
-- Scope: IFP Pharmacy courses ONLY. No other subject/track touched.
--
-- Course slugs (from constants.js static fallback):
--   uh-pharma-chem1-ifp   → Chemistry 1
--   uh-pharma-bio1-ifp    → Biology 1
--   uh-pharma-chemadv-ifp → Advanced Chemistry
--   uh-pharma-bio2-ifp    → Biology 2
--
-- course_items.slug values (from migration 0013):
--   'test-1' → Exam 1
--   'test-2' → Exam 2
--   'final'  → Final (not mentioned in pricing sheet — leave as-is)
--
-- Bundles table shape (from Store.jsx query):
--   bundles(id, name, subject, study_level, price_egp, published)
--   bundle_components(id, bundle_id, course_id, item_id)
--   item_id IS NULL     → whole-module component
--   item_id IS NOT NULL → specific exam component
--
-- Known existing bundle IDs (from Store.jsx hardcoded FEATURED_IDS):
--   d1000000-0000-0000-0000-000000000005 = Pharma Semester 1 Bundle
--     (Chemistry 1 + Biology 1, whole modules) — FEATURED
--
-- ═══════════════════════════════════════════════════════════════════

-- ── SECTION 1: courses.bundle_price_egp (whole module prices) ────

UPDATE courses SET bundle_price_egp = 1400
WHERE slug = 'uh-pharma-chem1-ifp';

UPDATE courses SET bundle_price_egp = 1400
WHERE slug = 'uh-pharma-bio1-ifp';

UPDATE courses SET bundle_price_egp = 1600
WHERE slug = 'uh-pharma-chemadv-ifp';

UPDATE courses SET bundle_price_egp = 1600
WHERE slug = 'uh-pharma-bio2-ifp';

-- ── SECTION 2: course_items.price_egp (individual exam prices) ───

-- Chemistry 1 — Exam 1 & Exam 2
UPDATE course_items SET price_egp = 800
WHERE slug IN ('test-1', 'test-2')
  AND course_id = (SELECT id FROM courses WHERE slug = 'uh-pharma-chem1-ifp');

-- Biology 1 — Exam 1 & Exam 2
UPDATE course_items SET price_egp = 800
WHERE slug IN ('test-1', 'test-2')
  AND course_id = (SELECT id FROM courses WHERE slug = 'uh-pharma-bio1-ifp');

-- Advanced Chemistry — Exam 1 & Exam 2
UPDATE course_items SET price_egp = 900
WHERE slug IN ('test-1', 'test-2')
  AND course_id = (SELECT id FROM courses WHERE slug = 'uh-pharma-chemadv-ifp');

-- Biology 2 — Exam 1 & Exam 2
UPDATE course_items SET price_egp = 900
WHERE slug IN ('test-1', 'test-2')
  AND course_id = (SELECT id FROM courses WHERE slug = 'uh-pharma-bio2-ifp');

-- ── SECTION 3: Cross-module bundles ──────────────────────────────
-- Uses UUIDs in the d2000000 range (d1 is used by modules in seed_content.sql)
-- to avoid collisions. Pharma bundles: d2000000-pharma-XXXX-XXXX-XXXXXXXXXXXX

-- ── Bundle 1: Pharma Sem 1 Whole Modules ─────────────────────────
-- Already exists as d1000000-0000-0000-0000-000000000005 (FEATURED in Store.jsx).
-- Just update the price; leave components unchanged if they already match.
UPDATE bundles
SET price_egp = 2380
WHERE id = 'd1000000-0000-0000-0000-000000000005';

-- If the above affected 0 rows (bundle was given a different ID),
-- fall back to matching by name:
INSERT INTO bundles (id, name, subject, study_level, price_egp, published)
SELECT
  'd1000000-0000-0000-0000-000000000005',
  'Pharma Semester 1 Bundle: Chemistry 1 + Biology 1 (Whole Modules)',
  'pharmacy', 'ifp', 2380, true
WHERE NOT EXISTS (
  SELECT 1 FROM bundles WHERE id = 'd1000000-0000-0000-0000-000000000005'
);

-- Ensure bundle_components exist for Bundle 1 (whole modules, item_id = NULL)
INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd1000000-0000-0000-0000-000000000005', id, NULL
FROM courses WHERE slug = 'uh-pharma-chem1-ifp'
ON CONFLICT DO NOTHING;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd1000000-0000-0000-0000-000000000005', id, NULL
FROM courses WHERE slug = 'uh-pharma-bio1-ifp'
ON CONFLICT DO NOTHING;

-- ── Bundle 2: Pharma Sem 2 Whole Modules ─────────────────────────
INSERT INTO bundles (id, name, subject, study_level, price_egp, published)
VALUES (
  'd2000000-0001-0000-0000-000000000001',
  'Pharma Semester 2 Bundle: Advanced Chemistry + Biology 2 (Whole Modules)',
  'pharmacy', 'ifp', 2720, true
)
ON CONFLICT (id) DO UPDATE SET price_egp = EXCLUDED.price_egp;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0001-0000-0000-000000000001', id, NULL
FROM courses WHERE slug = 'uh-pharma-chemadv-ifp'
ON CONFLICT DO NOTHING;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0001-0000-0000-000000000001', id, NULL
FROM courses WHERE slug = 'uh-pharma-bio2-ifp'
ON CONFLICT DO NOTHING;

-- ── Bundle 3: Pharma ICT1 Sem 1 (Chem1 Exam 1 + Bio1 Exam 1) ────
INSERT INTO bundles (id, name, subject, study_level, price_egp, published)
VALUES (
  'd2000000-0002-0000-0000-000000000001',
  'Pharma ICT1 Bundle: Chemistry 1 + Biology 1 (Exam 1, Sem 1)',
  'pharmacy', 'ifp', 1360, true
)
ON CONFLICT (id) DO UPDATE SET price_egp = EXCLUDED.price_egp;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0002-0000-0000-000000000001', ci.course_id, ci.id
FROM course_items ci
JOIN courses c ON c.id = ci.course_id
WHERE c.slug = 'uh-pharma-chem1-ifp' AND ci.slug = 'test-1'
ON CONFLICT DO NOTHING;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0002-0000-0000-000000000001', ci.course_id, ci.id
FROM course_items ci
JOIN courses c ON c.id = ci.course_id
WHERE c.slug = 'uh-pharma-bio1-ifp' AND ci.slug = 'test-1'
ON CONFLICT DO NOTHING;

-- ── Bundle 4: Pharma ICT2 Sem 1 (Chem1 Exam 2 + Bio1 Exam 2) ────
INSERT INTO bundles (id, name, subject, study_level, price_egp, published)
VALUES (
  'd2000000-0003-0000-0000-000000000001',
  'Pharma ICT2 Bundle: Chemistry 1 + Biology 1 (Exam 2, Sem 1)',
  'pharmacy', 'ifp', 1360, true
)
ON CONFLICT (id) DO UPDATE SET price_egp = EXCLUDED.price_egp;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0003-0000-0000-000000000001', ci.course_id, ci.id
FROM course_items ci
JOIN courses c ON c.id = ci.course_id
WHERE c.slug = 'uh-pharma-chem1-ifp' AND ci.slug = 'test-2'
ON CONFLICT DO NOTHING;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0003-0000-0000-000000000001', ci.course_id, ci.id
FROM course_items ci
JOIN courses c ON c.id = ci.course_id
WHERE c.slug = 'uh-pharma-bio1-ifp' AND ci.slug = 'test-2'
ON CONFLICT DO NOTHING;

-- ── Bundle 5: Pharma ICT1 Sem 2 (AdvChem Exam 1 + Bio2 Exam 1) ──
INSERT INTO bundles (id, name, subject, study_level, price_egp, published)
VALUES (
  'd2000000-0004-0000-0000-000000000001',
  'Pharma ICT1 Bundle: Advanced Chemistry + Biology 2 (Exam 1, Sem 2)',
  'pharmacy', 'ifp', 1530, true
)
ON CONFLICT (id) DO UPDATE SET price_egp = EXCLUDED.price_egp;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0004-0000-0000-000000000001', ci.course_id, ci.id
FROM course_items ci
JOIN courses c ON c.id = ci.course_id
WHERE c.slug = 'uh-pharma-chemadv-ifp' AND ci.slug = 'test-1'
ON CONFLICT DO NOTHING;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0004-0000-0000-000000000001', ci.course_id, ci.id
FROM course_items ci
JOIN courses c ON c.id = ci.course_id
WHERE c.slug = 'uh-pharma-bio2-ifp' AND ci.slug = 'test-1'
ON CONFLICT DO NOTHING;

-- ── Bundle 6: Pharma ICT2 Sem 2 (AdvChem Exam 2 + Bio2 Exam 2) ──
INSERT INTO bundles (id, name, subject, study_level, price_egp, published)
VALUES (
  'd2000000-0005-0000-0000-000000000001',
  'Pharma ICT2 Bundle: Advanced Chemistry + Biology 2 (Exam 2, Sem 2)',
  'pharmacy', 'ifp', 1530, true
)
ON CONFLICT (id) DO UPDATE SET price_egp = EXCLUDED.price_egp;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0005-0000-0000-000000000001', ci.course_id, ci.id
FROM course_items ci
JOIN courses c ON c.id = ci.course_id
WHERE c.slug = 'uh-pharma-chemadv-ifp' AND ci.slug = 'test-2'
ON CONFLICT DO NOTHING;

INSERT INTO bundle_components (bundle_id, course_id, item_id)
SELECT 'd2000000-0005-0000-0000-000000000001', ci.course_id, ci.id
FROM course_items ci
JOIN courses c ON c.id = ci.course_id
WHERE c.slug = 'uh-pharma-bio2-ifp' AND ci.slug = 'test-2'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES — run these after the above to confirm prices
-- ═══════════════════════════════════════════════════════════════════

-- 1. Whole-module prices (courses.bundle_price_egp)
SELECT slug, title, bundle_price_egp
FROM courses
WHERE slug IN (
  'uh-pharma-chem1-ifp',
  'uh-pharma-bio1-ifp',
  'uh-pharma-chemadv-ifp',
  'uh-pharma-bio2-ifp'
)
ORDER BY slug;

-- 2. Individual exam prices (course_items.price_egp)
SELECT c.slug AS course_slug, ci.slug AS item_slug, ci.title, ci.price_egp
FROM course_items ci
JOIN courses c ON c.id = ci.course_id
WHERE c.slug IN (
  'uh-pharma-chem1-ifp',
  'uh-pharma-bio1-ifp',
  'uh-pharma-chemadv-ifp',
  'uh-pharma-bio2-ifp'
)
  AND ci.slug IN ('test-1', 'test-2')
ORDER BY c.slug, ci.slug;

-- 3. Bundle prices + component counts
SELECT
  b.id,
  b.name,
  b.price_egp,
  COUNT(bc.id) AS component_count
FROM bundles b
LEFT JOIN bundle_components bc ON bc.bundle_id = b.id
WHERE b.subject = 'pharmacy' AND b.study_level = 'ifp'
GROUP BY b.id, b.name, b.price_egp
ORDER BY b.price_egp;
