"use server";

import { createClient } from "@/utils/supabase/server";

const BUCKET = "cv-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function uploadImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Service indisponible." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Fichier manquant." };
  if (file.size > MAX_BYTES) return { error: "Taille max : 5 Mo." };
  if (!ALLOWED_TYPES.has(file.type)) return { error: "Format non supporté (jpg, png, webp, avif, gif)." };

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z]/g, "") || "jpg";
  // Dossier = user_id → policy Storage "foldername = auth.uid()"
  const path = `${user.id}/${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) return { error: "Échec de l'upload." };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
