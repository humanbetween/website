import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { appUrl, stripe, stripeConfig } from "@/lib/stripe";

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
  let userId = session.metadata?.userId || null;
  const fromAnonymous = !userId;

  if (!userId) {
    const email = session.customer_details?.email ?? session.customer_email;
    if (!email) {
      console.error("checkout.session.completed: no userId and no email");
      return;
    }
    userId = await findOrCreateUserByEmail(
      email,
      session.customer_details?.name ?? null,
    );
  }

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
  } else if (session.mode === "payment") {
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
    } else if (promptId) {
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

  if (fromAnonymous) {
    const email = session.customer_details?.email ?? session.customer_email;
    if (email) {
      try {
        await auth.api.signInMagicLink({
          body: {
            email,
            callbackURL: appUrl("/account?welcome=1"),
          },
          headers: new Headers(),
        });
      } catch (err) {
        console.error("magic link send failed for", email, err);
      }
    }
  }
}

async function findOrCreateUserByEmail(
  email: string,
  name: string | null,
): Promise<string> {
  const existing = (
    await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
  )[0];
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  await db.insert(schema.users).values({
    id,
    email,
    emailVerified: true,
    name,
  });
  await db
    .insert(schema.profiles)
    .values({ userId: id })
    .onConflictDoNothing();
  return id;
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
