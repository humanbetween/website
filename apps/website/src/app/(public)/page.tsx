import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { PromptGrid } from "@/components/prompts/PromptGrid";
import { PricingBanner } from "@/components/site/PricingBanner";
import { HomeCtaBanner } from "@/components/site/HomeCtaBanner";
import { getCurrentAccess } from "@/lib/access";
import { getFavoritePromptIds } from "@/lib/favorites";
import {
  getPricingBanner,
  getPromoCard,
  getHeroContent,
  getHomeCtaBanner,
} from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banner, promo, hero, access, ctaBanner] = await Promise.all([
    getPricingBanner(),
    getPromoCard(),
    getHeroContent(),
    getCurrentAccess(),
    getHomeCtaBanner(),
  ]);
  const favoriteIds = await getFavoritePromptIds(access.userId);

  return (
    <>
      <PricingBanner banner={banner} />

      <div className="relative">
        {/* Background: subtle grid + extended gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[1100px] overflow-hidden"
        >
          {/* Soft elliptical gradient from top */}
          <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(56,189,248,0.22),rgba(34,211,238,0.10)_35%,rgba(52,211,153,0.06)_55%,transparent_80%)]" />
          {/* Subtle grid at ~10% opacity, fades out with the gradient */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black_0%,black_55%,transparent_100%)]" />
        </div>

        <section className="relative">
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
        <PromptFilters />
      </Suspense>

      <section
        id="library"
        className="container mx-auto max-w-7xl px-6 pt-6 pb-12"
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
