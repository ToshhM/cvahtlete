-- ==========================================================================
-- ATHLETE CV — Migration 00004
-- Durcissement du modèle CV : 1 CV unique par utilisateur.
-- ==========================================================================

create unique index if not exists cvs_user_id_unique on public.cvs(user_id);