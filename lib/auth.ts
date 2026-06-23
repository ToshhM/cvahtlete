import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

/**
 * Cached auth helpers — React cache() deduplicates within a single RSC render.
 * Layout + page can both call these without triggering redundant Supabase queries.
 */

export const getAuthUser = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export interface AuthProfile {
  full_name: string;
  email: string;
  is_owner: boolean;
  is_super_admin: boolean;
  plan: string;
  account_status: string | null;
}

export const getAuthProfile = cache(async (): Promise<AuthProfile | null> => {
  const user = await getAuthUser();
  if (!user) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, is_owner, is_super_admin, plan, account_status")
    .eq("id", user.id)
    .single();
  return data as AuthProfile | null;
});
