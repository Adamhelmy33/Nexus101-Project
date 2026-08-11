-- -------------------------------------------------------------------
-- Nexus 101 — course_items.published column
-- Mirrors the same published flag already used on the courses table.
-- DEFAULT true keeps all existing items visible unless explicitly hidden.
-- -------------------------------------------------------------------

ALTER TABLE course_items
  ADD COLUMN IF NOT EXISTS published bool NOT NULL DEFAULT true;

-- Update the existing public-read RLS policy to respect the flag,
-- mirroring the pattern on courses ("published = true OR is_admin()").
-- Drop the old unrestricted policy first.
DROP POLICY IF EXISTS "anyone reads course_items" ON course_items;

CREATE POLICY "anyone reads course_items"
  ON course_items FOR SELECT
  USING (published = true OR is_admin());
