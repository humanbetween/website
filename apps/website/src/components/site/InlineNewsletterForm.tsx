"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function InlineNewsletterForm({ ctaLabel }: { ctaLabel: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    if (!consent) {
      setError("Please tick the box to confirm.");
      return;
    }
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not subscribe");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not subscribe");
    }
  }

  if (status === "sent") {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-50 text-sm font-medium">
        <Check className="h-4 w-4" />
        You&apos;re in — watch your inbox.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-md">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          placeholder="you@email.com"
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-background/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 text-slate-900 text-sm font-semibold hover:opacity-90 shadow-lg shadow-sky-500/20 disabled:opacity-60 transition-opacity"
        >
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {ctaLabel}
        </button>
      </div>
      <label className="inline-flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer select-none">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-border/60 accent-foreground"
        />
        <span>
          I agree to receive occasional emails from Human Prompts. Unsubscribe
          any time.
        </span>
      </label>
      {error && (
        <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-3 py-1.5">
          {error}
        </p>
      )}
    </form>
  );
}
