import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { PromptGrid } from "@/components/prompts/PromptGrid";
import { PricingBanner } from "@/components/site/PricingBanner";
import { getPricingBanner, getPromoCard } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banner, promo] = await Promise.all([
    getPricingBanner(),
    getPromoCard(),
  ]);

  return (
    <>
      <PricingBanner banner={banner} />

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-sky-400/15 via-sky-400/5 to-transparent"
        />
        <div className="relative container mx-auto max-w-4xl px-6 pt-16 md:pt-24 pb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl leading-[0.95] text-balance font-bold">
            <span className="uppercase">Premium AI prompts.</span>
            <br />
            <span className="font-medium">Copy, paste, ship.</span>
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-base text-muted-foreground">
            A growing library of curated prompts for video, image and websites.
            Built for creators who move fast.
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

      <Suspense fallback={<div className="h-14" />}>
        <PromptFilters />
      </Suspense>

      <section
        id="library"
        className="container mx-auto max-w-7xl px-5 sm:px-6 pt-6 pb-20"
      >
        <Suspense fallback={null}>
          <PromptGrid promo={promo} />
        </Suspense>
      </section>
    </>
  );
}
