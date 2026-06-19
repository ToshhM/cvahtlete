import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { siteOriginFromConfig } from "@/utils/site-origin";

/** Empêche les open-redirects sur le paramètre ?next=. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function siteOrigin(request: Request): string {
  return siteOriginFromConfig(new URL(request.url).origin);
}

/**
 * Échange le code de confirmation e-mail (ou OAuth) contre une session,
 * puis redirige vers `next`. Gère le reverse-proxy Vercel via x-forwarded-host.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteOrigin(request)}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
