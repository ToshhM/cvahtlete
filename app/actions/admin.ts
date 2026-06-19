"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type AccountStatus = "active" | "suspended" | "revoked";

export interface AdminActionState {
  ok?: string;
  error?: string;
}

function normalizeEmail(email: FormDataEntryValue | null): string {
  return String(email ?? "").trim().toLowerCase();
}

export async function updateAccountStatus(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const targetEmail = normalizeEmail(formData.get("email"));
  const rawStatus = String(formData.get("account_status") ?? "").trim();

  if (!targetEmail) return { error: "E-mail requis." };
  if (!['active', 'suspended', 'revoked'].includes(rawStatus)) {
    return { error: "Statut invalide." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: actor } = await supabase
    .from('profiles')
    .select('is_owner, is_super_admin, account_status, email')
    .eq('id', user.id)
    .single();

  if (!actor?.is_owner && !actor?.is_super_admin) return { error: "Accès refusé." };
  if (actor.account_status && actor.account_status !== 'active') return { error: "Compte inactif." };
  if ((actor.email ?? '').toLowerCase() === targetEmail) {
    return { error: "Tu ne peux pas modifier ton propre statut depuis cette console." };
  }

  const admin = createAdminClient();
  const { data: targetProfile, error: fetchError } = await admin
    .from('profiles')
    .select('id, email, account_status, is_super_admin')
    .eq('email', targetEmail)
    .maybeSingle();

  if (fetchError) return { error: "Impossible de charger le compte cible." };
  if (!targetProfile) return { error: "Compte introuvable." };
  if (targetProfile.is_super_admin && !actor.is_super_admin) {
    return { error: "Seul le super admin peut modifier ce compte." };
  }

  const status = rawStatus as AccountStatus;
  const { error: updateError } = await admin
    .from('profiles')
    .update({ account_status: status })
    .eq('id', targetProfile.id);

  if (updateError) return { error: "Impossible de mettre à jour le statut." };

  revalidatePath('/admin');
  return { ok: `${targetProfile.email} est maintenant en statut ${status}.` };
}
