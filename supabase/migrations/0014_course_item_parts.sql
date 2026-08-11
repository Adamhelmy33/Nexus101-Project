-- ═══════════════════════════════════════════════
-- Nexus 101 — Course Item Parts (sub-lessons/videos)
-- ═══════════════════════════════════════════════
-- To support multiple video segments or parts under a single course item
-- (e.g. Test 1 having Part 1, Part 2, etc.), we map parts to course_items.
--
-- Idempotent: safe to re-run via IF NOT EXISTS / IF EXISTS guards.
-- ═══════════════════════════════════════════════

-- ── 1. CREATE COURSE_ITEM_PARTS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS course_item_parts (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id           uuid    NOT NULL REFERENCES course_items (id) ON DELETE CASCADE,
  title             text    NOT NULL,
  order_index       int     NOT NULL DEFAULT 0,
  youtube_video_id  text,
  UNIQUE (item_id, order_index)
);

-- Public read access policy (anyone can view parts of a course item)
ALTER TABLE course_item_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads course_item_parts" ON course_item_parts;
CREATE POLICY "anyone reads course_item_parts"
  ON course_item_parts FOR SELECT
  USING (true);

-- ── 2. INDEX ON FK COLUMN ───────────────────────────────────────────────────────
-- Add an index for faster lookups of parts belonging to a course item.
CREATE INDEX IF NOT EXISTS course_item_parts_item_idx
  ON course_item_parts (item_id);
