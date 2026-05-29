"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Loader2 } from "lucide-react";

export function UnlockButton({
  promptId,
  priceCents,
}: {
  promptId: string;
  priceCents: number;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "one_time", promptId }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (body.url) {
        window.location.href = body.url;
        return;
      }
      setError(body.error ?? "Checkout failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setPending(false);
    }
  }

  if (priceCents <= 0) {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90"
      >
        <Lock className="h-3 w-3" /> Go unlimited
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Lock className="h-3 w-3" />
        )}
        Unlock ${(priceCents / 100).toFixed(2)}
      </button>
      <Link
        href="/pricing"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        or unlimited
      </Link>
      {error && (
        <span className="text-xs text-destructive ml-2">{error}</span>
      )}
    </div>
  );
}
