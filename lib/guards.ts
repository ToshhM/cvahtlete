import { redirect } from "next/navigation";
import { getAuthUser, getAuthProfile, type AuthProfile } from "./auth";
import { deriveEntitlements, type Entitlements } from "./entitlements";
import type { User } from "@supabase/supabase-js";

interface AuthResult {
  user: User;
  profile: AuthProfile;
  entitlements: Entitlements;
}

export async function requireAuth(next: string): Promise<AuthResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/login");
  const user = await getAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const profile = await getAuthProfile();
  const entitlements = deriveEntitlements(profile);

  if (!entitlements.isActive) redirect("/login?error=inactive");

  return { user: user!, profile: profile!, entitlements };
}

export async function requireOwner(next: string): Promise<AuthResult> {
  const result = await requireAuth(next);
  if (!result.entitlements.isOwner) redirect("/dashboard");
  return result;
}
