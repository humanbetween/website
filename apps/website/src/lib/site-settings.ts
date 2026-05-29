import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type PricingBanner = {
  active: boolean;
  text: string;
  originalCents: number | null;
  saleCents: number | null;
  endsAt: string | null;
};

const DEFAULT_BANNER: PricingBanner = {
  active: false,
  text: "Founding members sale",
  originalCents: null,
  saleCents: null,
  endsAt: null,
};

export type PricingPlans = {
  yearlyCents: number;
  lifetimeCents: number;
  yearlyOriginalCents: number | null;
  lifetimeOriginalCents: number | null;
};

const DEFAULT_PLANS: PricingPlans = {
  yearlyCents: 14900,
  lifetimeCents: 19900,
  yearlyOriginalCents: null,
  lifetimeOriginalCents: null,
};

async function getRaw<T>(key: string, fallback: T): Promise<T> {
  try {
    const rows = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, key))
      .limit(1);
    const value = rows[0]?.value;
    if (value === undefined || value === null) return fallback;
    return { ...fallback, ...(value as T) };
  } catch {
    return fallback;
  }
}

export const getPricingBanner = cache(async (): Promise<PricingBanner> => {
  return getRaw<PricingBanner>("pricing_banner", DEFAULT_BANNER);
});

export const getPricingPlans = cache(async (): Promise<PricingPlans> => {
  return getRaw<PricingPlans>("pricing_plans", DEFAULT_PLANS);
});

export async function setSiteSetting<T>(key: string, value: T) {
  await db
    .insert(schema.siteSettings)
    .values({ key, value: value as unknown as Record<string, unknown> })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: { value: value as unknown as Record<string, unknown>, updatedAt: new Date() },
    });
}
