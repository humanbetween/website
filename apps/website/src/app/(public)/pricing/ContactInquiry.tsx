"use client";

import { useState } from "react";
import { Loader2, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

const SIZES = ["1", "2-10", "11-50", "51-200", "200+"] as const;
type Size = (typeof SIZES)[number];

export function ContactInquiry() {
  const [size, setSize] = useState<Size | "">("");
  const [email, setEmail] = useState("");
  const [needs, setNeeds] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!size) {
      toast.error("Pick a company size");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/contact-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companySize: size, email, needs }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not send");
      }
      setSent(true);
      toast.success("Thanks — we'll be in touch shortly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-12 max-w-4xl mx-auto rounded-2xl border border-border/40 bg-card/40 px-6 py-8 text-center">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 mb-3">
          <Check className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">Thanks — we'll be in touch.</h3>
        <p className="text-sm text-muted-foreground mt-1">
          One of us will reach out at <span className="text-foreground">{email}</span>{" "}
          within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-16 max-w-5xl mx-auto">
      <header className="text-center mb-6">
        <p className="inline-flex items-center px-3 py-1 mb-3 rounded-full text-[11px] font-mono uppercase tracking-wider text-muted-foreground border border-border/40 bg-card/40">
          For teams
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Not sure which plan? Tell us about you.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          Quick 3-question form. We reply from a real inbox within a day.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-border/40 bg-card/40 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-end gap-3"
      >
        <label className="flex flex-col gap-1.5 lg:w-44">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Company size
          </span>
          <select
            required
            value={size}
            onChange={(e) => setSize(e.target.value as Size)}
            className="px-3 py-2.5 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40"
          >
            <option value="" disabled>
              Pick a size
            </option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s === "1" ? "Just me" : s + " people"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 lg:flex-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Work email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            placeholder="you@company.com"
            className="px-3 py-2.5 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40"
          />
        </label>

        <label className="flex flex-col gap-1.5 lg:flex-[1.5]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            What do you need?
          </span>
          <input
            type="text"
            value={needs}
            onChange={(e) => setNeeds(e.target.value)}
            maxLength={500}
            placeholder="Custom prompts, volume licence, team seats…"
            className="px-3 py-2.5 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60 transition-colors lg:self-stretch"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {pending ? "Sending…" : "Get in touch"}
        </button>
      </form>
    </section>
  );
}
