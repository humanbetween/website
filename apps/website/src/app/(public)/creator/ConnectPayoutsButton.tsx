"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Banknote } from "lucide-react";

export function ConnectPayoutsButton({ label = "Set up payouts" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/creator/connect", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "failed");
      window.location.href = data.url as string;
    } catch {
      toast.error("Could not start payout setup. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors w-fit"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Banknote className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
