-- ============================================================================
-- ATHLETE CV — Migration 00002
-- Colonnes manquantes dans cvs + colonne cinematic_enabled (snapshot plan).
-- À exécuter dans Supabase → SQL Editor après 00001.
-- ============================================================================

alter table public.cvs
  add column if not exists discipline        text    not null default '',
  add column if not exists cine_bg_pos_x     integer not null default 50,
  add column if not exists cine_bg_pos_y     integer not null default 50,
  add column if not exists crop_zoom_cine_bg numeric not null default 1.25,
  -- Snapshot de l'entitlement cinématique : mis à jour lors de chaque upsert.
  -- Permet à un visiteur anonyme de savoir si le mode cine est actif
  -- sans avoir à rejoindre la table profiles (qui est protégée par RLS).
  add column if not exists cinematic_enabled boolean not null default false;
