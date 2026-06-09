import "server-only";
import { randomBytes } from "crypto";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type AffiliateAccount = {
  userId: string;
  code: string;
  status: string;
  commissionRateBps: number;
  avatarUrl: string | null;
};

export function commissionFor(saleCents: number, rateBps: number): number {
  return Math.max(0, Math.round((saleCents * rateBps) / 10000));
}

export function isSelfReferral(
  buyerUserId: string | null,
  affiliateUserId: string | null,
): boolean {
  return !!buyerUserId && !!affiliateUserId && buyerUserId === affiliateUserId;
}

/** Slug of the name plus a short random suffix. Uniqueness is enforced by the
 * unique index; the caller retries on collision. */
export function generateAffiliateCode(name: string | null): string {
  const slug = (name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  const suffix = randomBytes(3).toString("hex"); // 6 hex chars
  return slug ? `${slug}-${suffix}` : suffix;
}

export async function resolveAffiliate(
  userId: string,
): Promise<AffiliateAccount | null> {
  const rows = await db
    .select({
      userId: schema.affiliateAccounts.userId,
      code: schema.affiliateAccounts.code,
      status: schema.affiliateAccounts.status,
      commissionRateBps: schema.affiliateAccounts.commissionRateBps,
      avatarUrl: schema.affiliateAccounts.avatarUrl,
    })
    .from(schema.affiliateAccounts)
    .where(eq(schema.affiliateAccounts.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function resolveAffiliateByCode(
  code: string,
): Promise<AffiliateAccount | null> {
  const rows = await db
    .select({
      userId: schema.affiliateAccounts.userId,
      code: schema.affiliateAccounts.code,
      status: schema.affiliateAccounts.status,
      commissionRateBps: schema.affiliateAccounts.commissionRateBps,
      avatarUrl: schema.affiliateAccounts.avatarUrl,
    })
    .from(schema.affiliateAccounts)
    .where(eq(schema.affiliateAccounts.code, code))
    .limit(1);
  return rows[0] ?? null;
}

/** First-touch attribution: only the first affiliate to refer a customer sticks. */
export async function upsertReferral(input: {
  affiliateUserId: string;
  code: string;
  referredUserId: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<void> {
  await db
    .insert(schema.referrals)
    .values({
      affiliateUserId: input.affiliateUserId,
      code: input.code,
      referredUserId: input.referredUserId,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    })
    .onConflictDoNothing();
}

export async function findReferralBySubscription(subscriptionId: string) {
  const rows = await db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.stripeSubscriptionId, subscriptionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findReferralByUser(referredUserId: string) {
  const rows = await db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.referredUserId, referredUserId))
    .limit(1);
  return rows[0] ?? null;
}

/** One-time purchase: a single commission, idempotent on the payment intent id. */
export async function recordOneTimeCommission(input: {
  affiliateUserId: string;
  referralId: string | null;
  paymentIntentId: string;
  saleAmountCents: number;
  rateBps: number;
}): Promise<void> {
  await db
    .insert(schema.commissions)
    .values({
      affiliateUserId: input.affiliateUserId,
      referralId: input.referralId,
      sourceType: "one_time",
      stripeChargeKey: input.paymentIntentId,
      stripeSubscriptionId: null,
      saleAmountCents: input.saleAmountCents,
      commissionCents: commissionFor(input.saleAmountCents, input.rateBps),
    })
    .onConflictDoNothing();
}

/** Subscription invoice: a commission per paid invoice, but only within the
 * cap window measured from when the referral was created. Idempotent on the
 * invoice id, so webhook retries never double-credit. */
export async function recordSubscriptionCommission(input: {
  affiliateUserId: string;
  referralId: string | null;
  referralCreatedAt: Date;
  subscriptionId: string;
  invoiceId: string;
  invoiceDate: Date;
  saleAmountCents: number;
  rateBps: number;
  capWindowDays: number;
}): Promise<void> {
  const windowEnd =
    input.referralCreatedAt.getTime() +
    input.capWindowDays * 24 * 60 * 60 * 1000;
  if (input.invoiceDate.getTime() > windowEnd) return; // outside the paid window

  await db
    .insert(schema.commissions)
    .values({
      affiliateUserId: input.affiliateUserId,
      referralId: input.referralId,
      sourceType: "subscription",
      stripeChargeKey: input.invoiceId,
      stripeSubscriptionId: input.subscriptionId,
      saleAmountCents: input.saleAmountCents,
      commissionCents: commissionFor(input.saleAmountCents, input.rateBps),
    })
    .onConflictDoNothing();
}

/* -------------------------------------------------------------------------- */
/*  Dashboard aggregates                                                      */
/* -------------------------------------------------------------------------- */

function startOfMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type CreatorStats = {
  referredCustomers: number;
  activeSubscriptions: number;
  payableBalanceCents: number;
  earnedThisMonthCents: number;
  lifetimeEarnedCents: number;
};

export async function getCreatorStats(userId: string): Promise<CreatorStats> {
  const [referredCustomers, activeSubs, payable, thisMonth, lifetime] =
    await Promise.all([
      db
        .select({ n: sql<number>`count(distinct ${schema.referrals.referredUserId})` })
        .from(schema.referrals)
        .where(eq(schema.referrals.affiliateUserId, userId)),
      db
        .select({ n: sql<number>`count(distinct ${schema.referrals.referredUserId})` })
        .from(schema.referrals)
        .innerJoin(
          schema.profiles,
          eq(schema.profiles.userId, schema.referrals.referredUserId),
        )
        .where(
          and(
            eq(schema.referrals.affiliateUserId, userId),
            eq(schema.profiles.subscriptionStatus, "active"),
          ),
        ),
      db
        .select({ c: sql<number>`coalesce(sum(${schema.commissions.commissionCents}), 0)` })
        .from(schema.commissions)
        .where(
          and(
            eq(schema.commissions.affiliateUserId, userId),
            eq(schema.commissions.status, "payable"),
          ),
        ),
      db
        .select({ c: sql<number>`coalesce(sum(${schema.commissions.commissionCents}), 0)` })
        .from(schema.commissions)
        .where(
          and(
            eq(schema.commissions.affiliateUserId, userId),
            gte(schema.commissions.createdAt, startOfMonthUTC()),
          ),
        ),
      db
        .select({ c: sql<number>`coalesce(sum(${schema.commissions.commissionCents}), 0)` })
        .from(schema.commissions)
        .where(eq(schema.commissions.affiliateUserId, userId)),
    ]);

  return {
    referredCustomers: Number(referredCustomers[0]?.n ?? 0),
    activeSubscriptions: Number(activeSubs[0]?.n ?? 0),
    payableBalanceCents: Number(payable[0]?.c ?? 0),
    earnedThisMonthCents: Number(thisMonth[0]?.c ?? 0),
    lifetimeEarnedCents: Number(lifetime[0]?.c ?? 0),
  };
}

export type ReferredCustomerRow = {
  email: string | null;
  tier: string;
  status: string;
  referredAt: Date;
  commissionCents: number;
};

export async function getReferredCustomers(
  userId: string,
  limit = 50,
): Promise<ReferredCustomerRow[]> {
  const refs = await db
    .select({
      id: schema.referrals.id,
      referredUserId: schema.referrals.referredUserId,
      createdAt: schema.referrals.createdAt,
      email: schema.users.email,
      tier: schema.profiles.subscriptionTier,
      status: schema.profiles.subscriptionStatus,
    })
    .from(schema.referrals)
    .leftJoin(schema.users, eq(schema.users.id, schema.referrals.referredUserId))
    .leftJoin(
      schema.profiles,
      eq(schema.profiles.userId, schema.referrals.referredUserId),
    )
    .where(eq(schema.referrals.affiliateUserId, userId))
    .orderBy(desc(schema.referrals.createdAt))
    .limit(limit);

  if (refs.length === 0) return [];

  const referralIds = refs.map((r) => r.id);
  const sums = await db
    .select({
      referralId: schema.commissions.referralId,
      total: sql<number>`coalesce(sum(${schema.commissions.commissionCents}), 0)`,
    })
    .from(schema.commissions)
    .where(inArray(schema.commissions.referralId, referralIds))
    .groupBy(schema.commissions.referralId);
  const byReferral = new Map(sums.map((s) => [s.referralId, Number(s.total)]));

  return refs.map((r) => ({
    email: r.email,
    tier: r.tier ?? "free",
    status: r.status ?? "inactive",
    referredAt: r.createdAt,
    commissionCents: byReferral.get(r.id) ?? 0,
  }));
}

export type AdminAffiliateRow = {
  userId: string;
  name: string | null;
  email: string | null;
  code: string;
  status: string;
  commissionRateBps: number;
  referredCustomers: number;
  payableCents: number;
  lifetimeCents: number;
  createdAt: Date;
};

export async function getAdminAffiliates(): Promise<AdminAffiliateRow[]> {
  const [accounts, refCounts, payable, lifetime] = await Promise.all([
    db
      .select({
        userId: schema.affiliateAccounts.userId,
        code: schema.affiliateAccounts.code,
        status: schema.affiliateAccounts.status,
        commissionRateBps: schema.affiliateAccounts.commissionRateBps,
        createdAt: schema.affiliateAccounts.createdAt,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.affiliateAccounts)
      .leftJoin(
        schema.users,
        eq(schema.users.id, schema.affiliateAccounts.userId),
      )
      .orderBy(desc(schema.affiliateAccounts.createdAt)),
    db
      .select({
        affiliateUserId: schema.referrals.affiliateUserId,
        n: sql<number>`count(distinct ${schema.referrals.referredUserId})`,
      })
      .from(schema.referrals)
      .groupBy(schema.referrals.affiliateUserId),
    db
      .select({
        affiliateUserId: schema.commissions.affiliateUserId,
        c: sql<number>`coalesce(sum(${schema.commissions.commissionCents}), 0)`,
      })
      .from(schema.commissions)
      .where(eq(schema.commissions.status, "payable"))
      .groupBy(schema.commissions.affiliateUserId),
    db
      .select({
        affiliateUserId: schema.commissions.affiliateUserId,
        c: sql<number>`coalesce(sum(${schema.commissions.commissionCents}), 0)`,
      })
      .from(schema.commissions)
      .groupBy(schema.commissions.affiliateUserId),
  ]);

  const refMap = new Map(refCounts.map((r) => [r.affiliateUserId, Number(r.n)]));
  const payMap = new Map(payable.map((r) => [r.affiliateUserId, Number(r.c)]));
  const lifeMap = new Map(lifetime.map((r) => [r.affiliateUserId, Number(r.c)]));

  return accounts.map((a) => ({
    userId: a.userId,
    name: a.name,
    email: a.email,
    code: a.code,
    status: a.status,
    commissionRateBps: a.commissionRateBps,
    referredCustomers: refMap.get(a.userId) ?? 0,
    payableCents: payMap.get(a.userId) ?? 0,
    lifetimeCents: lifeMap.get(a.userId) ?? 0,
    createdAt: a.createdAt,
  }));
}
