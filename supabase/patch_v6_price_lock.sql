-- ============================================================
-- KARIGHAR — patch v6: price immutability + booking rate-limit
-- Run ONCE in the Supabase SQL editor AFTER patch_v5. Idempotent.
--
-- Fixes:
--   • A provider (or tampered client) could change a job's price AFTER the
--     customer agreed to it. Now a price can be set only once (null → value);
--     changing an already-set price is blocked (admin excepted).
--   • Quote services (base_price = null) can be priced once by the assigned Pro.
--   • Basic anti-spam: cap bookings per customer in a short window.
-- ============================================================

-- Price can be set once, then it's locked.
create or replace function jobs_lock_price()
returns trigger language plpgsql set search_path = public as $$
begin
  if is_admin() then return new; end if;
  if new.price is distinct from old.price and old.price is not null then
    raise exception 'Price is locked once it has been set';
  end if;
  return new;
end; $$;
drop trigger if exists jobs_before_update_price on jobs;
create trigger jobs_before_update_price before update on jobs
  for each row when (new.price is distinct from old.price)
  execute function jobs_lock_price();

-- Redefine insert guard (from patch_v4) to add a simple rate-limit.
create or replace function jobs_enforce_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare svc services%rowtype; recent int;
begin
  select count(*) into recent from jobs
    where customer_id = new.customer_id and created_at > now() - interval '10 minutes';
  if recent >= 6 then
    raise exception 'Too many bookings in a short time — please wait a few minutes.';
  end if;

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
