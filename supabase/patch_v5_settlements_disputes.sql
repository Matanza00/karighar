-- ============================================================
-- KARIGHAR — patch v5: commission settlements + disputes admin
-- Run ONCE in the Supabase SQL editor AFTER patch_v4. Idempotent.
--
-- COD accounting model: the customer pays the Pro cash directly, so the Pro
-- holds the full amount and OWES KARIGHAR the commission. Admin records when a
-- Pro has remitted that commission ("settlement").
-- ============================================================

-- Admin records a commission settlement (Pro paid the platform).
create or replace function record_settlement(p_provider uuid, p_amount numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  insert into provider_ledger(provider_id, job_id, type, amount, balance)
  values (p_provider, null, 'payout', p_amount, 0);  -- 'payout' = settlement recorded
end; $$;

-- Let admins fully manage disputes (the base policy only lets the raiser write).
drop policy if exists disp_admin on disputes;
create policy disp_admin on disputes for all using (is_admin()) with check (is_admin());
