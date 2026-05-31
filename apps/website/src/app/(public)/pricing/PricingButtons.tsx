"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  tier: "yearly" | "lifetime";
  cta: string;
  highlight: boolean;
};

export function PricingButtons({ tier, cta, highlight }: Props) {
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
          "mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold disabled:opacity-60 transition-opacity " +
          (highlight
            ? "bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 text-slate-900 hover:opacity-90 shadow-lg shadow-sky-500/20"
            : "glass hover:bg-card/80 transition-colors")
        }
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {cta}
      </button>
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </>
  );
}
