-- ============================================================
-- KARIGHAR — patch v10: FIX status-change trigger crash (CRITICAL)
-- Run ONCE in the Supabase SQL editor. Idempotent.
--
-- Bug: jobs_notify() called replace(new.status, '_', ' ') on the `job_status`
-- ENUM. Postgres has no replace() for enums, so it raised
--   "function replace(job_status, unknown, unknown) does not exist"
-- and ABORTED the UPDATE. Effect: providers could not move a job past
-- 'assigned' (on the way / arrived / working / completed / paid all failed).
-- Fix: cast the enum to text before replace().
-- ============================================================

create or replace function jobs_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.provider_id is null and new.provider_id is not null then
    perform notify_user(new.customer_id, 'job_assigned', 'A pro is assigned', new.title, new.id);
    perform notify_user(new.provider_id, 'job_new', 'New job assigned', new.title, new.id);
  end if;
  if new.status is distinct from old.status then
    if new.status in ('en_route','arrived','in_progress','completed') then
      perform notify_user(new.customer_id, 'status', 'Update on ' || new.title,
        'Status: ' || replace(new.status::text, '_', ' '), new.id);
    elsif new.status = 'cancelled' then
      perform notify_user(new.customer_id, 'status', 'Booking cancelled', new.title, new.id);
      perform notify_user(new.provider_id, 'status', 'Job cancelled', new.title, new.id);
    elsif new.status = 'rated' then
      perform notify_user(new.provider_id, 'rating', 'You got a new rating', new.title, new.id);
    end if;
  end if;
  return new;
end; $$;
