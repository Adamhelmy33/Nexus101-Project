-- ═══════════════════════════════════════════════
-- Nexus 101 — Instructors table + Medicine seed
-- ═══════════════════════════════════════════════
-- Run this in the Supabase SQL Editor.
-- Idempotent: safe to re-run.

-- ── 1. INSTRUCTORS table ─────────────────────────────────────
create table if not exists instructors (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  name          text not null,
  role          text,
  subject       text,
  photo         text,
  initials      text not null,
  gradient_from text,
  gradient_to   text,
  rating        numeric(3,1) check (rating between 0 and 5),
  student_count int default 0,
  bio           text,
  created_at    timestamptz default now()
);

alter table instructors enable row level security;
create policy "anyone reads instructors" on instructors for select using (true);


-- ── 2. instructor_universities junction ─────────────────────
create table if not exists instructor_universities (
  instructor_id uuid references instructors on delete cascade,
  university_id uuid references universities on delete cascade,
  primary key (instructor_id, university_id)
);

alter table instructor_universities enable row level security;
create policy "anyone reads instructor_universities"
  on instructor_universities for select using (true);


-- ── 3. instructor_id FK on courses ──────────────────────────
alter table courses
  add column if not exists instructor_id uuid references instructors on delete set null;

create index if not exists courses_instructor_idx on courses (instructor_id);


-- ── 4. Missing UI columns on universities ───────────────────
alter table universities
  add column if not exists tagline      text,
  add column if not exists accent_color text,
  add column if not exists location     text;


-- ── 5. Missing UI columns on courses ────────────────────────
alter table courses
  add column if not exists icon          text,
  add column if not exists gradient_from text,
  add column if not exists gradient_to   text,
  add column if not exists price_egp     int,
  add column if not exists old_price_egp int,
  add column if not exists currency      text default 'EGP',
  add column if not exists student_count int default 0,
  add column if not exists module_count  int default 0,
  add column if not exists features      jsonb default '[]'::jsonb,
  add column if not exists topics_list   jsonb default '[]'::jsonb;


-- ── 6. Extend subject CHECK to include 'medicine' ───────────
-- Postgres auto-names inline check constraints <table>_<col>_check.
alter table courses
  drop constraint if exists courses_subject_check;
alter table courses
  add constraint courses_subject_check
  check (subject in ('math','physics','cs','mixed','medicine'));

alter table video_segments
  drop constraint if exists video_segments_subject_check;
alter table video_segments
  add constraint video_segments_subject_check
  check (subject in ('math','physics','cs','mixed','medicine'));


-- ── 7. INSERT Medicine data ──────────────────────────────────
-- Explicit UUIDs keep FK references stable across re-runs.
do $$
declare
  v_uni_id uuid := 'a1b2c3d4-0001-0000-0000-000000000001'::uuid;
  v_ins_id uuid := 'a1b2c3d4-0001-0000-0000-000000000002'::uuid;
  v_crs_id uuid := 'a1b2c3d4-0001-0000-0000-000000000003'::uuid;
begin

  -- University: Egyptian Medical Schools
  insert into universities (
    id, slug, name, short_name, tagline, description,
    color, accent_color, location, icon, position
  ) values (
    v_uni_id,
    'med',
    'Egyptian Medical Schools',
    'MED',
    'Ace your preclinical years',
    'High-intensity revision packages for first-year medicine students across Egyptian universities.',
    '#0d9488',
    '#f0fdf4',
    'Cairo · Alexandria · Mansoura',
    '🩺',
    5
  )
  on conflict (slug) do update set
    name         = excluded.name,
    tagline      = excluded.tagline,
    description  = excluded.description,
    color        = excluded.color,
    accent_color = excluded.accent_color,
    location     = excluded.location,
    icon         = excluded.icon;

  -- Instructor: Dr. Nour El-Sayed
  insert into instructors (
    id, slug, name, role, subject, photo, initials,
    gradient_from, gradient_to, rating, student_count, bio
  ) values (
    v_ins_id,
    'dr-nour-el-sayed',
    'Dr. Nour El-Sayed',
    'Medicine Instructor',
    'Anatomy & Physiology',
    '/instructors/ins-7.jpg',
    'NE',
    '#0d9488',
    '#0f766e',
    4.9,
    410,
    'Graduated top of her class from Cairo University Medicine. Specialises in making Anatomy visual and exam-ready.'
  )
  on conflict (slug) do update set
    name          = excluded.name,
    role          = excluded.role,
    subject       = excluded.subject,
    rating        = excluded.rating,
    student_count = excluded.student_count,
    bio           = excluded.bio;

  -- Link instructor → university
  insert into instructor_universities (instructor_id, university_id)
  values (v_ins_id, v_uni_id)
  on conflict do nothing;

  -- Course: Anatomy Year 1
  insert into courses (
    id, university_id, instructor_id, slug,
    title, subtitle, description,
    price_points, price_egp, old_price_egp, currency,
    hours, module_count, student_count,
    level, subject, badge,
    icon, gradient_from, gradient_to,
    features, topics_list, published
  ) values (
    v_crs_id,
    v_uni_id,
    v_ins_id,
    'med-anatomy',
    'Anatomy — Year 1',
    'Preclinical Module — Gross & Histological Anatomy',
    'The fastest way through Year 1 Anatomy — every region, every clinical correlation, every exam question type, all explained clearly.',
    950,
    950,
    1399,
    'EGP',
    28,
    10,
    185,
    'Year 1 · Medicine',
    'medicine',
    'New',
    '🦴',
    '#0d9488',
    '#0f766e',
    '["28h of focused revision videos","Region-by-region diagram walkthroughs","Clinical correlations for each topic","Past-paper MCQ sessions","WhatsApp tutoring access"]'::jsonb,
    '["Bones & Skeletal System","Muscles & Fascia","Cardiovascular & Lymphatics","Nervous System Overview","Histology Essentials"]'::jsonb,
    true
  )
  on conflict (slug) do update set
    university_id  = excluded.university_id,
    instructor_id  = excluded.instructor_id,
    title          = excluded.title,
    subtitle       = excluded.subtitle,
    description    = excluded.description,
    price_points   = excluded.price_points,
    price_egp      = excluded.price_egp,
    old_price_egp  = excluded.old_price_egp,
    hours          = excluded.hours,
    module_count   = excluded.module_count,
    student_count  = excluded.student_count,
    subject        = excluded.subject,
    badge          = excluded.badge,
    features       = excluded.features,
    topics_list    = excluded.topics_list;

end;
$$;


-- ── 8. VERIFICATION QUERY ────────────────────────────────────
-- Run this block separately after the migration to confirm the link.
-- Expected: one row with course "Anatomy — Year 1", instructor "Dr. Nour El-Sayed",
--           university "Egyptian Medical Schools".
--
-- select
--   c.slug        as course_slug,
--   c.title       as course_title,
--   c.subject,
--   c.badge,
--   i.name        as instructor_name,
--   i.rating      as instructor_rating,
--   u.name        as university_name,
--   u.slug        as university_slug
-- from  courses      c
-- join  instructors  i on i.id = c.instructor_id
-- join  universities u on u.id = c.university_id
-- where c.slug = 'med-anatomy';
