import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { PromptGrid } from "@/components/prompts/PromptGrid";
import { PricingBanner } from "@/components/site/PricingBanner";
import { HomeCtaBanner } from "@/components/site/HomeCtaBanner";
import { getCurrentAccess } from "@/lib/access";
import { getFavoritePromptIds } from "@/lib/favorites";
import { getActiveCategoryKeys, resolvePromptRef } from "@/lib/prompts/queries";
import {
  getPricingBanner,
  getPromoCard,
  getHeroContent,
  getHomeCtaBanner,
} from "@/lib/site-settings";

export const dynamic = "force-dynamic";

// A shared link is /?prompt=<slug> — give it a per-prompt preview (title +
// thumbnail) instead of the generic site card.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string | string[] }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const ref = typeof sp.prompt === "string" ? sp.prompt : null;
  if (!ref) return {};
  const prompt = await resolvePromptRef(ref).catch(() => null);
  if (!prompt || !prompt.isPublished) return {};

  const isImg = /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(prompt.videoUrl);
  const image =
    prompt.thumbnailUrl ??
    (isImg ? prompt.videoUrl : null) ??
    prompt.referenceImageUrl ??
    undefined;
  const title = `${prompt.title} — Human Prompts`;
  const description =
    prompt.description || "A premium AI prompt from Human Prompts.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function HomePage() {
  // Settle independently so one failing query doesn't take down the whole page.
  const settled = await Promise.allSettled([
    getPricingBanner(),
    getPromoCard(),
    getHeroContent(),
    getCurrentAccess(),
    getHomeCtaBanner(),
    getActiveCategoryKeys(),
  ]);
  const [
    bannerRes,
    promoRes,
    heroRes,
    accessRes,
    ctaBannerRes,
    activeCategoryKeysRes,
  ] = settled;
  const banner =
    bannerRes.status === "fulfilled" ? bannerRes.value : await getPricingBanner();
  const promo =
    promoRes.status === "fulfilled" ? promoRes.value : await getPromoCard();
  const hero =
    heroRes.status === "fulfilled" ? heroRes.value : await getHeroContent();
  const access =
    accessRes.status === "fulfilled"
      ? accessRes.value
      : { userId: null, hasUnlimited: false };
  const ctaBanner =
    ctaBannerRes.status === "fulfilled"
      ? ctaBannerRes.value
      : await getHomeCtaBanner();
  const activeCategoryKeys =
    activeCategoryKeysRes.status === "fulfilled"
      ? activeCategoryKeysRes.value
      : [];

  const favoriteIds = access.userId
    ? await getFavoritePromptIds(access.userId).catch(() => [])
    : [];

  return (
    <>
      <PricingBanner banner={banner} />

      <div className="relative">
        {/* Subtle grid background — goes deep into the page before fading */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[2200px] overflow-hidden bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black_0%,black_80%,transparent_100%)]"
        />

        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-gradient-to-b from-sky-400/15 via-sky-400/5 to-transparent"
          />
          <div className="relative container mx-auto max-w-4xl px-6 pt-16 md:pt-24 pb-12 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl leading-[1.05] text-balance font-bold">
              <span className="uppercase">{hero.titleLine1}</span>
              <br />
              <span className="font-medium">{hero.titleLine2}</span>
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-base text-muted-foreground text-balance">
              {hero.subtitle}
            </p>
            <div className="mt-7 flex items-center justify-center gap-3">
              <Link
                href="/pricing"
                className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors inline-flex items-center gap-2"
              >
                Go unlimited <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#library"
                className="px-5 py-2.5 rounded-full glass text-sm font-medium hover:bg-card/80 transition-colors"
              >
                Browse library
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Suspense fallback={<div className="h-14" />}>
        <PromptFilters activeCategoryKeys={activeCategoryKeys} />
      </Suspense>

      <section
        id="library"
        className="container mx-auto max-w-[1440px] px-6 pt-6 pb-12"
      >
        <Suspense fallback={null}>
          <PromptGrid
            promo={promo}
            hasUnlimited={access.hasUnlimited}
            favoriteIds={favoriteIds}
            isSignedIn={!!access.userId}
          />
        </Suspense>
      </section>

      <HomeCtaBanner banner={ctaBanner} />
    </>
  );
}
