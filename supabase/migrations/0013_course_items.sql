-- ═══════════════════════════════════════════════
-- Nexus 101 — Course Items (purchasable sub-units)
-- ═══════════════════════════════════════════════
-- Each course now has exactly 3 purchasable items:
--   test-1  → Mid-session test 1
--   test-2  → Mid-session test 2
--   final   → Final exam prep
-- Students can buy items individually or as a bundle
-- (bundle price stored on the parent courses row).
--
-- Idempotent: safe to re-run via IF NOT EXISTS / IF EXISTS guards.
-- ═══════════════════════════════════════════════

-- ── 1. CREATE COURSE_ITEMS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS course_items (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid    NOT NULL REFERENCES courses ON DELETE CASCADE,
  slug         text    NOT NULL CHECK (slug IN ('test-1', 'test-2', 'final')),
  title        text    NOT NULL,
  price_egp    numeric NOT NULL DEFAULT 800,
  order_index  int     NOT NULL DEFAULT 0,
  UNIQUE (course_id, slug)
);

-- Public read (anonymous users need to see items when browsing the store)
ALTER TABLE course_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads course_items" ON course_items;
CREATE POLICY "anyone reads course_items"
  ON course_items FOR SELECT
  USING (true);

-- ── 2. ADD BUNDLE PRICE TO COURSES ─────────────────────────────────────────────
-- bundle_price_egp is what a user pays to unlock all 3 items at once.
-- NULL means "no bundle discount offered" — the UI falls back to summing item prices.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS bundle_price_egp numeric DEFAULT 2000;

-- ── 3. EXTEND PURCHASES FOR ITEM-LEVEL OWNERSHIP ────────────────────────────────

-- 3a. Add item_id (nullable — NULL means a full bundle purchase)
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES course_items (id) ON DELETE SET NULL;

-- 3b. Drop the old (user_id, course_id) unique index that assumed one-purchase-per-course.
--     We replace it with two partial unique indexes below.
DROP INDEX IF EXISTS purchases_user_course_uniq;

-- 3c. Unique constraint on individual-item purchases.
--     Prevents buying the same item twice.
--     The WHERE clause scopes it only to rows where item_id IS NOT NULL,
--     so bundle rows (item_id IS NULL) are handled by the separate index below.
DROP INDEX IF EXISTS purchases_user_course_item_uniq;
CREATE UNIQUE INDEX purchases_user_course_item_uniq
  ON purchases (user_id, course_id, item_id)
  WHERE item_id IS NOT NULL;

-- 3d. Unique constraint on bundle purchases.
--     Without this, the standard NULL-distinct behaviour in Postgres would allow
--     a user to insert multiple bundle rows for the same course (because
--     NULL != NULL in unique index logic). A partial index WHERE item_id IS NULL
--     collapses those rows correctly: the index only sees (user_id, course_id)
--     for bundle rows, making the pair unique exactly as before.
DROP INDEX IF EXISTS purchases_user_course_bundle_uniq;
CREATE UNIQUE INDEX purchases_user_course_bundle_uniq
  ON purchases (user_id, course_id)
  WHERE item_id IS NULL;

-- ── 4. PURCHASES.METHOD CONSTRAINT — NO CHANGE NEEDED ──────────────────────────
-- Migration 0011 already set:
--   DEFAULT 'card'
--   CHECK (method IN ('card', 'cash'))
-- Items vs bundles are a purchase-granularity concept, not a payment-method concept.
-- card / cash remain the only valid methods. No alteration required here.

-- ── 5. INDEX ON FK COLUMN IN PURCHASES ─────────────────────────────────────────
-- Postgres auto-creates an index on course_items.id (PK) but not on the FK
-- column in purchases. Add one so lookups like "has user purchased this item?"
-- remain fast even with many purchase rows.
CREATE INDEX IF NOT EXISTS purchases_item_idx
  ON purchases (item_id)
  WHERE item_id IS NOT NULL;
