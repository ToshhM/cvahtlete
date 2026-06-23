"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { siteOriginFromConfig } from "@/utils/site-origin";
import {
  normalizeEmail as normEmail,
  passwordError,
  FIELD_LIMITS,
} from "@/lib/validation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export interface AuthState {
  error?: string;
  ok?: string;
}

function hasSupabaseConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Empêche les open-redirects : seuls les chemins internes sont autorisés. */
function safeNext(next: unknown): string {
  const n = typeof next === "string" ? next : "";
  if (!n.startsWith("/") || n.startsWith("//") || n.startsWith("/\\")) {
    return "/dashboard";
  }
  return n;
}

/** Origine réelle de la requête : localhost en dev, domaine Vercel en prod. */
function requestOrigin(): string {
  const configuredOrigin = siteOriginFromConfig();
  if (process.env.NEXT_PUBLIC_SITE_URL) return configuredOrigin;

  if (process.env.NODE_ENV === 'production') {
    return configuredOrigin;
  }

  const h = headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return configuredOrigin;
}


// ---------------------------------------------------------------------------
// CONNEXION
// ---------------------------------------------------------------------------

export async function signIn(formData: FormData): Promise<AuthState> {
  const email = normEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "E-mail et mot de passe requis." };
  if (!hasSupabaseConfig()) return { error: "Configuration Supabase manquante sur le serveur." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Message volontairement générique (ne révèle pas si l'e-mail existe).
  if (error) return { error: "E-mail ou mot de passe incorrect." };

  revalidatePath("/", "layout");
  redirect(next);
}

// ---------------------------------------------------------------------------
// INSCRIPTION
// ---------------------------------------------------------------------------

export async function signUp(formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("name") ?? "").trim().slice(0, FIELD_LIMITS.fullName);
  const email = normEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !fullName) return { error: "Nom et e-mail requis." };
  const pwErr = passwordError(password);
  if (pwErr) return { error: pwErr };
  if (!hasSupabaseConfig()) return { error: "Configuration Supabase manquante sur le serveur." };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${requestOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("registered")) {
      return { error: "Un compte existe déjà avec cet e-mail." };
    }
    return { error: "Inscription impossible. Réessaie." };
  }

  // Si la confirmation d'e-mail est activée (recommandé), pas de session :
  // l'utilisateur doit cliquer le lien reçu.
  if (!data.session) {
    return { ok: "Compte créé ! Vérifie tes e-mails pour confirmer ton adresse, puis connecte-toi." };
  }

  // Confirmation désactivée : session immédiate.
  revalidatePath("/", "layout");
  redirect(next);
}

// ---------------------------------------------------------------------------
// DÉCONNEXION
// ---------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  if (!hasSupabaseConfig()) {
    redirect("/");
  }
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ---------------------------------------------------------------------------
// PROFIL COURANT (lecture serveur pour composants client, cookies httpOnly)
// ---------------------------------------------------------------------------

import { getAuthProfile } from "@/lib/auth";
import { deriveEntitlements } from "@/lib/entitlements";

export interface MyProfile {
  fullName: string;
  plan: "free" | "starter" | "pro" | "club";
  isOwner: boolean;
  cinematic: boolean;
}

export async function getMyProfile(): Promise<MyProfile | null> {
  if (!hasSupabaseConfig()) return null;
  const data = await getAuthProfile();
  if (!data) return null;
  const ent = deriveEntitlements(data);
  if (!ent.isActive) return null;

  return {
    fullName: data.full_name ?? "",
    plan: ent.plan as MyProfile["plan"],
    isOwner: ent.isOwner,
    cinematic: ent.cinematic,
  };
}
