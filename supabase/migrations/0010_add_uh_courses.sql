-- ═══════════════════════════════════════════════════════════════════
-- Nexus 101 — Add 3 new UH courses
-- ═══════════════════════════════════════════════════════════════════
-- Run in the Supabase SQL Editor AFTER seed.sql and seed_content.sql.
-- Safe to re-run: inserts use ON CONFLICT DO NOTHING.
--
-- UH university_id: a1000000-0000-0000-0000-000000000001
--
-- Course IDs continue the b1000000 sequence:
--   uh-physics         → b1000000-0000-0000-0000-000000000013
--   uh-bio-science     → b1000000-0000-0000-0000-000000000014
--   uh-design-mech     → b1000000-0000-0000-0000-000000000015
-- ═══════════════════════════════════════════════════════════════════

insert into courses (id, university_id, slug, title, subtitle, description, price_points, hours, level, subject, badge, published)
values
  (
    'b1000000-0000-0000-0000-000000000013',
    'a1000000-0000-0000-0000-000000000001',
    'uh-physics',
    'Physics',
    'UH Module — Mechanics, Waves & Modern Physics',
    'High-intensity revision of UH Physics — every formula, every exam-style problem, all explained clearly by your dedicated instructor.',
    900,
    24,
    'Year 1 · UH',
    'physics',
    null,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000014',
    'a1000000-0000-0000-0000-000000000001',
    'uh-bio-science',
    'Biological Science',
    'UH Module — Cell Biology, Genetics & Physiology',
    'Targeted revision of UH Biological Science — laser-focused on the topics that always land in the final exam.',
    900,
    22,
    'Year 1 · UH',
    'mixed',
    null,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000015',
    'a1000000-0000-0000-0000-000000000001',
    'uh-design-mech',
    'Introduction to Design & Mechanical Science',
    'UH Module — Engineering Design Principles & Mechanics',
    'Clear, exam-ready revision of UH Design & Mechanical Science — from statics and stress analysis to the design process itself.',
    900,
    24,
    'Year 1 · UH',
    'mixed',
    null,
    true
  )
on conflict (slug) do nothing;
