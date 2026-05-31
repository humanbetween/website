"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PricingPlans } from "@/lib/site-settings";

type Props = {
  initial: PricingPlans;
};

export function PlansSettingsForm({ initial }: Props) {
  const [yearly, setYearly] = useState(centsToDollars(initial.yearlyCents));
  const [yearlyOriginal, setYearlyOriginal] = useState(
    initial.yearlyOriginalCents !== null
      ? centsToDollars(initial.yearlyOriginalCents)
      : "",
  );
  const [yearlyDescription, setYearlyDescription] = useState(
    initial.yearlyDescription,
  );
  const [lifetime, setLifetime] = useState(centsToDollars(initial.lifetimeCents));
  const [lifetimeOriginal, setLifetimeOriginal] = useState(
    initial.lifetimeOriginalCents !== null
      ? centsToDollars(initial.lifetimeOriginalCents)
      : "",
  );
  const [lifetimeDescription, setLifetimeDescription] = useState(
    initial.lifetimeDescription,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const yearlyCents = parseRequiredDollars(yearly);
    const lifetimeCents = parseRequiredDollars(lifetime);
    if (yearlyCents === null || lifetimeCents === null) {
      toast.error("Yearly and lifetime prices are required");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "pricing_plans",
          value: {
            yearlyCents,
            lifetimeCents,
            yearlyOriginalCents: parseOptionalDollars(yearlyOriginal),
            lifetimeOriginalCents: parseOptionalDollars(lifetimeOriginal),
            yearlyDescription: yearlyDescription.trim(),
            lifetimeDescription: lifetimeDescription.trim(),
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      toast.success("Pricing updated. /pricing reflects it on next view.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <fieldset className="grid grid-cols-2 gap-4">
        <legend className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2 col-span-2">
          Yearly subscription
        </legend>
        <Field label="Price ($)" required>
          <input
            type="number"
            min={0}
            step="1"
            required
            value={yearly}
            onChange={(e) => setYearly(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field
          label="Original price ($)"
          hint="Optional — shown struck-through next to the price."
        >
          <input
            type="number"
            min={0}
            step="1"
            value={yearlyOriginal}
            onChange={(e) => setYearlyOriginal(e.target.value)}
            placeholder="—"
            className={inputCls}
          />
        </Field>
        <div className="col-span-2">
          <Field
            label="Description"
            hint="Shown right under the plan name on /pricing. Up to 280 chars."
          >
            <textarea
              value={yearlyDescription}
              onChange={(e) => setYearlyDescription(e.target.value)}
              maxLength={280}
              rows={2}
              className={inputCls}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4">
        <legend className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2 col-span-2">
          Lifetime
        </legend>
        <Field label="Price ($)" required>
          <input
            type="number"
            min={0}
            step="1"
            required
            value={lifetime}
            onChange={(e) => setLifetime(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field
          label="Original price ($)"
          hint="Optional — shown struck-through next to the price."
        >
          <input
            type="number"
            min={0}
            step="1"
            value={lifetimeOriginal}
            onChange={(e) => setLifetimeOriginal(e.target.value)}
            placeholder="—"
            className={inputCls}
          />
        </Field>
        <div className="col-span-2">
          <Field
            label="Description"
            hint="Shown right under the plan name on /pricing. Up to 280 chars."
          >
            <textarea
              value={lifetimeDescription}
              onChange={(e) => setLifetimeDescription(e.target.value)}
              maxLength={280}
              rows={2}
              className={inputCls}
            />
          </Field>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors self-start"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save pricing
      </button>

      <p className="text-[11px] text-muted-foreground">
        These prices control what visitors see on /pricing. The actual Stripe
        charge still uses the Price IDs in <code>STRIPE_PRICE_YEARLY</code> and{" "}
        <code>STRIPE_PRICE_LIFETIME</code> — keep both in sync if you change
        the displayed amount.
      </p>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40";

function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-foreground"> *</span>}
      </span>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </label>
  );
}

function centsToDollars(cents: number): string {
  return (cents / 100).toString();
}

function parseRequiredDollars(input: string): number | null {
  if (!input.trim()) return null;
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function parseOptionalDollars(input: string): number | null {
  if (!input.trim()) return null;
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
