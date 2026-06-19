-- ============================================================================
-- ATHLETE CV — Migration initiale 00001
-- Tables : profiles · cvs · subscriptions  (toutes liées à auth.users)
-- Sécurité : RLS stricte partout + rôle "owner" (godpower) défini EN BASE.
-- Paiements : colonnes Stripe préparées mais INACTIVES (rien à casser plus tard).
-- À exécuter tel quel dans Supabase → SQL Editor.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────────────────
-- 1) PROFILES — 1:1 avec auth.users
-- ────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  is_owner   boolean not null default false,                -- godpower
  plan       text not null default 'free'
             check (plan in ('free','starter','pro','club')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- 2) CVS — un CV par utilisateur (extensible plus tard)
-- ────────────────────────────────────────────────────────────────────────
create table public.cvs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  slug             text not null unique,
  visibility       text not null default 'private'
                   check (visibility in ('private','public')),
  first            text not null default '',
  last             text not null default '',
  sport            text not null default '',
  location         text not null default '',
  tagline          text not null default '',
  bio              text not null default '',
  avatar_url       text,
  cine_bg_url      text,
  photo_pos_x      integer not null default 50,
  photo_pos_y      integer not null default 50,
  crop_zoom_avatar numeric not null default 1.4,
  stats            jsonb not null default '[]'::jsonb,
  palmares         jsonb not null default '[]'::jsonb,
  career           jsonb not null default '[]'::jsonb,
  links            jsonb not null default '[]'::jsonb,
  colors           jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index cvs_user_id_idx on public.cvs(user_id);

-- slug : minuscules/chiffres/tirets, 2–40 car., et mots réservés interdits
alter table public.cvs add constraint cvs_slug_format
  check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$');
alter table public.cvs add constraint cvs_slug_reserved
  check (slug not in (
    'admin','api','app','auth','builder','login','signup','dashboard',
    'cine','profil','exemples','sports','tarifs','cgv','checkout','concept',
    'mentions-legales','mot-de-passe-oublie'
  ));

-- ────────────────────────────────────────────────────────────────────────
-- 3) SUBSCRIPTIONS — minimal, défaut 'free' pour ne jamais bloquer l'app.
--    Colonnes Stripe présentes mais alimentées plus tard (webhook service_role).
-- ────────────────────────────────────────────────────────────────────────
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references auth.users(id) on delete cascade,
  status                 text not null default 'free'
                         check (status in ('free','active','trialing','past_due','canceled')),
  plan                   text not null default 'free'
                         check (plan in ('free','starter','pro','club')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- 4) OWNER GODPOWER — helper + attribution automatique à l'inscription
-- ────────────────────────────────────────────────────────────────────────

-- is_owner(uid) : SECURITY DEFINER => lit profiles en CONTOURNANT la RLS,
-- ce qui évite la récursion infinie quand une policy de profiles l'appelle.
create or replace function public.is_owner(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_owner from public.profiles where id = uid), false);
$$;

-- À chaque nouvel utilisateur auth : crée profile + subscription.
-- Le compte qui s'inscrit avec OWNER_EMAIL reçoit is_owner = true (godpower).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- ⬇️⬇️ TON EMAIL OWNER (godpower) — change ICI si besoin ⬇️⬇️
  owner_email constant text := 'shaine.paulo@gmail.com';
  is_the_owner boolean := (lower(new.email) = lower(owner_email));
begin
  insert into public.profiles (id, email, full_name, is_owner, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    is_the_owner,
    case when is_the_owner then 'club' else 'free' end
  );

  insert into public.subscriptions (user_id, status, plan)
  values (
    new.id,
    case when is_the_owner then 'active' else 'free' end,
    case when is_the_owner then 'club'   else 'free' end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Anti-escalade : un utilisateur normal ne peut PAS se promouvoir owner
-- ni changer son plan. Seuls le owner ou le service_role (auth.uid() null) le peuvent.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if;           -- service_role / triggers
  if public.is_owner(auth.uid()) then return new; end if;  -- godpower
  if new.is_owner is distinct from old.is_owner
     or new.plan is distinct from old.plan then
    raise exception 'Modification non autorisée des privilèges du compte';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- updated_at auto sur les 3 tables
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch      before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger cvs_touch           before update on public.cvs
  for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────
-- 5) RLS — activée partout, policies ultra-strictes (zéro fuite inter-comptes)
-- ────────────────────────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.cvs           enable row level security;
alter table public.subscriptions enable row level security;

-- PROFILES : on ne lit/modifie que SOI (ou tout, si owner).
create policy "profiles_select_self_or_owner" on public.profiles
  for select using (auth.uid() = id or public.is_owner(auth.uid()));
create policy "profiles_update_self_or_owner" on public.profiles
  for update using (auth.uid() = id or public.is_owner(auth.uid()))
              with check (auth.uid() = id or public.is_owner(auth.uid()));
-- INSERT/DELETE volontairement absents : l'insert passe par le trigger (definer).

-- CVS : lecture publique seulement si visibility='public', sinon soi/owner.
create policy "cvs_select_public_or_self_or_owner" on public.cvs
  for select using (
    visibility = 'public'
    or auth.uid() = user_id
    or public.is_owner(auth.uid())
  );
create policy "cvs_insert_self_or_owner" on public.cvs
  for insert with check (auth.uid() = user_id or public.is_owner(auth.uid()));
create policy "cvs_update_self_or_owner" on public.cvs
  for update using (auth.uid() = user_id or public.is_owner(auth.uid()))
              with check (auth.uid() = user_id or public.is_owner(auth.uid()));
create policy "cvs_delete_self_or_owner" on public.cvs
  for delete using (auth.uid() = user_id or public.is_owner(auth.uid()));

-- SUBSCRIPTIONS : lecture soi/owner ; écriture réservée au owner + service_role.
-- (Le webhook Stripe écrira via service_role, qui contourne la RLS.)
create policy "subscriptions_select_self_or_owner" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_owner(auth.uid()));
create policy "subscriptions_owner_write" on public.subscriptions
  for all using (public.is_owner(auth.uid()))
          with check (public.is_owner(auth.uid()));

-- ────────────────────────────────────────────────────────────────────────
-- 6) GRANTS explicites (la RLS reste la barrière de sécurité réelle)
-- ────────────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select                         on public.cvs           to anon;          -- profils publics
grant select, insert, update, delete on public.cvs           to authenticated;
grant select, update                 on public.profiles      to authenticated;
grant select                         on public.subscriptions to authenticated;
