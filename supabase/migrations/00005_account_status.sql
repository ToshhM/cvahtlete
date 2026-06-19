-- ==========================================================================
-- ATHLETE CV — Migration 00005
-- Gestion de l'état du compte : active / suspended / revoked.
-- ==========================================================================

alter table public.profiles
  add column if not exists account_status text not null default 'active'
  check (account_status in ('active', 'suspended', 'revoked'));

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_owner(auth.uid()) then return new; end if;
  if new.is_owner is distinct from old.is_owner
     or new.plan is distinct from old.plan
     or new.account_status is distinct from old.account_status then
    raise exception 'Modification non autorisée des privilèges du compte';
  end if;
  return new;
end;
$$;
