-- ═══════════════════════════════════════════════
-- Nexus 101 — Wallet RPCs (atomic, race-safe)
-- ═══════════════════════════════════════════════
-- All wallet writes happen INSIDE these functions, which:
--   • Lock the user's balance row (FOR UPDATE)
--   • Append to the ledger (with idempotency_key uniqueness)
--   • Update the denormalised balance row
-- This prevents race conditions and double-spends.

-- ── credit_wallet (called by Paymob webhook only) ──
create or replace function credit_wallet(
  p_user_id          uuid,
  p_points           int,
  p_idempotency_key  text,           -- e.g. 'paymob:<paymob_txn_id>' — guarantees idempotency
  p_reference_id     text default null,
  p_meta             jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_existing       wallet_ledger%rowtype;
  v_balance        int;
  v_new_balance    int;
  v_ledger_id      uuid;
begin
  if p_points <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  -- Idempotency: same key already credited? Return existing.
  select * into v_existing from wallet_ledger
   where idempotency_key = p_idempotency_key limit 1;
  if found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'ledger_id', v_existing.id, 'balance', v_existing.balance_after);
  end if;

  -- Ensure balance row exists, lock it
  insert into wallet_balances (user_id) values (p_user_id) on conflict do nothing;
  select balance_points into v_balance from wallet_balances where user_id = p_user_id for update;
  v_new_balance := coalesce(v_balance, 0) + p_points;

  -- Append ledger
  insert into wallet_ledger (user_id, delta_points, kind, reference_type, reference_id, balance_after, idempotency_key, meta)
  values (p_user_id, p_points, 'bundle_purchase', 'paymob_txn', p_reference_id, v_new_balance, p_idempotency_key, p_meta)
  returning id into v_ledger_id;

  -- Update denormalised balance
  update wallet_balances
     set balance_points = v_new_balance,
         lifetime_deposited = lifetime_deposited + p_points,
         updated_at = now()
   where user_id = p_user_id;

  return jsonb_build_object('ok', true, 'ledger_id', v_ledger_id, 'balance', v_new_balance);
end;
$$;

-- ── redeem_course (called when user enrolls using points) ──
create or replace function redeem_course(p_course_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user_id        uuid := auth.uid();
  v_balance        int;
  v_price          int;
  v_new_balance    int;
  v_ledger_id      uuid;
  v_course_slug    text;
  v_idem           text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Fetch price and validate
  select price_points, slug into v_price, v_course_slug
    from courses where id = p_course_id;
  if v_price is null then raise exception 'Course not found'; end if;

  -- Already enrolled? Block (also enforced by enrollments unique constraint)
  if exists (select 1 from enrollments where user_id = v_user_id and course_id = p_course_id) then
    raise exception 'Already enrolled in this course';
  end if;

  -- Idempotency: a single enrollment row per user+course
  v_idem := 'enroll:' || v_user_id || ':' || p_course_id;

  -- Lock balance
  insert into wallet_balances (user_id) values (v_user_id) on conflict do nothing;
  select balance_points into v_balance from wallet_balances where user_id = v_user_id for update;
  if coalesce(v_balance, 0) < v_price then
    raise exception 'Insufficient Nexus Points (have %, need %)', coalesce(v_balance,0), v_price;
  end if;

  v_new_balance := v_balance - v_price;

  -- Ledger entry
  insert into wallet_ledger (user_id, delta_points, kind, reference_type, reference_id, balance_after, idempotency_key, meta)
  values (v_user_id, -v_price, 'course_enrollment', 'enrollment', p_course_id::text, v_new_balance, v_idem,
          jsonb_build_object('course_slug', v_course_slug, 'price_points', v_price))
  returning id into v_ledger_id;

  -- Insert enrollment
  insert into enrollments (user_id, course_id, source, ledger_id) values (v_user_id, p_course_id, 'wallet', v_ledger_id);

  -- Update denorm balance
  update wallet_balances
     set balance_points = v_new_balance,
         lifetime_spent = lifetime_spent + v_price,
         updated_at = now()
   where user_id = v_user_id;

  return jsonb_build_object('ok', true, 'ledger_id', v_ledger_id, 'balance', v_new_balance);
end;
$$;

grant execute on function credit_wallet  to service_role;     -- only Edge Functions can call
grant execute on function redeem_course  to authenticated;    -- any logged-in user
