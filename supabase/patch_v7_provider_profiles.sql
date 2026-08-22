-- ============================================================
-- KARIGHAR — patch v7: public provider profiles + cancellation reasons
-- Run ONCE in the Supabase SQL editor AFTER patch_v6. Idempotent.
-- ============================================================

-- Public, read-only provider profile view. Exposes ONLY safe fields
-- (no phone/email) for approved providers, so customers can view a Pro's
-- reputation before/while booking. Runs with the view owner's rights, so it
-- bypasses the stricter profiles RLS while still hiding sensitive columns.
create or replace view public_provider_profiles as
  select prov.profile_id as id,
         pr.full_name,
         pr.avatar_url,
         prov.bio,
         prov.rating_avg,
         prov.jobs_completed,
         prov.service_areas
  from providers prov
  join profiles pr on pr.id = prov.profile_id
  where prov.status = 'approved';

grant select on public_provider_profiles to anon, authenticated;

-- Capture why a job was cancelled (shown to admin/support).
alter table jobs add column if not exists cancel_reason text;
