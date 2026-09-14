-- ═══════════════════════════════════════════════════════════════════
-- Nexus 101 — Migration 0024: Final 11-instructor roster
-- ═══════════════════════════════════════════════════════════════════
-- Changes:
--   1. REMOVE Mohra Ehab (ins-12) — delete course_instructors, then
--      instructor_universities, then instructors row
--   2. ADD Jana Abdelfatah → Applied Engineering Sciences (CS)
--      course_instructors link (she already teaches Eng Sci 1 & 2)
--   3. INSERT Mohamed Farag (ins-20) — Mathematics Instructor
--      for Level 4 Engineering Mathematics
--   4. Link Farag to Engineering Mathematics (level-4) course
--
-- Verified pre-state (from diagnose_instructors.mjs):
--   - 11 instructors currently, Mohra is one of them
--   - Farag: 0 rows (already removed in migration 0019)
--   - Jana: linked to Eng Sci 1 & 2 only; needs AES link
--   - All other instructors and course_instructors verified correct
--   - Musculoskeletal 1: already has BOTH Rawan Ali AND Haneen Sayed
--   - Chemistry 1 & Advanced Chemistry: both linked to Abdelrahman Abdelbasset Soliman
--   - Biology 1 & Biology 2: both linked to Ahmed Alaa Mohamed Ali
-- ═══════════════════════════════════════════════════════════════════

-- ── STEP 1: Remove Mohra Ehab completely ────────────────────────────
-- Her course_instructors (AES course) will cascade-delete because FK
-- has ON DELETE CASCADE. But we do it explicitly first for clarity.
DELETE FROM course_instructors
WHERE instructor_id = 'c1000000-0000-0000-0000-00000000000c';  -- Mohra's UUID (ins-12)

DELETE FROM instructor_universities
WHERE instructor_id = 'c1000000-0000-0000-0000-00000000000c';

DELETE FROM instructors
WHERE id = 'c1000000-0000-0000-0000-00000000000c';

-- Defensive: also match by name in case UUID was different in any env
DELETE FROM course_instructors
WHERE instructor_id IN (SELECT id FROM instructors WHERE name ILIKE '%mohra%');

DELETE FROM instructor_universities
WHERE instructor_id IN (SELECT id FROM instructors WHERE name ILIKE '%mohra%');

DELETE FROM instructors WHERE name ILIKE '%mohra%';

-- ── STEP 2: Link Jana Abdelfatah to Applied Engineering Sciences (CS) ─
-- Jana's id: c1000000-0000-0000-0000-000000000018
-- AES slug: uh-eng-aes-ifp
INSERT INTO course_instructors (course_id, instructor_id)
SELECT c.id, 'c1000000-0000-0000-0000-000000000018'
FROM courses c
WHERE c.slug = 'uh-eng-aes-ifp'
ON CONFLICT DO NOTHING;

-- ── STEP 3: Insert Mohamed Farag (ins-20) ─────────────────────────────
INSERT INTO instructors (id, slug, name, role, subject, photo_url, initials, bio)
VALUES (
  'c1000000-0000-0000-0000-000000000020',
  'ins-20',
  'Mohamed Farag',
  'Mathematics Instructor',
  'Engineering Mathematics (Level 4)',
  NULL,
  'MF',
  'Ex-Co-founder of Nexus 101 and Ex-Chairman of IEEE UH-GAF. Taught Mathematics to IFP and UH-GAF Engineering Schools.'
)
ON CONFLICT (slug) DO UPDATE
  SET name    = EXCLUDED.name,
      role    = EXCLUDED.role,
      subject = EXCLUDED.subject,
      bio     = EXCLUDED.bio,
      initials = EXCLUDED.initials;

-- Link Farag to UH
INSERT INTO instructor_universities (instructor_id, university_id)
VALUES ('c1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ── STEP 4: Link Farag to Level 4 Engineering Mathematics ─────────────
-- Slug: uh-eng-math-l4 (study_level = 'level-4') — NOT the IFP courses
INSERT INTO course_instructors (course_id, instructor_id)
SELECT c.id, 'c1000000-0000-0000-0000-000000000020'
FROM courses c
WHERE c.slug = 'uh-eng-math-l4'
ON CONFLICT DO NOTHING;

-- ── VERIFICATION QUERIES ────────────────────────────────────────────
-- 1. Count active instructors — should be 11
SELECT COUNT(*) AS total_instructors FROM instructors;

-- 2. Confirm Mohra is gone
SELECT id, slug, name FROM instructors WHERE name ILIKE '%mohra%';

-- 3. Confirm Farag exists
SELECT id, slug, name, role, subject FROM instructors WHERE name ILIKE '%farag%';

-- 4. Confirm Jana's 3 course links
SELECT c.title, c.slug FROM course_instructors ci
JOIN courses c ON c.id = ci.course_id
WHERE ci.instructor_id = 'c1000000-0000-0000-0000-000000000018'
ORDER BY c.title;

-- 5. Confirm Farag's Level 4 Math link
SELECT c.title, c.slug, c.study_level FROM course_instructors ci
JOIN courses c ON c.id = ci.course_id
WHERE ci.instructor_id = 'c1000000-0000-0000-0000-000000000020';

-- 6. Confirm Musculoskeletal 1 has both Rawan and Haneen
SELECT i.name FROM course_instructors ci
JOIN instructors i ON i.id = ci.instructor_id
JOIN courses c ON c.id = ci.course_id
WHERE c.slug = 'uh-physio-msk1-l4';

-- 7. Full roster summary
SELECT i.name, i.role, STRING_AGG(c.title, ', ' ORDER BY c.title) AS courses
FROM instructors i
LEFT JOIN course_instructors ci ON ci.instructor_id = i.id
LEFT JOIN courses c ON c.id = ci.course_id
GROUP BY i.id, i.name, i.role
ORDER BY i.name;
