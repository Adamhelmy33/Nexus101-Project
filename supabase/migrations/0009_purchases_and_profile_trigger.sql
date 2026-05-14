-- ═══════════════════════════════════════════════
-- Nexus 101 — Purchases table + auto-profile trigger
-- ═══════════════════════════════════════════════
-- Idempotent: safe to re-run.
-- Adds:
--   1. PURCHASES table — every paid/redeemed course is one row, globally
--      visible to admins, scoped to the buyer for everyone else.
--   2. handle_new_user() trigger — when a user is created in auth.users,
--      a matching row in profiles is auto-inserted with the name from
--      raw_user_meta_data so the Owner Dashboard sees them immediately.

-- ── PURCHASES ───────────────────────────────────
create table if not exists purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles on delete cascade,
  user_email    text not null,
  user_name     text,
  course_id     text not null,                -- course slug from data/constants.js
  amount        int  not null default 0,      -- EGP amount (0 for wallet redemptions)
  points_spent  int  not null default 0,
  method        text not null default 'wallet' check (method in ('wallet','card','cash')),
  txn_id        text,
  meta          jsonb default '{}'::jsonb,
  purchased_at  timestamptz not null default now()
);

create index if not exists purchases_user_idx     on purchases (user_id, purchased_at desc);
create index if not exists purchases_course_idx   on purchases (course_id, purchased_at desc);
create unique index if not exists purchases_user_course_uniq on purchases (user_id, course_id);

alter table purchases enable row level security;

drop policy if exists "user reads own purchases"   on purchases;
drop policy if exists "user inserts own purchases" on purchases;

create policy "user reads own purchases"
  on purchases for select
  using (auth.uid() = user_id or is_admin());

create policy "user inserts own purchases"
  on purchases for insert
  with check (auth.uid() = user_id);

-- ── PROFILES: allow admin list-all (already covered by is_admin() on select) ─
-- Existing 0002_rls_policies.sql already permits admins to read every profile.

-- ── AUTO-CREATE PROFILE on signup ───────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
