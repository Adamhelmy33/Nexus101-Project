-- ═══════════════════════════════════════════════
-- Nexus 101 — Curriculum Schema Enhancements
-- ═══════════════════════════════════════════════
-- This migration updates the courses table with new curriculum fields
-- and creates the course_instructors join table to support multiple
-- instructors per module.
-- ═══════════════════════════════════════════════

-- ── 1. MIGRATE EXISTING ROWS TO PREVENT CONSTRAINT VIOLATIONS ──────────────────
-- Change any existing subjects to 'engineering' before changing the constraint
UPDATE courses SET subject = 'engineering' WHERE subject IN ('math', 'physics', 'cs', 'mixed');

-- ── 2. UPDATE SUBJECT CONSTRAINT ───────────────────────────────────────────────
-- Drop the old constraint
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_subject_check;

-- Add the new subject check constraint
ALTER TABLE courses ADD CONSTRAINT courses_subject_check CHECK (subject IN ('engineering', 'physiotherapy', 'pharmacy'));

-- ── 3. ADD STUDY_LEVEL COLUMN WITH SAFE UPGRADE PATH ───────────────────────────
-- Add column as nullable first to allow existing rows to receive default values
ALTER TABLE courses ADD COLUMN study_level text;

-- Update existing rows to have a sensible default track
UPDATE courses SET study_level = 'ifp' WHERE study_level IS NULL;

-- Enforce NOT NULL constraint and add track selection check constraint
ALTER TABLE courses ALTER COLUMN study_level SET NOT NULL;
ALTER TABLE courses ADD CONSTRAINT courses_study_level_check CHECK (study_level IN ('ifp', 'level-4'));

-- ── 4. ADD DYNAMIC PRICING AND UI COLUMN SETS ──────────────────────────────────
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS price_egp numeric,
  ADD COLUMN IF NOT EXISTS old_price_egp numeric,
  ADD COLUMN IF NOT EXISTS gradient_from text,
  ADD COLUMN IF NOT EXISTS gradient_to text,
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS topics_list jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS icon text;

-- ── 5. CREATE COURSE_INSTRUCTORS JOIN TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS course_instructors (
  course_id uuid NOT NULL REFERENCES courses ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES instructors ON DELETE CASCADE,
  PRIMARY KEY (course_id, instructor_id)
);

-- Enable RLS
ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;

-- Add public read access policy
DROP POLICY IF EXISTS "anyone reads course_instructors" ON course_instructors;
CREATE POLICY "anyone reads course_instructors" ON course_instructors FOR SELECT USING (true);
