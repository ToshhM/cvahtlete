import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Options de cookie durcies pour la production (Vercel + domaine custom). */
const COOKIE_OPTS = {
  httpOnly: true,                                   // invisible au JS => anti-XSS
  secure: process.env.NODE_ENV === "production",    // HTTPS only en prod
  sameSite: "lax" as const,                          // anti-CSRF, OAuth-friendly
  path: "/",
};

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * Lié aux cookies de la requête : auth.uid() est résolu automatiquement,
 * donc les policies RLS de la migration 00001 s'appliquent.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, ...COOKIE_OPTS })
            );
          } catch {
            // Appelé depuis un Server Component (cookies en lecture seule) :
            // le middleware se charge d'écrire la session rafraîchie.
          }
        },
      },
    }
  );
}
