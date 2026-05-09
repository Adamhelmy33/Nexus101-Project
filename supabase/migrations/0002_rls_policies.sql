-- ═══════════════════════════════════════════════
-- Nexus 101 — Row-Level Security
-- ═══════════════════════════════════════════════
-- Every user can only read/write THEIR OWN rows.
-- Admins (profiles.role = 'admin') can read everything.

-- Helper function: is the caller an admin?
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ── PROFILES ─────────────────────────────
alter table profiles enable row level security;
create policy "users read own profile"   on profiles for select using (auth.uid() = id or is_admin());
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);

-- ── PUBLIC CATALOG ───────────────────────
alter table universities enable row level security;
create policy "anyone reads universities" on universities for select using (true);
alter table courses enable row level security;
create policy "anyone reads courses" on courses for select using (published = true or is_admin());
alter table modules enable row level security;
create policy "anyone reads modules" on modules for select using (true);
alter table topics enable row level security;
create policy "anyone reads topics" on topics for select using (true);

-- ── ENROLLMENTS ──────────────────────────
alter table enrollments enable row level security;
create policy "user reads own enrollments" on enrollments for select using (auth.uid() = user_id or is_admin());
-- Insert blocked for normal users; only the redeem_course() RPC writes.

-- ── WALLET ───────────────────────────────
alter table wallet_balances enable row level security;
create policy "user reads own balance" on wallet_balances for select using (auth.uid() = user_id or is_admin());

alter table wallet_ledger enable row level security;
create policy "user reads own ledger" on wallet_ledger for select using (auth.uid() = user_id or is_admin());
-- All wallet writes go through SECURITY DEFINER RPCs only — no direct insert policy.

-- ── PAYMOB ───────────────────────────────
alter table paymob_transactions enable row level security;
create policy "user reads own paymob txns" on paymob_transactions for select using (auth.uid() = user_id or is_admin());
-- Inserts only from the Edge Function (using service_role key).

-- ── PROGRESS ─────────────────────────────
alter table watch_sessions enable row level security;
create policy "user manages own watch sessions"
  on watch_sessions for all
  using  (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id);

alter table topic_mastery enable row level security;
create policy "user manages own mastery"
  on topic_mastery for all
  using  (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id);

alter table quiz_attempts enable row level security;
create policy "user manages own attempts"
  on quiz_attempts for all
  using  (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id);
