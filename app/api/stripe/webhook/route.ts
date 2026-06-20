import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import { isPackId } from "@/utils/packs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook non configure." }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;

    if (!userId || !plan || !isPackId(plan)) {
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();

    const { error: profileError } = await admin
      .from("profiles")
      .update({ plan })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: "Mise a jour profil impossible." }, { status: 500 });
    }

    const { error: subError } = await admin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          status: "active",
          plan,
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
        },
        { onConflict: "user_id" },
      );

    if (subError) {
      return NextResponse.json({ error: "Mise a jour subscription impossible." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
