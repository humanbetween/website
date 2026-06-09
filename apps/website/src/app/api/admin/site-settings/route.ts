import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { setSiteSetting } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const bannerSchema = z.object({
  key: z.literal("pricing_banner"),
  value: z.object({
    active: z.boolean(),
    text: z.string().max(200),
    originalCents: z.number().int().min(0).max(1_000_000).nullable(),
    saleCents: z.number().int().min(0).max(1_000_000).nullable(),
    endsAt: z.string().nullable(),
  }),
});

const plansSchema = z.object({
  key: z.literal("pricing_plans"),
  value: z.object({
    monthlyCents: z.number().int().min(0).max(1_000_000),
    yearlyCents: z.number().int().min(0).max(1_000_000),
    monthlyOriginalCents: z.number().int().min(0).max(1_000_000).nullable(),
    yearlyOriginalCents: z.number().int().min(0).max(1_000_000).nullable(),
    monthlyDescription: z.string().max(280),
    yearlyDescription: z.string().max(280),
  }),
});

const promoSchema = z.object({
  key: z.literal("promo_card"),
  value: z.object({
    active: z.boolean(),
    title: z.string().max(120),
    description: z.string().max(400),
    imageUrl: z.string().max(500),
    ctaLabel: z.string().max(40),
    ctaUrl: z.string().max(500),
    position: z.number().int().min(0).max(200),
  }),
});

const heroSchema = z.object({
  key: z.literal("hero_content"),
  value: z.object({
    titleLine1: z.string().min(1).max(80),
    titleLine2: z.string().min(1).max(80),
    subtitle: z.string().min(1).max(280),
  }),
});

const socialSchema = z.object({
  key: z.literal("social_links"),
  value: z.object({
    x: z.string().max(500),
    instagram: z.string().max(500),
    youtube: z.string().max(500),
    tiktok: z.string().max(500),
    linkedin: z.string().max(500),
  }),
});

const homeCtaSchema = z.object({
  key: z.literal("home_cta_banner"),
  value: z.object({
    active: z.boolean(),
    eyebrow: z.string().max(80),
    title: z.string().min(1).max(160),
    description: z.string().max(500),
    ctaLabel: z.string().min(1).max(40),
    ctaUrl: z.string().max(500),
    imageUrl: z.string().max(500),
    videoUrl: z.string().max(500),
    newsletterMode: z.boolean(),
  }),
});

const headerCtaSchema = z.object({
  key: z.literal("header_cta"),
  value: z.object({
    label: z.string().max(40),
    url: z.string().max(500),
  }),
});

const affiliateSchema = z.object({
  key: z.literal("affiliate_settings"),
  value: z.object({
    rateBps: z.number().int().min(0).max(10000),
    capWindowDays: z.number().int().min(0).max(3650),
    cookieDays: z.number().int().min(1).max(365),
  }),
});

const bodySchema = z.discriminatedUnion("key", [
  bannerSchema,
  plansSchema,
  promoSchema,
  heroSchema,
  socialSchema,
  homeCtaSchema,
  headerCtaSchema,
  affiliateSchema,
]);

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    await setSiteSetting(parsed.data.key, parsed.data.value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("setSiteSetting failed", err);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
