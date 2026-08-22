-- ============================================================
-- KARIGHAR — patch v4: business-logic integrity + accounting + notifications
-- Run ONCE in the Supabase SQL editor AFTER schema.sql, patch_v2, patch_v3.
-- Idempotent (safe to re-run).
--
-- Enforces server-side (so a tampered web/mobile client cannot cheat):
--   • fixed-job price & commission are derived from the catalog, not the client
--   • jobs can only move through valid status transitions
--   • reviews can only be left for your own completed job
--   • COD payment + provider ledger are written automatically on completion
--   • in-app notifications on assignment, status change, new bid
-- ============================================================

-- ---------- Notifications ----------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  job_id     uuid references jobs(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id, read);

alter table notifications enable row level security;
drop policy if exists notif_own on notifications;
create policy notif_own on notifications for select using (user_id = auth.uid());
drop policy if exists notif_update on notifications;
create policy notif_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function notify_user(p_user uuid, p_type text, p_title text, p_body text, p_job uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is not null then
    insert into notifications(user_id, type, title, body, job_id)
    values (p_user, p_type, p_title, p_body, p_job);
  end if;
end; $$;

-- ---------- Price / commission integrity on job creation ----------
create or replace function jobs_enforce_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare svc services%rowtype;
begin
  if new.type = 'fixed' then
    if new.service_id is null then raise exception 'A fixed job needs a service'; end if;
    select * into svc from services where id = new.service_id and is_active = true;
    if not found then raise exception 'That service is not available'; end if;
    new.price := svc.base_price;      -- server-derived; ignore client value
    new.commission_rate := 0.20;
    new.status := 'created';
  else
    new.price := null;
    new.commission_rate := 0.15;
    new.status := 'bidding';
  end if;
  return new;
end; $$;
drop trigger if exists jobs_before_insert on jobs;
create trigger jobs_before_insert before insert on jobs
  for each row execute function jobs_enforce_insert();

-- ---------- Status-transition state machine ----------
create or replace function jobs_enforce_status()
returns trigger language plpgsql set search_path = public as $$
declare ok boolean;
begin
  if is_admin() then return new; end if;   -- admin can override
  ok := case old.status
    when 'created'     then new.status in ('assigned','cancelled')
    when 'bidding'     then new.status in ('assigned','cancelled')
    when 'assigned'    then new.status in ('en_route','cancelled')
    when 'en_route'    then new.status in ('arrived','cancelled')
    when 'arrived'     then new.status in ('in_progress','cancelled')
    when 'in_progress' then new.status in ('completed','cancelled')
    when 'completed'   then new.status in ('paid','disputed')
    when 'paid'        then new.status in ('rated','disputed')
    else false end;
  if not ok then
    raise exception 'Illegal status change: % -> %', old.status, new.status;
  end if;
  return new;
end; $$;
drop trigger if exists jobs_before_update_status on jobs;
create trigger jobs_before_update_status before update on jobs
  for each row when (old.status is distinct from new.status)
  execute function jobs_enforce_status();

-- ---------- Review integrity ----------
create or replace function reviews_enforce()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (
    select 1 from jobs j
    where j.id = new.job_id
      and j.customer_id = auth.uid()
      and j.provider_id = new.provider_id
      and j.status in ('completed','paid','rated')
  ) then
    raise exception 'You can only review your own completed job';
  end if;
  return new;
end; $$;
drop trigger if exists reviews_before_insert on reviews;
create trigger reviews_before_insert before insert on reviews
  for each row execute function reviews_enforce();

-- ---------- Payment + provider ledger on completion (COD) ----------
create or replace function jobs_on_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare amt numeric; commission numeric; payout numeric;
begin
  amt := coalesce(new.price, 0);
  commission := round(amt * new.commission_rate, 2);
  payout := amt - commission;
  if not exists (select 1 from payments where job_id = new.id) then
    insert into payments(job_id, amount, method, commission, provider_payout, status)
      values (new.id, amt, 'cod', commission, payout, 'collected');
    if new.provider_id is not null then
      insert into provider_ledger(provider_id, job_id, type, amount, balance)
        values (new.provider_id, new.id, 'earning', payout, 0),
               (new.provider_id, new.id, 'commission', -commission, 0);
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists jobs_after_paid on jobs;
create trigger jobs_after_paid after update on jobs
  for each row when (new.status = 'paid' and old.status is distinct from 'paid')
  execute function jobs_on_paid();

-- ---------- Notifications on job changes ----------
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
        'Status: ' || replace(new.status,'_',' '), new.id);
    elsif new.status = 'cancelled' then
      perform notify_user(new.customer_id, 'status', 'Booking cancelled', new.title, new.id);
      perform notify_user(new.provider_id, 'status', 'Job cancelled', new.title, new.id);
    elsif new.status = 'rated' then
      perform notify_user(new.provider_id, 'rating', 'You got a new rating', new.title, new.id);
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists jobs_after_update_notify on jobs;
create trigger jobs_after_update_notify after update on jobs
  for each row execute function jobs_notify();

create or replace function bids_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare cust uuid; jtitle text;
begin
  select customer_id, title into cust, jtitle from jobs where id = new.job_id;
  perform notify_user(cust, 'bid', 'New quote received',
    'A pro quoted Rs ' || new.amount || ' for ' || jtitle, new.job_id);
  return new;
end; $$;
drop trigger if exists bids_after_insert on bids;
create trigger bids_after_insert after insert on bids
  for each row execute function bids_notify();

-- ---------- Realtime for notifications ----------
do $$ begin alter publication supabase_realtime add table notifications;
exception when duplicate_object then null; end $$;
