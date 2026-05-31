"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { HeaderCta } from "@/lib/site-settings";

export function HeaderCtaForm({ initial }: { initial: HeaderCta }) {
  const [label, setLabel] = useState(initial.label);
  const [url, setUrl] = useState(initial.url);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "header_cta",
          value: { label: label.trim(), url: url.trim() },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      toast.success("Header button saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-[11px] text-muted-foreground">
        Small pill button shown in the public site header. Leave the URL empty
        to hide the button completely.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Label" hint="Short text shown next to the icon.">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
            placeholder="Instagram"
            className={inputCls}
          />
        </Field>
        <Field
          label="URL"
          hint="Must be a full URL. Leave empty to hide the button."
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={500}
            placeholder="https://instagram.com/humanprompts"
            className={inputCls}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors self-start"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save button
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
