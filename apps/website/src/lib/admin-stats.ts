import { and, count, desc, eq, gte, inArray, isNull, sum } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const since = (days: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
};

export type Range = 7 | 30 | 90;

export async function fetchOverviewKpis() {
  const [rev, active, customers, prompts] = await Promise.all([
    db
      .select({ total: sum(schema.purchases.amountCents) })
      .from(schema.purchases),
    db
      .select({ count: count() })
      .from(schema.profiles)
      .where(eq(schema.profiles.subscriptionStatus, "active")),
    db.select({ count: count() }).from(schema.users),
    db
      .select({ count: count() })
      .from(schema.prompts)
      .where(isNull(schema.prompts.deletedAt)),
  ]);

  return {
    revenueCents: Number(rev[0]?.total ?? 0),
    activeSubscribers: Number(active[0]?.count ?? 0),
    totalCustomers: Number(customers[0]?.count ?? 0),
    totalPrompts: Number(prompts[0]?.count ?? 0),
  };
}

export async function fetchRecentPurchases(limit = 5) {
  return db
    .select({
      id: schema.purchases.id,
      amountCents: schema.purchases.amountCents,
      type: schema.purchases.type,
      createdAt: schema.purchases.createdAt,
      userEmail: schema.users.email,
      userName: schema.users.name,
      promptId: schema.purchases.promptId,
      promptTitle: schema.prompts.title,
    })
    .from(schema.purchases)
    .leftJoin(schema.users, eq(schema.purchases.userId, schema.users.id))
    .leftJoin(schema.prompts, eq(schema.purchases.promptId, schema.prompts.id))
    .orderBy(desc(schema.purchases.createdAt))
    .limit(limit);
}

export async function fetchRecentSignups(limit = 5) {
  return db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(limit);
}

export async function fetchOrdersKpis() {
  const [total, rev, oneTime, subs] = await Promise.all([
    db.select({ count: count() }).from(schema.purchases),
    db
      .select({ total: sum(schema.purchases.amountCents) })
      .from(schema.purchases),
    db
      .select({ count: count() })
      .from(schema.purchases)
      .where(eq(schema.purchases.type, "one_time")),
    db
      .select({ count: count() })
      .from(schema.purchases)
      .where(eq(schema.purchases.type, "subscription_renewal")),
  ]);

  return {
    total: Number(total[0]?.count ?? 0),
    revenueCents: Number(rev[0]?.total ?? 0),
    oneTime: Number(oneTime[0]?.count ?? 0),
    subscriptions: Number(subs[0]?.count ?? 0),
  };
}

export async function fetchOrders({
  range = 30,
  search,
}: {
  range?: Range;
  search?: string | null;
}) {
  const wheres = [gte(schema.purchases.createdAt, since(range))];
  if (search) {
    // Postgres ILIKE on email or prompt title
    // We rely on the LEFT JOINs being already applied via the query builder below.
  }

  const rows = await db
    .select({
      id: schema.purchases.id,
      amountCents: schema.purchases.amountCents,
      type: schema.purchases.type,
      createdAt: schema.purchases.createdAt,
      userEmail: schema.users.email,
      userName: schema.users.name,
      promptTitle: schema.prompts.title,
    })
    .from(schema.purchases)
    .leftJoin(schema.users, eq(schema.purchases.userId, schema.users.id))
    .leftJoin(schema.prompts, eq(schema.purchases.promptId, schema.prompts.id))
    .where(and(...wheres))
    .orderBy(desc(schema.purchases.createdAt))
    .limit(200);

  if (!search) return rows;
  const term = search.toLowerCase();
  return rows.filter(
    (r) =>
      r.userEmail?.toLowerCase().includes(term) ||
      r.userName?.toLowerCase().includes(term) ||
      r.promptTitle?.toLowerCase().includes(term),
  );
}

export async function fetchCustomersKpis() {
  const [total, active, rev] = await Promise.all([
    db.select({ count: count() }).from(schema.users),
    db
      .select({ count: count() })
      .from(schema.profiles)
      .where(eq(schema.profiles.subscriptionStatus, "active")),
    db
      .select({ total: sum(schema.purchases.amountCents) })
      .from(schema.purchases),
  ]);

  const totalCustomers = Number(total[0]?.count ?? 0);
  const revenueCents = Number(rev[0]?.total ?? 0);
  const avgOrderCents =
    totalCustomers > 0 ? Math.round(revenueCents / totalCustomers) : 0;

  return {
    totalCustomers,
    activeSubscribers: Number(active[0]?.count ?? 0),
    revenueCents,
    avgOrderCents,
  };
}

export async function fetchCustomers(search?: string | null) {
  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      createdAt: schema.users.createdAt,
      subscriptionTier: schema.profiles.subscriptionTier,
      subscriptionStatus: schema.profiles.subscriptionStatus,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .orderBy(desc(schema.users.createdAt))
    .limit(500);

  const filtered = search
    ? rows.filter(
        (r) =>
          r.email.toLowerCase().includes(search.toLowerCase()) ||
          r.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : rows;

  if (filtered.length === 0) return [];

  const userIds = filtered.map((r) => r.id);
  const purchases = await db
    .select({
      userId: schema.purchases.userId,
      amountCents: schema.purchases.amountCents,
      createdAt: schema.purchases.createdAt,
    })
    .from(schema.purchases)
    .where(inArray(schema.purchases.userId, userIds));

  const byUser = new Map<
    string,
    { count: number; totalCents: number; lastAt: Date | null }
  >();
  for (const p of purchases) {
    const cur = byUser.get(p.userId) ?? {
      count: 0,
      totalCents: 0,
      lastAt: null as Date | null,
    };
    cur.count += 1;
    cur.totalCents += p.amountCents;
    if (!cur.lastAt || p.createdAt > cur.lastAt) cur.lastAt = p.createdAt;
    byUser.set(p.userId, cur);
  }

  return filtered.map((r) => ({
    ...r,
    ordersCount: byUser.get(r.id)?.count ?? 0,
    spentCents: byUser.get(r.id)?.totalCents ?? 0,
    lastOrderAt: byUser.get(r.id)?.lastAt ?? null,
  }));
}

export async function fetchAnalyticsKpis() {
  const [views, conv, rev, prompts] = await Promise.all([
    db
      .select({ total: sum(schema.prompts.popularityCount) })
      .from(schema.prompts)
      .where(isNull(schema.prompts.deletedAt)),
    db.select({ count: count() }).from(schema.purchases),
    db
      .select({ total: sum(schema.purchases.amountCents) })
      .from(schema.purchases),
    db
      .select({ count: count() })
      .from(schema.prompts)
      .where(isNull(schema.prompts.deletedAt)),
  ]);

  const totalViews = Number(views[0]?.total ?? 0);
  const conversions = Number(conv[0]?.count ?? 0);
  const revenueCents = Number(rev[0]?.total ?? 0);
  const totalPrompts = Number(prompts[0]?.count ?? 0);
  const conversionPct =
    totalViews > 0 ? Math.round((conversions / totalViews) * 1000) / 10 : 0;
  const avgOrderCents =
    conversions > 0 ? Math.round(revenueCents / conversions) : 0;

  return {
    totalViews,
    conversions,
    conversionPct,
    avgOrderCents,
    totalPrompts,
  };
}

export async function fetchTopPrompts(limit = 10) {
  return db
    .select({
      id: schema.prompts.id,
      title: schema.prompts.title,
      videoUrl: schema.prompts.videoUrl,
      categories: schema.prompts.categories,
      popularityCount: schema.prompts.popularityCount,
      priceCents: schema.prompts.priceCents,
      isFree: schema.prompts.isFree,
    })
    .from(schema.prompts)
    .where(isNull(schema.prompts.deletedAt))
    .orderBy(desc(schema.prompts.popularityCount))
    .limit(limit);
}
