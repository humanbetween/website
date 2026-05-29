"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PricingBanner } from "@/lib/site-settings";

type Props = {
  initial: PricingBanner;
};

export function BannerSettingsForm({ initial }: Props) {
  const [active, setActive] = useState(initial.active);
  const [text, setText] = useState(initial.text);
  const [original, setOriginal] = useState(
    initial.originalCents !== null ? (initial.originalCents / 100).toString() : "",
  );
  const [sale, setSale] = useState(
    initial.saleCents !== null ? (initial.saleCents / 100).toString() : "",
  );
  const [endsAt, setEndsAt] = useState(
    initial.endsAt ? toLocalInput(initial.endsAt) : "",
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "pricing_banner",
          value: {
            active,
            text: text.trim(),
            originalCents: parseDollars(original),
            saleCents: parseDollars(sale),
            endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      toast.success("Banner updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4"
        />
        Show the banner on /pricing
      </label>

      <Field label="Headline">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          placeholder="Founding members sale"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Original price ($)">
          <input
            type="number"
            min={0}
            step="1"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Optional"
            className={inputCls}
          />
        </Field>
        <Field label="Sale price ($)">
          <input
            type="number"
            min={0}
            step="1"
            value={sale}
            onChange={(e) => setSale(e.target.value)}
            placeholder="Optional"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Ends at (local time)" hint="Leave empty to skip the countdown.">
        <input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className={inputCls}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save banner
      </button>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </label>
  );
}

function parseDollars(input: string): number | null {
  if (!input.trim()) return null;
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
