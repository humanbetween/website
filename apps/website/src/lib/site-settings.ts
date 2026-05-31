import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { DEFAULT_CATEGORIES, type PromptCategory } from "@/lib/prompts/types";

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

export type PromoCard = {
  active: boolean;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  /** Insert the card after this many items in the grid (0-indexed). */
  position: number;
};

const DEFAULT_PROMO: PromoCard = {
  active: false,
  title: "",
  description: "",
  imageUrl: "",
  ctaLabel: "Explore",
  ctaUrl: "",
  position: 8,
};

export type HeroContent = {
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
};

const DEFAULT_HERO: HeroContent = {
  titleLine1: "Premium AI prompts.",
  titleLine2: "Copy, paste, ship.",
  subtitle:
    "A growing library of curated prompts for video, image and websites. Built for creators who move fast.",
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

export const getPromoCard = cache(async (): Promise<PromoCard> => {
  return getRaw<PromoCard>("promo_card", DEFAULT_PROMO);
});

export const getHeroContent = cache(async (): Promise<HeroContent> => {
  return getRaw<HeroContent>("hero_content", DEFAULT_HERO);
});

/**
 * Returns the live prompt category list. Stored as `{ categories: [...] }`
 * under key `prompt_categories`. When the row is missing or malformed,
 * the default seed list is returned.
 */
export const getPromptCategories = cache(async (): Promise<PromptCategory[]> => {
  try {
    const rows = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "prompt_categories"))
      .limit(1);
    const value = rows[0]?.value as { categories?: PromptCategory[] } | undefined;
    if (value?.categories && Array.isArray(value.categories) && value.categories.length > 0) {
      return value.categories.filter(
        (c) => typeof c.key === "string" && typeof c.label === "string",
      );
    }
  } catch {
    /* fall through to default */
  }
  return [...DEFAULT_CATEGORIES];
});

export async function addPromptCategory(label: string): Promise<PromptCategory[]> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Label is required");
  const current = await getPromptCategoriesUncached();
  const key = labelToKey(trimmed, current.map((c) => c.key));
  if (current.some((c) => c.key === key)) {
    return current;
  }
  const next = [...current, { key, label: trimmed }];
  await setSiteSetting("prompt_categories", { categories: next });
  return next;
}

async function getPromptCategoriesUncached(): Promise<PromptCategory[]> {
  try {
    const rows = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "prompt_categories"))
      .limit(1);
    const value = rows[0]?.value as { categories?: PromptCategory[] } | undefined;
    if (value?.categories && Array.isArray(value.categories) && value.categories.length > 0) {
      return value.categories;
    }
  } catch {
    /* fall through */
  }
  return [...DEFAULT_CATEGORIES];
}

function labelToKey(label: string, existing: string[]): string {
  const base = label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  if (!base) return `CUSTOM_${Date.now()}`;
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

export async function setSiteSetting<T>(key: string, value: T) {
  await db
    .insert(schema.siteSettings)
    .values({ key, value: value as unknown as Record<string, unknown> })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: { value: value as unknown as Record<string, unknown>, updatedAt: new Date() },
    });
}
