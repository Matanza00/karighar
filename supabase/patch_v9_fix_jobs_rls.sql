-- ============================================================
-- KARIGHAR — patch v9: FIX job visibility RLS (CRITICAL)
-- Run ONCE in the Supabase SQL editor. Idempotent & authoritative.
--
-- Symptom this fixes: approved providers saw ZERO open jobs (couldn't accept
-- or bid on anything). Root cause: the original restrictive `jobs_customer`
-- policy was still active (patch_v2's replacement didn't take effect). This
-- drops every known jobs policy and recreates the correct set from scratch.
-- ============================================================

drop policy if exists jobs_customer         on jobs;
drop policy if exists jobs_select           on jobs;
drop policy if exists jobs_insert           on jobs;
drop policy if exists jobs_update_customer  on jobs;
drop policy if exists jobs_update_provider  on jobs;
drop policy if exists jobs_claim            on jobs;
drop policy if exists jobs_admin            on jobs;

-- SELECT: own (customer), assigned (provider), admin, or the OPEN POOL
-- (unassigned created/bidding jobs) for approved providers.
create policy jobs_select on jobs for select using (
  customer_id = auth.uid()
  or provider_id = auth.uid()
  or is_admin()
  or (provider_id is null and status in ('created','bidding')
      and exists (select 1 from providers p where p.profile_id = auth.uid() and p.status = 'approved'))
);

create policy jobs_insert on jobs for insert with check (customer_id = auth.uid());

create policy jobs_update_customer on jobs for update
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy jobs_update_provider on jobs for update
  using (provider_id = auth.uid()) with check (provider_id = auth.uid());

-- Approved provider claims an open, unassigned job.
create policy jobs_claim on jobs for update
  using (provider_id is null and status in ('created','bidding')
         and exists (select 1 from providers p where p.profile_id = auth.uid() and p.status = 'approved'))
  with check (provider_id = auth.uid());

create policy jobs_admin on jobs for all using (is_admin()) with check (is_admin());
