-- ============================================================
-- KARIGHAR — patch v8: block role self-escalation (SECURITY)
-- Run ONCE in the Supabase SQL editor. Idempotent.
--
-- Bug: the profiles UPDATE policy let any authenticated user change their own
-- `role` — including to 'admin'. This trigger blocks a normal user from
-- granting/removing the admin role. Customer <-> provider self-selection
-- (used by signup/onboarding) is still allowed. Server/service-role writes
-- (auth.uid() is null) and admins are unaffected.
-- ============================================================

create or replace function profiles_guard_role()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null           -- an authenticated end-user made this change
     and not is_admin()                    -- who is not an admin
     and (new.role = 'admin' or old.role = 'admin') then
    raise exception 'You are not allowed to change the admin role';
  end if;
  return new;
end; $$;

drop trigger if exists profiles_before_update_role on profiles;
create trigger profiles_before_update_role before update on profiles
  for each row when (old.role is distinct from new.role)
  execute function profiles_guard_role();
