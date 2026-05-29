import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { PromptGrid } from "@/components/prompts/PromptGrid";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="container mx-auto max-w-4xl px-6 pt-16 md:pt-24 pb-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl leading-[0.95] text-balance font-medium">
            Premium AI prompts.
            <br />
            Copy, paste, ship.
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
        className="container mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-20"
      >
        <Suspense fallback={null}>
          <PromptGrid />
        </Suspense>
      </section>
    </>
  );
}
