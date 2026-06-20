import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { PACKS, isPackId } from "@/utils/packs";
import { siteOriginFromConfig } from "@/utils/site-origin";

interface CheckoutBody {
  pack?: string;
}

function inferOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return siteOriginFromConfig("http://localhost:3000");

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY manquante." }, { status: 500 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Non connecte." }, { status: 401 });

  const body = (await req.json()) as CheckoutBody;
  const packRaw = String(body.pack ?? "").trim();

  if (!isPackId(packRaw)) {
    return NextResponse.json({ error: "Pack invalide." }, { status: 400 });
  }

  const pack = PACKS[packRaw];
  if (pack.quote || !pack.price) {
    return NextResponse.json({ error: "Cette offre est sur devis." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, account_status")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }
  if (profile.account_status !== "active") {
    return NextResponse.json({ error: "Compte inactif." }, { status: 403 });
  }

  const stripe = new Stripe(secretKey);
  const origin = inferOrigin();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: profile.email || user.email || undefined,
    metadata: {
      user_id: user.id,
      plan: packRaw,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(pack.price * 100),
          product_data: {
            name: pack.name,
            description: "Paiement unique Athlete CV",
          },
        },
      },
    ],
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel?pack=${packRaw}`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Session Stripe invalide." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
