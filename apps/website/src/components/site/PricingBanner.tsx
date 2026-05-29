"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { PricingBanner } from "@/lib/site-settings";

export function PricingBanner({ banner }: { banner: PricingBanner }) {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!banner.endsAt) {
      setCountdown(null);
      return;
    }
    const ends = new Date(banner.endsAt).getTime();
    function tick() {
      const remaining = ends - Date.now();
      if (remaining <= 0) {
        setCountdown("ended");
        return;
      }
      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const pad = (n: number) => String(n).padStart(2, "0");
      setCountdown(
        days > 0
          ? `${days}d ${pad(hours)}h ${pad(minutes)}m`
          : `${pad(hours)}:${pad(minutes)}:${pad(seconds)} left`,
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [banner.endsAt]);

  if (!banner.active) return null;

  return (
    <div className="w-full bg-foreground text-background">
      <div className="container mx-auto max-w-7xl px-6 py-2.5 flex items-center justify-center gap-3 text-xs sm:text-sm flex-wrap text-center">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">{banner.text}</span>
        {(banner.originalCents !== null || banner.saleCents !== null) && (
          <span className="opacity-80">—</span>
        )}
        {banner.originalCents !== null && (
          <span className="opacity-60 line-through tabular-nums">
            ${(banner.originalCents / 100).toFixed(0)}
          </span>
        )}
        {banner.saleCents !== null && (
          <span className="font-medium tabular-nums">
            now ${(banner.saleCents / 100).toFixed(0)}
          </span>
        )}
        {countdown && countdown !== "ended" && (
          <>
            <span className="opacity-80">—</span>
            <span className="font-mono tabular-nums opacity-80">{countdown}</span>
          </>
        )}
      </div>
    </div>
  );
}
