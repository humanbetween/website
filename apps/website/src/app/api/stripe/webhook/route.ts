import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import type Stripe from "stripe";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { sendWelcomeCustomerEmail } from "@/lib/resend";
import { appUrl, stripe, stripeConfig } from "@/lib/stripe";
import { getAffiliateSettings } from "@/lib/site-settings";
import {
  findReferralByUser,
  isSelfReferral,
  recordOneTimeCommission,
  recordSubscriptionCommission,
  resolveAffiliate,
  upsertReferral,
} from "@/lib/affiliate";

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

  const refCode = session.metadata?.ref || null;
  const refAffiliateUserId = session.metadata?.refAffiliateUserId || null;
  const hasRef =
    !!refCode &&
    !!refAffiliateUserId &&
    !isSelfReferral(userId, refAffiliateUserId);

  if (session.mode === "subscription" && session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    const tier =
      session.metadata?.tier === "monthly" ? "monthly" : "yearly";

    if (hasRef) {
      // First-touch referral; the first paid invoice creates the commission.
      await upsertReferral({
        affiliateUserId: refAffiliateUserId!,
        code: refCode!,
        referredUserId: userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: sub.id,
      }).catch((err) => console.error("upsertReferral (subscription) failed", err));
    }
    await db
      .update(schema.profiles)
      .set({
        subscriptionTier: tier,
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

    // Atomically claim the welcome email so retries / invoice events can't
    // double-send: only the update that flips a null timestamp wins.
    const claimed = await db
      .update(schema.profiles)
      .set({ welcomeEmailSentAt: new Date() })
      .where(
        and(
          eq(schema.profiles.userId, userId),
          isNull(schema.profiles.welcomeEmailSentAt),
        ),
      )
      .returning({ userId: schema.profiles.userId });
    const welcomeEmail =
      session.customer_details?.email ?? session.customer_email;
    if (claimed.length > 0 && welcomeEmail) {
      await sendWelcomeCustomerEmail({ to: welcomeEmail, tier }).catch((err) =>
        console.error("welcome customer email failed", err),
      );
    }
  } else if (session.mode === "payment") {
    const promptId = session.metadata?.promptId ?? null;
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

    if (hasRef && session.payment_intent) {
      await upsertReferral({
        affiliateUserId: refAffiliateUserId!,
        code: refCode!,
        referredUserId: userId,
        stripeCustomerId: session.customer as string,
      }).catch((err) => console.error("upsertReferral (one_time) failed", err));
      // Honor first-touch: credit whoever owns the referral row, not just the
      // cookie. recordOneTimeCommission is idempotent on the payment intent.
      const referral = await findReferralByUser(userId);
      if (referral && !isSelfReferral(userId, referral.affiliateUserId)) {
        const rateBps = await rateForAffiliate(referral.affiliateUserId);
        await recordOneTimeCommission({
          affiliateUserId: referral.affiliateUserId,
          referralId: referral.id,
          paymentIntentId: session.payment_intent as string,
          saleAmountCents: session.amount_total ?? 0,
          rateBps,
        }).catch((err) => console.error("recordOneTimeCommission failed", err));
      }
    }
  }

  const checkoutEmail = session.customer_details?.email ?? session.customer_email;

  if (session.consent?.promotions === "opt_in" && checkoutEmail) {
    try {
      await subscribeToNewsletter({ email: checkoutEmail, source: "checkout" });
    } catch (err) {
      console.error("newsletter opt-in from checkout failed", err);
    }
  }

  if (fromAnonymous && checkoutEmail) {
    try {
      await auth.api.signInMagicLink({
        body: {
          email: checkoutEmail,
          callbackURL: appUrl("/account?welcome=1"),
        },
        headers: new Headers(),
      });
    } catch (err) {
      console.error("magic link send failed for", checkoutEmail, err);
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
  // Stripe SDK v22 moved the subscription id + its metadata snapshot under
  // invoice.parent.subscription_details (the old invoice.subscription is gone).
  const details = (
    invoice as unknown as {
      parent?: {
        subscription_details?: {
          subscription?: string | { id: string };
          metadata?: Record<string, string> | null;
        };
      };
    }
  ).parent?.subscription_details;
  const rawSub = details?.subscription;
  const subId =
    typeof rawSub === "string" ? rawSub : rawSub?.id ?? null;
  if (!subId) return;

  const customerId = invoice.customer as string;
  const userId = await userIdFromCustomer(customerId);
  if (!userId) return;

  const billingReason =
    (invoice as unknown as { billing_reason?: string | null }).billing_reason ??
    null;
  // Cycle 1's purchase is already recorded by the checkout handler; only record
  // renewals here. (This restores renewal recording — the old code read the
  // removed invoice.subscription field and bailed, so renewals were lost.)
  if (billingReason !== "subscription_create") {
    await db.insert(schema.purchases).values({
      userId,
      promptId: null,
      stripeSubscriptionId: subId,
      type: "subscription_renewal",
      amountCents: invoice.amount_paid ?? 0,
    });
  }

  // Affiliate commission: invoices drive subscription commissions (cycle 1 +
  // renewals), idempotent on the invoice id and capped to the referral window.
  if (!invoice.id) return;
  const metaRef = details?.metadata?.ref || null;
  const metaAffiliate = details?.metadata?.refAffiliateUserId || null;
  if (metaRef && metaAffiliate && !isSelfReferral(userId, metaAffiliate)) {
    // Survive event ordering: create the referral if checkout.session.completed
    // hasn't landed yet.
    await upsertReferral({
      affiliateUserId: metaAffiliate,
      code: metaRef,
      referredUserId: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subId,
    }).catch((err) => console.error("upsertReferral (invoice) failed", err));
  }

  const referral = await findReferralByUser(userId);
  if (!referral || isSelfReferral(userId, referral.affiliateUserId)) return;
  const rateBps = await rateForAffiliate(referral.affiliateUserId);
  const { capWindowDays } = await getAffiliateSettings();
  const invoiceDate = new Date((invoice.created ?? Date.now() / 1000) * 1000);
  await recordSubscriptionCommission({
    affiliateUserId: referral.affiliateUserId,
    referralId: referral.id,
    referralCreatedAt: referral.createdAt,
    subscriptionId: subId,
    invoiceId: invoice.id,
    invoiceDate,
    saleAmountCents: invoice.amount_paid ?? 0,
    rateBps,
    capWindowDays,
  }).catch((err) => console.error("recordSubscriptionCommission failed", err));
}

async function rateForAffiliate(affiliateUserId: string): Promise<number> {
  const acct = await resolveAffiliate(affiliateUserId);
  if (acct) return acct.commissionRateBps;
  return (await getAffiliateSettings()).rateBps;
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
