-- ═══════════════════════════════════════════════════════════════════
-- Nexus 101 — Seed Data
-- ═══════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL Editor (not via db push).
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING.
-- ═══════════════════════════════════════════════════════════════════

-- ── UNIVERSITIES ─────────────────────────────────────────────────

insert into universities (id, slug, name, short_name, description, color, icon, position)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'uh',
    'University of Hertfordshire',
    'UH',
    'High-intensity revision packages for UH modules — pass with confidence.',
    '#003F87',
    '🎓',
    1
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'bue',
    'British University in Egypt',
    'BUE',
    'Targeted revisions aligned with the BUE syllabus — hit high marks.',
    '#7A0019',
    '🏛️',
    2
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'guc',
    'German University in Cairo',
    'GUC',
    'Crystal-clear revisions for GUC engineering and CS modules.',
    '#0066B3',
    '⚙️',
    3
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'coventry',
    'The Knowledge Hub Universities',
    'Coventry',
    'Targeted revisions aligned with the Coventry syllabus — hit high marks.',
    '#dc2626',
    '🏛️',
    4
  )
on conflict (slug) do nothing;


-- ── COURSES ──────────────────────────────────────────────────────
-- price_points from nexus.config.js:
--   uh-eng-math       900  (uh default)
--   uh-prog-fund      950  (per-course override)
--   uh-digital-elect  900  (uh default)
--   bue-calculus      900  (bue default)
--   bue-mechanics     900  (bue default)
--   bue-cpp           950  (per-course override)
--   guc-physics      1000  (guc default)
--   guc-discrete     1000  (guc default)
--   guc-dsa          1100  (per-course override)
--   cov-programming   850  (coventry default)
--   cov-eng-math      850  (coventry default)
--   cov-networks      950  (per-course override)

insert into courses (id, university_id, slug, title, subtitle, description, price_points, hours, level, subject, badge, published)
values
  -- ── University of Hertfordshire ──────────────────────────────
  (
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'uh-eng-math',
    'Engineering Mathematics',
    'UH Module — Foundations & Applications',
    'High-intensity revision of UH Engineering Mathematics — exam-style problems, walkthroughs, and revision sheets to maximize your grade.',
    900,
    24,
    'Year 1 · UH',
    'math',
    'Most Popular',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'uh-prog-fund',
    'Programming Fundamentals',
    'UH Module — Core Programming Concepts',
    'Crush the UH Programming Fundamentals module — clear walkthroughs of every concept that lands in the exam.',
    950,
    30,
    'Year 1 · UH',
    'cs',
    null,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'uh-digital-electronics',
    'Digital Electronics',
    'UH Module — Logic & Circuits',
    'Master logic gates, Boolean algebra, and digital circuits — exam-ready in a fraction of the time.',
    900,
    22,
    'Year 1-2 · UH',
    'cs',
    null,
    true
  ),
  -- ── British University in Egypt ───────────────────────────────
  (
    'b1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000002',
    'bue-calculus',
    'Calculus 1 & 2',
    'BUE Module — Differential & Integral Calculus',
    'Pass BUE Calculus with clear, exam-focused revisions covering everything from limits to multivariable integration.',
    900,
    26,
    'Year 1 · BUE',
    'math',
    'New',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000002',
    'bue-mechanics',
    'Mechanics & Vibrations',
    'BUE Module — Engineering Mechanics',
    'Tackle BUE Mechanics with confidence — every formula, every typical exam question, all explained clearly.',
    900,
    24,
    'Year 1-2 · BUE',
    'physics',
    null,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000002',
    'bue-cpp',
    'Programming with C++',
    'BUE Module — OOP in C++',
    'Ace the BUE C++ programming course with hands-on revisions, code walkthroughs, and OOP mastery.',
    950,
    28,
    'Year 1 · BUE',
    'cs',
    null,
    true
  ),
  -- ── German University in Cairo ────────────────────────────────
  (
    'b1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000003',
    'guc-physics',
    'Engineering Physics',
    'GUC Module — Physics for Engineers',
    'GUC Physics revision — laser-focused on the topics that always show up in the final exam.',
    1000,
    25,
    'Year 1 · GUC',
    'physics',
    null,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000003',
    'guc-discrete',
    'Discrete Mathematics',
    'GUC Module — Logic, Sets & Graphs',
    'Discrete Math revision built specifically around the GUC syllabus — clear, fast, exam-ready.',
    1000,
    22,
    'Year 1 · GUC',
    'math',
    null,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000009',
    'a1000000-0000-0000-0000-000000000003',
    'guc-dsa',
    'Data Structures & Algorithms',
    'GUC Module — Core CS Foundations',
    'GUC DSA revision — every data structure and algorithm explained with code, diagrams, and exam tips.',
    1100,
    32,
    'Year 2 · GUC',
    'cs',
    'Hot',
    true
  ),
  -- ── Coventry @ The Knowledge Hub ─────────────────────────────
  (
    'b1000000-0000-0000-0000-000000000010',
    'a1000000-0000-0000-0000-000000000004',
    'cov-programming',
    'Programming Foundations',
    'Coventry Module — Core Programming with Python',
    'Pass Coventry Programming Foundations — clear walkthroughs of every concept and code pattern that lands in the exam.',
    850,
    26,
    'Year 1 · Coventry',
    'cs',
    'New',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000011',
    'a1000000-0000-0000-0000-000000000004',
    'cov-eng-math',
    'Engineering Mathematics',
    'Coventry Module — Calculus, Algebra & Stats',
    'High-intensity revision of Coventry Engineering Maths — laser-focused on the topics that actually appear on the exam.',
    850,
    24,
    'Year 1 · Coventry',
    'math',
    null,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000012',
    'a1000000-0000-0000-0000-000000000004',
    'cov-networks',
    'Computer Networks',
    'Coventry Module — TCP/IP, Routing & Protocols',
    'Master Coventry Networking — every protocol, every diagram, every typical exam question, all explained clearly.',
    950,
    28,
    'Year 2 · Coventry',
    'cs',
    null,
    true
  )
on conflict (slug) do nothing;
