"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export interface AuthState {
  error?: string;
  ok?: string;
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
  const h = headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

const PW_MIN = 10;
/** Mêmes règles que l'UX du formulaire, re-vérifiées côté serveur. */
function passwordError(pw: string): string | null {
  if (pw.length < PW_MIN) return `Mot de passe : ${PW_MIN} caractères minimum.`;
  if (!/[a-z]/.test(pw)) return "Mot de passe : une minuscule requise.";
  if (!/[A-Z]/.test(pw)) return "Mot de passe : une majuscule requise.";
  if (!/[0-9]/.test(pw)) return "Mot de passe : un chiffre requis.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Mot de passe : un caractère spécial requis.";
  return null;
}

// ---------------------------------------------------------------------------
// CONNEXION
// ---------------------------------------------------------------------------

export async function signIn(formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "E-mail et mot de passe requis." };

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
  const fullName = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !fullName) return { error: "Nom et e-mail requis." };
  const pwErr = passwordError(password);
  if (pwErr) return { error: pwErr };

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
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ---------------------------------------------------------------------------
// PROFIL COURANT (lecture serveur pour composants client, cookies httpOnly)
// ---------------------------------------------------------------------------

export interface MyProfile {
  fullName: string;
  plan: "free" | "starter" | "pro" | "club";
  isOwner: boolean;
  cinematic: boolean;
}

export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("full_name, plan, is_owner")
    .eq("id", user.id)
    .single();

  const plan = (data?.plan ?? "free") as MyProfile["plan"];
  const isOwner = !!data?.is_owner;
  return {
    fullName: data?.full_name ?? "",
    plan,
    isOwner,
    cinematic: isOwner || plan === "pro" || plan === "club",
  };
}
