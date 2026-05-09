-- ═══════════════════════════════════════════════
-- Nexus 101 — Initial Schema
-- ═══════════════════════════════════════════════
-- Run this in your Supabase SQL editor (or `supabase db push`).
-- Idempotent: safe to re-run.

create extension if not exists "uuid-ossp";

-- ── PROFILES (extends auth.users) ───────────────
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  email         text unique not null,
  name          text,
  role          text not null default 'student' check (role in ('student','admin')),
  university_id uuid,
  avatar_url    text,
  created_at    timestamptz default now()
);

-- ── UNIVERSITIES & COURSES ──────────────────────
create table if not exists universities (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  name        text not null,
  short_name  text,
  description text,
  color       text,
  icon        text,
  position    int default 0,
  created_at  timestamptz default now()
);

create table if not exists courses (
  id            uuid primary key default uuid_generate_v4(),
  university_id uuid references universities,
  slug          text unique not null,
  title         text not null,
  subtitle      text,
  description   text,
  price_points  int not null default 1000,
  hours         int,
  level         text,
  subject       text not null check (subject in ('math','physics','cs','mixed')),
  badge         text,
  meta          jsonb default '{}'::jsonb,
  published     bool default true,
  created_at    timestamptz default now()
);

create table if not exists modules (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references courses on delete cascade,
  slug         text not null,
  title        text not null,
  position     int not null,
  duration_min int,
  video_url    text,
  unique (course_id, slug)
);

create table if not exists topics (
  id          uuid primary key default uuid_generate_v4(),
  module_id   uuid not null references modules on delete cascade,
  course_id   uuid not null references courses,
  title       text not null,
  subject     text not null,
  difficulty  int default 3 check (difficulty between 1 and 5)
);

-- ── ENROLLMENTS ─────────────────────────────────
create table if not exists enrollments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles on delete cascade,
  course_id   uuid not null references courses,
  source      text not null check (source in ('wallet','admin_grant','promo')),
  ledger_id   uuid,                                 -- linked from wallet_ledger
  enrolled_at timestamptz default now(),
  unique (user_id, course_id)
);

-- ── WALLET ──────────────────────────────────────
create table if not exists wallet_balances (
  user_id            uuid primary key references profiles on delete cascade,
  balance_points     int not null default 0,
  lifetime_deposited int not null default 0,
  lifetime_spent     int not null default 0,
  updated_at         timestamptz default now()
);

create table if not exists wallet_ledger (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles on delete cascade,
  delta_points    int not null,
  kind            text not null check (kind in
                    ('bundle_purchase','course_enrollment','admin_adjust','refund')),
  reference_type  text,
  reference_id    text,
  balance_after   int not null,
  idempotency_key text unique,
  meta            jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);
create index if not exists wallet_ledger_user_idx on wallet_ledger (user_id, created_at desc);

-- ── PAYMOB ─────────────────────────────────────
create table if not exists paymob_transactions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles on delete cascade,
  paymob_order_id   text unique,
  paymob_txn_id     text unique,
  amount_egp_cents  int not null,
  bundle_points     int not null default 1200,
  integration_id    text not null check (integration_id in ('card','wallet','kiosk')),
  status            text not null default 'pending' check (status in
                    ('pending','paid','failed','refunded')),
  hmac_signature    text,
  hmac_verified     bool default false,
  callback_payload  jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── PROGRESS / MASTERY ─────────────────────────
create table if not exists watch_sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles on delete cascade,
  module_id   uuid not null references modules on delete cascade,
  course_id   uuid not null references courses,
  started_at  timestamptz default now(),
  ended_at    timestamptz,
  seconds     int not null default 0,
  completed   bool default false
);
create index if not exists watch_sessions_user_idx on watch_sessions (user_id, started_at desc);

create table if not exists topic_mastery (
  user_id          uuid not null references profiles on delete cascade,
  topic_id         uuid not null references topics on delete cascade,
  mastery          numeric(3,2) default 0 check (mastery between 0 and 1),
  hours_practiced  numeric(5,2) default 0,
  last_at          timestamptz,
  primary key (user_id, topic_id)
);

create table if not exists quiz_attempts (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles on delete cascade,
  topic_id          uuid references topics,
  module_id         uuid references modules,
  questions_total   int,
  questions_correct int,
  source            text default 'study_buddy',
  created_at        timestamptz default now()
);
