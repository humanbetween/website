import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db, schema } from "@/lib/db";
import { stripe, stripeConfig } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  if (!stripeConfig.webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, stripeConfig.webhookSecret);
  } catch (err) {
    console.error("Stripe signature mismatch", err);
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object);
        break;
      default:
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`stripe webhook ${event.type} failed`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  if (session.mode === "subscription" && session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    await db
      .update(schema.profiles)
      .set({
        subscriptionTier: "yearly",
        subscriptionStatus: sub.status === "active" ? "active" : sub.status,
        stripeCustomerId: session.customer as string,
        subscriptionCurrentPeriodEnd: subPeriodEnd(sub),
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.userId, userId));
    await db.insert(schema.purchases).values({
      userId,
      promptId: null,
      stripeSubscriptionId: sub.id,
      type: "subscription_renewal",
      amountCents: session.amount_total ?? 0,
    });
    return;
  }

  if (session.mode === "payment") {
    const promptId = session.metadata?.promptId ?? null;
    const tier = session.metadata?.tier;
    if (tier === "lifetime") {
      await db
        .update(schema.profiles)
        .set({
          subscriptionTier: "lifetime",
          subscriptionStatus: "active",
          stripeCustomerId: session.customer as string,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.userId, userId));
      await db.insert(schema.purchases).values({
        userId,
        promptId: null,
        stripePaymentIntentId: session.payment_intent as string,
        type: "lifetime",
        amountCents: session.amount_total ?? 0,
      });
      return;
    }
    if (promptId) {
      await db
        .insert(schema.purchases)
        .values({
          userId,
          promptId,
          stripePaymentIntentId: session.payment_intent as string,
          type: "one_time",
          amountCents: session.amount_total ?? 0,
        })
        .onConflictDoNothing();
    }
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId ?? (await userIdFromCustomer(sub.customer as string));
  if (!userId) return;

  const status =
    sub.status === "active" || sub.status === "trialing"
      ? "active"
      : sub.status === "past_due"
        ? "past_due"
        : "cancelled";

  await db
    .update(schema.profiles)
    .set({
      subscriptionStatus: status,
      subscriptionCurrentPeriodEnd: subPeriodEnd(sub),
      updatedAt: new Date(),
    })
    .where(eq(schema.profiles.userId, userId));
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const sub = (invoice as unknown as { subscription?: string }).subscription;
  if (!sub) return;
  const customerId = invoice.customer as string;
  const userId = await userIdFromCustomer(customerId);
  if (!userId) return;
  await db.insert(schema.purchases).values({
    userId,
    promptId: null,
    stripeSubscriptionId: sub,
    type: "subscription_renewal",
    amountCents: invoice.amount_paid ?? 0,
  });
}

async function userIdFromCustomer(customerId: string): Promise<string | null> {
  const row = (
    await db
      .select({ userId: schema.profiles.userId })
      .from(schema.profiles)
      .where(eq(schema.profiles.stripeCustomerId, customerId))
      .limit(1)
  )[0];
  return row?.userId ?? null;
}

function subPeriodEnd(sub: Stripe.Subscription): Date | null {
  const value = (sub as unknown as { current_period_end?: number }).current_period_end;
  return typeof value === "number" ? new Date(value * 1000) : null;
}
