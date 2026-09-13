-- ═══════════════════════════════════════════════════════════════════
-- Nexus 101 — Update instructors: add Jana & Adham, remove Judy
-- ═══════════════════════════════════════════════════════════════════
-- Changes:
--   1. Remove Judy Ayman (ins-7) — cascades course_instructors
--   2. Add Jana Abdelfatah (ins-18) — Eng Sci 1 & 2
--   3. Add Mohamed Adham Hussein (ins-19) — Eng Math 1 & 2
--   4. Remove Mohra Ehab from Eng Math 1 & 2 course_instructors
--      (her instructor record stays; only the course links change)
--
-- Course slugs (from existing seed data):
--   uh-eng-sci1-ifp   = Engineering Science 1  (IFP)
--   uh-eng-sci2-ifp   = Engineering Science 2  (IFP)
--   uh-eng-math1-ifp  = Engineering Mathematics 1 (IFP)
--   uh-eng-math2-ifp  = Engineering Mathematics 2 (IFP)
--
-- UH university_id: a1000000-0000-0000-0000-000000000001
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. REMOVE JUDY AYMAN (ins-7) ─────────────────────────────────
-- course_instructors rows cascade-delete automatically because the
-- FK has ON DELETE CASCADE (defined in 0012_curriculum_schema.sql).
DELETE FROM instructors WHERE slug = 'ins-7';

-- ── 2. INSERT JANA ABDELFATAH (ins-18) ───────────────────────────
INSERT INTO instructors (id, slug, name, role, subject, photo_url, initials, bio)
VALUES (
  'c1000000-0000-0000-0000-000000000018',
  'ins-18',
  'Jana Abdelfatah',
  'Physics & Computer Science Instructor',
  'Engineering Science',
  NULL,
  'JA',
  'Electrical & Electronics Engineering student who teaches by connecting theory to real-world applications and hands-on problem-solving. Her goal: every student leaves each session more confident, capable, and curious than when they started.'
)
ON CONFLICT (slug) DO UPDATE
  SET name    = EXCLUDED.name,
      role    = EXCLUDED.role,
      subject = EXCLUDED.subject,
      bio     = EXCLUDED.bio,
      initials = EXCLUDED.initials;

-- Link Jana to UH
INSERT INTO instructor_universities (instructor_id, university_id)
VALUES ('c1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ── 3. INSERT MOHAMED ADHAM HUSSEIN (ins-19) ─────────────────────
INSERT INTO instructors (id, slug, name, role, subject, photo_url, initials, bio)
VALUES (
  'c1000000-0000-0000-0000-000000000019',
  'ins-19',
  'Mohamed Adham Hussein',
  'Mathematics Instructor',
  'Engineering Mathematics',
  NULL,
  'MA',
  'Ambitious Electrical and Electronic Engineering student passionate about pure mathematics, semiconductor physics, and quantum hardware engineering, with research experience across IoT structural monitoring, sustainable materials, and renewable energy systems.'
)
ON CONFLICT (slug) DO UPDATE
  SET name    = EXCLUDED.name,
      role    = EXCLUDED.role,
      subject = EXCLUDED.subject,
      bio     = EXCLUDED.bio,
      initials = EXCLUDED.initials;

-- Link Adham to UH
INSERT INTO instructor_universities (instructor_id, university_id)
VALUES ('c1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ── 4. UPDATE COURSE_INSTRUCTORS FOR ENG SCI 1 & 2 ───────────────
-- Remove any existing assignment for Eng Sci 1 & 2, then assign Jana.
DELETE FROM course_instructors
WHERE course_id IN (
  SELECT id FROM courses WHERE slug IN ('uh-eng-sci1-ifp', 'uh-eng-sci2-ifp')
);

INSERT INTO course_instructors (course_id, instructor_id)
SELECT c.id, 'c1000000-0000-0000-0000-000000000018'
FROM courses c
WHERE c.slug IN ('uh-eng-sci1-ifp', 'uh-eng-sci2-ifp')
ON CONFLICT DO NOTHING;

-- ── 5. UPDATE COURSE_INSTRUCTORS FOR ENG MATH 1 & 2 ─────────────
-- Remove ALL existing assignments for Eng Math 1 & 2, then assign Adham
-- as sole instructor (per user instruction: sole, not co-instructor).
DELETE FROM course_instructors
WHERE course_id IN (
  SELECT id FROM courses WHERE slug IN ('uh-eng-math1-ifp', 'uh-eng-math2-ifp')
);

INSERT INTO course_instructors (course_id, instructor_id)
SELECT c.id, 'c1000000-0000-0000-0000-000000000019'
FROM courses c
WHERE c.slug IN ('uh-eng-math1-ifp', 'uh-eng-math2-ifp')
ON CONFLICT DO NOTHING;
