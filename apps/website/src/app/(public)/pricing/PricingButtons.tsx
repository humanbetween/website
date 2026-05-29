"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PricingButtons({
  tier,
  highlight,
}: {
  tier: "monthly" | "lifetime";
  highlight: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCheckout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription", tier }),
      });
      if (res.status === 401) {
        router.push(`/auth/sign-in?redirect=/pricing`);
        return;
      }
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

  return (
    <>
      <button
        type="button"
        onClick={onCheckout}
        disabled={pending}
        className={
          "mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium disabled:opacity-60 transition-colors " +
          (highlight
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "glass hover:bg-card/80")
        }
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {tier === "monthly" ? "Subscribe" : "Buy lifetime"}
      </button>
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </>
  );
}
