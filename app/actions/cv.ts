"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// ─── Type partagé (CineView · ProfileView · builder · /[slug]) ───────────────
// Convention camelCase : correspond au builder, aux JSON de démo et à ProfileView.
// rowToCv() fait la traduction DB→camelCase en un seul endroit.

export interface CvData {
  slug: string;
  first: string;
  last: string;
  sport: string;
  emoji?: string;
  discipline?: string;
  tagline?: string;
  bio?: string;
  location?: string;
  verified?: boolean;
  colors: { a?: string; b?: string };
  avatar?: string;
  photoPosX?: number;
  photoPosY?: number;
  cropZoomAvatar?: number;
  cineBg?: string;
  cineBgPosX?: number;
  cineBgPosY?: number;
  cropZoomCineBg?: number;
  cinematic?: boolean;
  stats?: unknown[];
  palmares?: unknown[];
  career?: unknown[];
  links?: unknown[];
  visibility?: string;
}

const EMOJI: Record<string, string> = {
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Volley: "🏐",
  "Athlétisme": "⚡",
  Rugby: "🏉",
  Autre: "🏅",
};

function rowToCv(row: Record<string, unknown>): CvData {
  const colors = (row.colors as Record<string, string> | null) ?? {};
  return {
    slug: String(row.slug ?? ""),
    first: String(row.first ?? ""),
    last: String(row.last ?? ""),
    sport: String(row.sport ?? ""),
    emoji: EMOJI[String(row.sport)] ?? "🏅",
    discipline: (row.discipline as string) || undefined,
    tagline: (row.tagline as string) || undefined,
    bio: (row.bio as string) || undefined,
    location: (row.location as string) || undefined,
    verified: true,
    colors: { a: colors.a, b: colors.b },
    avatar: (row.avatar_url as string) || undefined,
    photoPosX: (row.photo_pos_x as number) ?? 50,
    photoPosY: (row.photo_pos_y as number) ?? 50,
    cropZoomAvatar: Number(row.crop_zoom_avatar ?? 1.4),
    cineBg: (row.cine_bg_url as string) || undefined,
    cineBgPosX: (row.cine_bg_pos_x as number) ?? 50,
    cineBgPosY: (row.cine_bg_pos_y as number) ?? 50,
    cropZoomCineBg: Number(row.crop_zoom_cine_bg ?? 1.25),
    cinematic: !!(row.cinematic_enabled),
    stats: (row.stats as unknown[]) ?? [],
    palmares: (row.palmares as unknown[]) ?? [],
    career: (row.career as unknown[]) ?? [],
    links: (row.links as unknown[]) ?? [],
    visibility: String(row.visibility ?? "private"),
  };
}

// ─── Slugify ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ─── Upsert CV ───────────────────────────────────────────────────────────────

export interface UpsertCvInput {
  first: string;
  last: string;
  sport: string;
  discipline?: string;
  tagline?: string;
  bio?: string;
  location?: string;
  colors?: { a: string; b: string };
  avatar?: string;
  photoPosX?: number;
  photoPosY?: number;
  cropZoomAvatar?: number;
  cineBg?: string;
  cineBgPosX?: number;
  cineBgPosY?: number;
  cropZoomCineBg?: number;
  stats?: unknown[];
  palmares?: unknown[];
  career?: unknown[];
  links?: unknown[];
  visibility?: "private" | "public";
}

export interface UpsertCvResult {
  slug?: string;
  error?: string;
}

const JSON_MAX = 20_000; // anti-bloat / anti-DoS

function isSafeJson(v: unknown): boolean {
  if (!Array.isArray(v)) return false;
  try {
    return JSON.stringify(v).length <= JSON_MAX;
  } catch {
    return false;
  }
}

export async function upsertCv(input: UpsertCvInput): Promise<UpsertCvResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Service indisponible." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const first = input.first.trim().slice(0, 60);
  const last = input.last.trim().slice(0, 60);
  if (!first || !last) return { error: "Prénom et nom requis." };

  // Validation des JSONB côté serveur (défense en profondeur).
  for (const [field, val] of [
    ["stats", input.stats ?? []],
    ["palmares", input.palmares ?? []],
    ["career", input.career ?? []],
    ["links", input.links ?? []],
  ] as const) {
    if (!isSafeJson(val)) return { error: `Données « ${field} » invalides ou trop volumineuses.` };
  }

  // Snapshot cinematic depuis le plan courant (lecture RLS = self uniquement).
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_owner, plan")
    .eq("id", user.id)
    .single();
  const cinematic_enabled = !!(
    profile?.is_owner ||
    profile?.plan === "pro" ||
    profile?.plan === "club"
  );

  // CV existant ?
  const { data: existing } = await supabase
    .from("cvs")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  let slug = (existing?.slug as string | undefined);
  if (!slug) {
    const base = slugify(`${first} ${last}`);
    const { data: taken } = await supabase
      .from("cvs").select("id").eq("slug", base).maybeSingle();
    slug = taken ? `${base}-${Date.now().toString(36).slice(-4)}` : base;
  }

  const row = {
    user_id: user.id,
    slug,
    first,
    last,
    sport: input.sport.slice(0, 40),
    discipline: (input.discipline ?? "").slice(0, 60),
    location: (input.location ?? "").slice(0, 80),
    tagline: (input.tagline ?? "").slice(0, 160),
    bio: (input.bio ?? "").slice(0, 2000),
    avatar_url: input.avatar || null,
    cine_bg_url: input.cineBg || null,
    photo_pos_x: input.photoPosX ?? 50,
    photo_pos_y: input.photoPosY ?? 50,
    crop_zoom_avatar: input.cropZoomAvatar ?? 1.4,
    cine_bg_pos_x: input.cineBgPosX ?? 50,
    cine_bg_pos_y: input.cineBgPosY ?? 50,
    crop_zoom_cine_bg: input.cropZoomCineBg ?? 1.25,
    stats: input.stats ?? [],
    palmares: input.palmares ?? [],
    career: input.career ?? [],
    links: input.links ?? [],
    colors: input.colors ?? { a: "#8bb6ff", b: "#79e0cf" },
    visibility: input.visibility ?? "private",
    cinematic_enabled,
  };

  if (existing) {
    const { error } = await supabase.from("cvs").update(row).eq("id", existing.id);
    if (error) return { error: "Erreur lors de la sauvegarde." };
  } else {
    const { error } = await supabase.from("cvs").insert(row);
    if (error) {
      if (error.code === "23505") return { error: "Slug déjà pris — réessaie." };
      return { error: "Erreur lors de la création." };
    }
  }

  revalidatePath(`/${slug}`);
  return { slug };
}

// ─── Lecture : CV de l'utilisateur courant ───────────────────────────────────

export async function getMyCv(): Promise<CvData | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("cvs").select("*").eq("user_id", user.id).maybeSingle();
  return data ? rowToCv(data as Record<string, unknown>) : null;
}

// ─── Lecture : CV par slug (RLS gère public / self / owner) ──────────────────

export async function getCvBySlug(slug: string): Promise<CvData | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("cvs").select("*").eq("slug", slug).maybeSingle();
  return data ? rowToCv(data as Record<string, unknown>) : null;
}
