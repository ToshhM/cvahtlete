-- ============================================================================
-- ATHLETE CV — Migration 00003
-- Bucket Supabase Storage "cv-images" + policies RLS.
-- Chaque utilisateur écrit uniquement dans son propre dossier (<user_id>/).
-- Lecture publique : les URLs des images sont dans les CV publics.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('cv-images', 'cv-images', true)
on conflict (id) do nothing;

-- Seul l'utilisateur authentifié peut uploader dans son propre dossier.
create policy "cv_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cv-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Mise à jour / écrasement dans son propre dossier.
create policy "cv_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cv-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Suppression dans son propre dossier.
create policy "cv_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'cv-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lecture publique (bucket public = true suffit, mais on l'explicite).
create policy "cv_images_read_public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'cv-images');
