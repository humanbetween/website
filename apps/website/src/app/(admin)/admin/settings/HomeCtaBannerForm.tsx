"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { HomeCtaBanner } from "@/lib/site-settings";

export function HomeCtaBannerForm({ initial }: { initial: HomeCtaBanner }) {
  const [values, setValues] = useState<HomeCtaBanner>(initial);
  const [pending, setPending] = useState(false);

  function set<K extends keyof HomeCtaBanner>(key: K, v: HomeCtaBanner[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "home_cta_banner",
          value: {
            active: values.active,
            eyebrow: values.eyebrow.trim(),
            title: values.title.trim(),
            description: values.description.trim(),
            ctaLabel: values.ctaLabel.trim(),
            ctaUrl: values.ctaUrl.trim(),
            imageUrl: values.imageUrl.trim(),
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      toast.success("Home banner saved");
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
          checked={values.active}
          onChange={(e) => set("active", e.target.checked)}
          className="h-4 w-4 rounded border-border/60 accent-foreground"
        />
        Show this banner at the bottom of the home page
      </label>

      <Field label="Eyebrow" hint="Small tag above the title. Emoji + caps work well.">
        <input
          value={values.eyebrow}
          onChange={(e) => set("eyebrow", e.target.value)}
          maxLength={80}
          className={inputCls}
        />
      </Field>

      <Field label="Title" hint="The big bold line. Up to 160 chars.">
        <textarea
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={160}
          rows={2}
          required
          className={inputCls}
        />
      </Field>

      <Field label="Description" hint="The supporting sentence. Up to 500 chars.">
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={500}
          rows={3}
          className={inputCls}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Button label" hint="Up to 40 chars.">
          <input
            value={values.ctaLabel}
            onChange={(e) => set("ctaLabel", e.target.value)}
            maxLength={40}
            required
            className={inputCls}
          />
        </Field>
        <Field
          label="Button URL"
          hint="Internal path like /pricing or full https:// URL."
        >
          <input
            value={values.ctaUrl}
            onChange={(e) => set("ctaUrl", e.target.value)}
            maxLength={500}
            required
            className={inputCls}
          />
        </Field>
      </div>

      <Field
        label="Right-side image URL"
        hint="Optional. Decorative image shown on the right on desktop. Leave empty to keep just the gradient backdrop."
      >
        <input
          type="url"
          value={values.imageUrl}
          onChange={(e) => set("imageUrl", e.target.value)}
          maxLength={500}
          placeholder="https://media.humanbetween.ai/banners/..."
          className={inputCls}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors self-start"
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
