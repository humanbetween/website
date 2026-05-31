import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeCtaBanner as Data } from "@/lib/site-settings";
import { NewsletterCtaButton } from "./NewsletterCtaButton";

export function HomeCtaBanner({ banner }: { banner: Data }) {
  if (!banner.active) return null;

  const isExternal = /^https?:\/\//i.test(banner.ctaUrl);

  return (
    <section className="container mx-auto max-w-7xl px-5 sm:px-6 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-emerald-500/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl"
        />

        <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-8 md:gap-6 px-7 sm:px-10 py-10 sm:py-12">
          <div className="flex flex-col gap-4 max-w-xl">
            {banner.eyebrow && (
              <p className="inline-flex self-start items-center px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider text-foreground bg-foreground/10 border border-foreground/15">
                {banner.eyebrow}
              </p>
            )}
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight leading-[1.1] text-balance">
              {banner.title}
            </h2>
            {banner.description && (
              <p className="text-sm sm:text-base text-muted-foreground text-balance leading-relaxed">
                {banner.description}
              </p>
            )}
            <div className="mt-2">
              {banner.newsletterMode ? (
                <NewsletterCtaButton ctaLabel={banner.ctaLabel} />
              ) : isExternal ? (
                <a
                  href={banner.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 text-slate-900 text-sm font-semibold hover:opacity-90 shadow-lg shadow-sky-500/20 transition-opacity"
                >
                  {banner.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  href={banner.ctaUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 text-slate-900 text-sm font-semibold hover:opacity-90 shadow-lg shadow-sky-500/20 transition-opacity"
                >
                  {banner.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {(banner.videoUrl || banner.imageUrl) && (
            <div className="relative hidden md:block">
              {banner.videoUrl ? (
                <video
                  src={banner.videoUrl}
                  poster={banner.imageUrl || undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover rounded-2xl"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover rounded-2xl"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
