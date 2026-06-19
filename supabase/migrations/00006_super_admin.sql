-- ==========================================================================
-- ATHLETE CV — Migration 00006
-- Super admin : toshirompika@gmail.com
-- ==========================================================================

alter table public.profiles
  add column if not exists is_super_admin boolean not null default false;

create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_super_admin from public.profiles where id = uid), false);
$$;

create or replace function public.is_owner(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_owner from public.profiles where id = uid), false)
         or public.is_super_admin(uid);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_email constant text := 'shaine.paulo@gmail.com';
  super_admin_email constant text := 'toshirompika@gmail.com';
  is_the_super_admin boolean := (lower(new.email) = lower(super_admin_email));
  is_the_owner boolean := (lower(new.email) = lower(owner_email)) or is_the_super_admin;
begin
  insert into public.profiles (id, email, full_name, is_owner, is_super_admin, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    is_the_owner,
    is_the_super_admin,
    case when is_the_owner then 'club' else 'free' end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        is_owner = excluded.is_owner,
        is_super_admin = excluded.is_super_admin,
        plan = excluded.plan;

  insert into public.subscriptions (user_id, status, plan)
  values (
    new.id,
    case when is_the_owner then 'active' else 'free' end,
    case when is_the_owner then 'club'   else 'free' end
  )
  on conflict (user_id) do update
    set status = excluded.status,
        plan = excluded.plan;

  return new;
end;
$$;

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
     or new.is_super_admin is distinct from old.is_super_admin
     or new.plan is distinct from old.plan
     or new.account_status is distinct from old.account_status then
    raise exception 'Modification non autorisée des privilèges du compte';
  end if;
  return new;
end;
$$;

update public.profiles
set is_super_admin = true,
    is_owner = true,
    plan = 'club'
where lower(email) = 'toshirompika@gmail.com';
