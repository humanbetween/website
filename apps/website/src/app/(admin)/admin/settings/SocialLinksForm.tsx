"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SocialLinks } from "@/lib/site-settings";

type Props = {
  initial: SocialLinks;
};

const FIELDS: Array<{
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
}> = [
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/humanprompts" },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/humanprompts",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@humanprompts",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@humanprompts",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/humanprompts",
  },
];

export function SocialLinksForm({ initial }: Props) {
  const [values, setValues] = useState<SocialLinks>(initial);
  const [pending, setPending] = useState(false);

  function set(key: keyof SocialLinks, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const trimmed: SocialLinks = {
        x: values.x.trim(),
        instagram: values.instagram.trim(),
        youtube: values.youtube.trim(),
        tiktok: values.tiktok.trim(),
        linkedin: values.linkedin.trim(),
      };
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "social_links", value: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      toast.success("Social links saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-[11px] text-muted-foreground">
        Leave a field empty to hide that icon from the footer. URLs must start
        with <code>https://</code>.
      </p>

      {FIELDS.map((f) => (
        <Field key={f.key} label={f.label}>
          <input
            type="url"
            value={values[f.key]}
            onChange={(e) => set(f.key, e.target.value)}
            placeholder={f.placeholder}
            maxLength={500}
            className={inputCls}
          />
        </Field>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors self-start"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save social links
      </button>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
