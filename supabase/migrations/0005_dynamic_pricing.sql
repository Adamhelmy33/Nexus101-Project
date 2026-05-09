-- ═══════════════════════════════════════════════
-- Nexus 101 — Dynamic pricing schema updates
-- ═══════════════════════════════════════════════
-- 1. Snapshot the price the student actually paid (in NXP) at enrollment
--    time, so historical receipts stay accurate even if config changes.
-- 2. Snapshot the EGP cents and exchange rate used for any Paymob bundle.
-- 3. Replace redeem_course() to read the *live* config price (or accept
--    an explicit override) and persist the snapshot.

alter table enrollments
  add column if not exists purchase_price_points int,
  add column if not exists exchange_rate         numeric(8,4) default 1;

alter table paymob_transactions
  add column if not exists exchange_rate         numeric(8,4) default 1,
  add column if not exists points_per_egp        numeric(8,4);  -- denormalised for analytics

-- ── New redeem_course: accepts a price override (passed by the frontend
--    based on the live nexus.config.js). Defaults to courses.price_points
--    if no override is provided, so existing callers keep working.
create or replace function redeem_course(
  p_course_id uuid,
  p_price_override int default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user_id        uuid := auth.uid();
  v_balance        int;
  v_price          int;
  v_course_price   int;
  v_new_balance    int;
  v_ledger_id      uuid;
  v_course_slug    text;
  v_idem           text;
  v_exchange_rate  numeric(8,4);
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select price_points, slug into v_course_price, v_course_slug
    from courses where id = p_course_id;
  if v_course_price is null then raise exception 'Course not found'; end if;

  -- Use the override if the frontend supplied a config-driven price
  -- (recommended). Otherwise fall back to the price stored on the row.
  v_price         := coalesce(p_price_override, v_course_price);
  v_exchange_rate := coalesce(current_setting('nexus.exchange_rate', true)::numeric, 1);

  if exists (select 1 from enrollments where user_id = v_user_id and course_id = p_course_id) then
    raise exception 'Already enrolled in this course';
  end if;

  v_idem := 'enroll:' || v_user_id || ':' || p_course_id;

  insert into wallet_balances (user_id) values (v_user_id) on conflict do nothing;
  select balance_points into v_balance from wallet_balances where user_id = v_user_id for update;
  if coalesce(v_balance, 0) < v_price then
    raise exception 'Insufficient Nexus Points (have %, need %)', coalesce(v_balance,0), v_price;
  end if;

  v_new_balance := v_balance - v_price;

  insert into wallet_ledger (user_id, delta_points, kind, reference_type, reference_id, balance_after, idempotency_key, meta)
  values (v_user_id, -v_price, 'course_enrollment', 'enrollment', p_course_id::text, v_new_balance, v_idem,
          jsonb_build_object(
            'course_slug',         v_course_slug,
            'price_points',        v_price,
            'catalog_price_points', v_course_price,
            'exchange_rate',       v_exchange_rate
          ))
  returning id into v_ledger_id;

  -- Snapshot price + exchange rate on the enrollment row
  insert into enrollments (user_id, course_id, source, ledger_id, purchase_price_points, exchange_rate)
       values (v_user_id, p_course_id, 'wallet', v_ledger_id, v_price, v_exchange_rate);

  update wallet_balances
     set balance_points = v_new_balance,
         lifetime_spent = lifetime_spent + v_price,
         updated_at     = now()
   where user_id = v_user_id;

  return jsonb_build_object(
    'ok',                  true,
    'ledger_id',           v_ledger_id,
    'balance',             v_new_balance,
    'purchase_price',      v_price,
    'catalog_price',       v_course_price
  );
end;
$$;

grant execute on function redeem_course(uuid, int) to authenticated;
