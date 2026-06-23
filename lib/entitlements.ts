export interface Entitlements {
  plan: string;
  hasPlan: boolean;
  isOwner: boolean;
  isSuperAdmin: boolean;
  cinematic: boolean;
  isActive: boolean;
}

interface ProfileInput {
  plan?: string | null;
  is_owner?: boolean | null;
  is_super_admin?: boolean | null;
  account_status?: string | null;
}

export function deriveEntitlements(profile: ProfileInput | null): Entitlements {
  const plan = profile?.plan ?? "free";
  const isOwner = !!profile?.is_owner || !!profile?.is_super_admin;
  const isSuperAdmin = !!profile?.is_super_admin;
  return {
    plan,
    hasPlan: plan !== "free",
    isOwner,
    isSuperAdmin,
    cinematic: isOwner || plan === "pro" || plan === "club",
    isActive: !profile?.account_status || profile.account_status === "active",
  };
}
