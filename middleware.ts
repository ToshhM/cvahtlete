import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes nécessitant une session.
const PRIVATE = ["/dashboard", "/builder"];
// Routes réservées au rôle owner (godpower).
const OWNER_ONLY = ["/admin"];
// Pages d'auth : si déjà connecté, on n'y revient pas.
const AUTH_PAGES = ["/login", "/signup"];

const startsWith = (path: string, bases: string[]) =>
  bases.some((b) => path === b || path.startsWith(b + "/"));

/** Cookies de session durcis (identiques au client serveur). */
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Filet : Supabase pas encore configuré (.env.local absent) => on ne casse
  // jamais le site. La protection reprend dès que les clés existent.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, ...COOKIE_OPTS })
        );
      },
    },
  });

  // IMPORTANT (@supabase/ssr) : getUser() AVANT toute logique. C'est lui qui
  // rafraîchit le token et réécrit les cookies — sinon sessions expirées sur Vercel.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPrivate = startsWith(path, PRIVATE);
  const isOwnerOnly = startsWith(path, OWNER_ONLY);
  const isAuthPage = startsWith(path, AUTH_PAGES);

  // 1) Non connecté sur une route protégée => /login?next=…
  if (!user && (isPrivate || isOwnerOnly)) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(to);
  }

  // 2) Déjà connecté sur /login ou /signup => /dashboard
  if (user && isAuthPage) {
    const to = request.nextUrl.clone();
    to.pathname = "/dashboard";
    to.search = "";
    return NextResponse.redirect(to);
  }

  // 3) Route owner-only : on vérifie le rôle EN BASE (source de vérité).
  if (user && isOwnerOnly) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_owner")
      .eq("id", user.id)
      .single();
    if (!profile?.is_owner) {
      const to = request.nextUrl.clone();
      to.pathname = "/dashboard";
      to.search = "";
      return NextResponse.redirect(to);
    }
  }

  // Pages publiques (/, /cine, /exemples, /profil, /tarifs, /sports…) : pass-through.
  return response;
}

export const config = {
  // Exclut les assets statiques pour ne pas faire tourner l'auth inutilement.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4)$).*)",
  ],
};
