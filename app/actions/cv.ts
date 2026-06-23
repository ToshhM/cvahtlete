"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { normalizePublicLinks } from "@/utils/public-links";
import { slugify, isSafeJson, FIELD_LIMITS } from "@/lib/validation";
import { deriveEntitlements } from "@/lib/entitlements";

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
    links: normalizePublicLinks(row.links),
    visibility: String(row.visibility ?? "private"),
  };
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


export async function upsertCv(input: UpsertCvInput): Promise<UpsertCvResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Service indisponible." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const first = input.first.trim().slice(0, FIELD_LIMITS.first);
  const last = input.last.trim().slice(0, FIELD_LIMITS.last);
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

  const links = normalizePublicLinks(input.links);

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_owner, is_super_admin, plan, account_status")
    .eq("id", user.id)
    .single();
  const cinematic_enabled = deriveEntitlements(profile).cinematic;

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
    sport: input.sport.slice(0, FIELD_LIMITS.sport),
    discipline: (input.discipline ?? "").slice(0, FIELD_LIMITS.discipline),
    location: (input.location ?? "").slice(0, FIELD_LIMITS.location),
    tagline: (input.tagline ?? "").slice(0, FIELD_LIMITS.tagline),
    bio: (input.bio ?? "").slice(0, FIELD_LIMITS.bio),
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
    links,
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
      if (error.code === "23505") {
        const msg = `${error.message ?? ""}`.toLowerCase();
        if (msg.includes("cvs_user_id_unique") || msg.includes("user_id")) {
          return { error: "Un répertoire existe déjà pour ce compte." };
        }
        return { error: "Slug déjà pris — réessaie." };
      }
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
