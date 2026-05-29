import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { appUrl, stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = (
    await db
      .select({ id: schema.profiles.stripeCustomerId })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, session.user.id))
      .limit(1)
  )[0]?.id;

  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: appUrl("/account"),
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("portal failed", err);
    return NextResponse.json({ error: "Portal failed" }, { status: 500 });
  }
}
