-- ============================================================
-- KARIGHAR — patch v2
-- Run this ONCE in the Supabase SQL editor AFTER schema.sql.
-- Enables: providers seeing/claiming open jobs, providers advancing job
-- status, job peers reading each other's profile, auto rating aggregation,
-- and the verification storage bucket.
-- (These are also baked into schema.sql for fresh installs.)
-- ============================================================

-- ---- Jobs: replace the single policy with granular ones ----
drop policy if exists jobs_customer on jobs;

-- SELECT: customer's own, assigned provider's own, admin, or the OPEN POOL
-- (unassigned created/bidding jobs) visible to approved providers.
create policy jobs_select on jobs for select using (
  customer_id = auth.uid()
  or provider_id = auth.uid()
  or is_admin()
  or (provider_id is null and status in ('created','bidding')
      and exists (select 1 from providers p where p.profile_id = auth.uid() and p.status = 'approved'))
);

-- INSERT: customers create their own jobs.
create policy jobs_insert on jobs for insert with check (customer_id = auth.uid());

-- UPDATE (customer): manage own jobs — cancel, award a bid, mark rated.
create policy jobs_update_customer on jobs for update
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- UPDATE (assigned provider): advance status on own jobs.
create policy jobs_update_provider on jobs for update
  using (provider_id = auth.uid()) with check (provider_id = auth.uid());

-- UPDATE (claim): approved provider claims an open, unassigned job.
create policy jobs_claim on jobs for update
  using (
    provider_id is null and status in ('created','bidding')
    and exists (select 1 from providers p where p.profile_id = auth.uid() and p.status = 'approved')
  )
  with check (provider_id = auth.uid());

-- UPDATE/ALL (admin)
create policy jobs_admin on jobs for all using (is_admin()) with check (is_admin());

-- ---- Profiles: let job peers read each other's basic profile ----
create policy profiles_job_peer on profiles for select using (
  exists (
    select 1 from jobs j
    where (j.customer_id = profiles.id and j.provider_id = auth.uid())
       or (j.provider_id = profiles.id and j.customer_id = auth.uid())
  )
);

-- ---- Reviews: auto-update provider rating + completed count ----
create or replace function on_review_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.provider_id, old.provider_id);
begin
  update providers set
    rating_avg = coalesce((select round(avg(rating)::numeric, 1) from reviews where provider_id = pid), 0),
    jobs_completed = (select count(*) from reviews where provider_id = pid)
  where profile_id = pid;
  return new;
end;
$$;
drop trigger if exists reviews_aggregate on reviews;
create trigger reviews_aggregate after insert or update or delete on reviews
  for each row execute function on_review_change();

-- ---- Storage: private bucket for CNIC / selfie ----
insert into storage.buckets (id, name, public)
  values ('verification', 'verification', false)
  on conflict (id) do nothing;

-- Providers upload/read their own files; admins read all.
drop policy if exists verif_own_write on storage.objects;
create policy verif_own_write on storage.objects for insert
  with check (bucket_id = 'verification' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists verif_own_update on storage.objects;
create policy verif_own_update on storage.objects for update
  using (bucket_id = 'verification' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists verif_read on storage.objects;
create policy verif_read on storage.objects for select
  using (bucket_id = 'verification' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
