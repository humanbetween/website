"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { HeroContent } from "@/lib/site-settings";

type Props = {
  initial: HeroContent;
};

export function HeroSettingsForm({ initial }: Props) {
  const [titleLine1, setTitleLine1] = useState(initial.titleLine1);
  const [titleLine2, setTitleLine2] = useState(initial.titleLine2);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "hero_content",
          value: {
            titleLine1: titleLine1.trim(),
            titleLine2: titleLine2.trim(),
            subtitle: subtitle.trim(),
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      toast.success("Hero updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        label="Title — line 1 (uppercase + bold)"
        hint="Becomes the first line of the home hero. Up to 80 chars."
      >
        <input
          value={titleLine1}
          onChange={(e) => setTitleLine1(e.target.value)}
          maxLength={80}
          required
          className={inputCls}
        />
      </Field>

      <Field
        label="Title — line 2 (medium weight)"
        hint="The supporting line right under the bold one. Up to 80 chars."
      >
        <input
          value={titleLine2}
          onChange={(e) => setTitleLine2(e.target.value)}
          maxLength={80}
          required
          className={inputCls}
        />
      </Field>

      <Field
        label="Subtitle"
        hint="Short paragraph shown under the title. Up to 280 chars."
      >
        <textarea
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={280}
          rows={3}
          required
          className={inputCls}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors self-start"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save hero
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
