import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { resolveActiveAffiliate } from "@/lib/affiliate";
import { db, schema } from "@/lib/db";
import { appUrl, stripe } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Start (or resume) Stripe Connect Express onboarding for a creator's payouts.
export async function POST(request: Request) {
  const limited = await rateLimit(request, "creator-connect", 10, 60_000);
  if (limited) return limited;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const affiliate = await resolveActiveAffiliate(session.user.id);
  if (!affiliate) {
    return NextResponse.json({ error: "Not a creator" }, { status: 403 });
  }

  try {
    let accountId = affiliate.stripeConnectAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: session.user.email ?? undefined,
        business_type: "individual",
        capabilities: { transfers: { requested: true } },
        metadata: { userId: session.user.id },
      });
      accountId = account.id;
      await db
        .update(schema.affiliateAccounts)
        .set({ stripeConnectAccountId: accountId, updatedAt: new Date() })
        .where(eq(schema.affiliateAccounts.userId, session.user.id));
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: appUrl("/creator?connect=refresh"),
      return_url: appUrl("/creator?connect=done"),
      type: "account_onboarding",
    });
    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.error("connect onboarding failed", err);
    return NextResponse.json(
      { error: "Could not start payout setup" },
      { status: 500 },
    );
  }
}
