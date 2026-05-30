"use client";

import { ArrowRight } from "lucide-react";
import type { PromoCard as PromoCardData } from "@/lib/site-settings";

export function PromoCard({ promo }: { promo: PromoCardData }) {
  return (
    <a
      href={promo.ctaUrl || "#"}
      target={promo.ctaUrl ? "_blank" : undefined}
      rel={promo.ctaUrl ? "noreferrer" : undefined}
      className="relative group flex flex-col justify-end rounded-2xl overflow-hidden bg-card/60 border border-border/40 hover:border-border transition-colors min-h-[260px] sm:col-span-2"
    >
      {promo.imageUrl && (
        <img
          src={promo.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
      <div className="relative px-5 py-6 sm:px-7 sm:py-7 flex flex-col gap-3">
        {promo.title && (
          <h3 className="text-xl sm:text-2xl font-bold leading-tight max-w-md text-balance">
            {promo.title}
          </h3>
        )}
        {promo.description && (
          <p className="text-sm text-muted-foreground max-w-md">
            {promo.description}
          </p>
        )}
        {promo.ctaLabel && (
          <span className="mt-1 inline-flex w-fit items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium group-hover:bg-foreground/90 transition-colors">
            {promo.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </a>
  );
}
