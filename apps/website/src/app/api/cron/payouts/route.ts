import { NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  claimCommissions,
  getMaturePayableCommissions,
  recordPayout,
  revertCommissions,
  setCommissionsPayoutId,
} from "@/lib/affiliate";
import { getAffiliateSettings } from "@/lib/site-settings";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily auto-payout: transfer matured, payable commissions to creators' Stripe
// Connect accounts. Triggered by Vercel Cron (see vercel.json), gated by
// CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { minPayoutCents } = await getAffiliateSettings();
  const rows = await getMaturePayableCommissions();

  // Group matured commissions by creator.
  const byCreator = new Map<
    string,
    { connectAccountId: string; ids: string[]; cents: number }
  >();
  for (const r of rows) {
    if (!r.connectAccountId) continue;
    const g = byCreator.get(r.affiliateUserId) ?? {
      connectAccountId: r.connectAccountId,
      ids: [],
      cents: 0,
    };
    g.ids.push(r.commissionId);
    g.cents += r.commissionCents;
    byCreator.set(r.affiliateUserId, g);
  }

  const results: Array<Record<string, unknown>> = [];

  for (const [userId, g] of byCreator) {
    if (g.cents < minPayoutCents) {
      results.push({ userId, skipped: "below_min", cents: g.cents });
      continue;
    }

    // Claim first: payable → paid. Only rows still payable flip.
    const claimed = await claimCommissions(g.ids);
    const claimedIds = claimed.map((c) => c.id);
    const amount = claimed.reduce((s, c) => s + c.commissionCents, 0);
    if (amount <= 0) continue;

    const idemKey = `po_${userId}_${createHash("sha256")
      .update([...claimedIds].sort().join(","))
      .digest("hex")
      .slice(0, 40)}`;

    try {
      const transfer = await stripe.transfers.create(
        {
          amount,
          currency: "usd",
          destination: g.connectAccountId,
          metadata: { userId },
        },
        { idempotencyKey: idemKey },
      );
      const payoutId = await recordPayout({
        affiliateUserId: userId,
        stripeTransferId: transfer.id,
        amountCents: amount,
        status: "paid",
      });
      if (payoutId) await setCommissionsPayoutId(claimedIds, payoutId);
      results.push({ userId, amount, transferId: transfer.id });
    } catch (err) {
      console.error(`payout failed for ${userId}`, err);
      // Release the claim so the next run retries.
      await revertCommissions(claimedIds);
      await recordPayout({
        affiliateUserId: userId,
        stripeTransferId: null,
        amountCents: amount,
        status: "failed",
      }).catch(() => {});
      results.push({ userId, amount, error: true });
    }
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}
