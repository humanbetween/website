"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PromptCategory } from "@/lib/prompts/types";

export function CategoriesForm({ initial }: { initial: PromptCategory[] }) {
  const router = useRouter();
  const [cats, setCats] = useState<PromptCategory[]>(initial);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map((c) => [c.key, c.label])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function save(key: string) {
    const label = (drafts[key] ?? "").trim();
    if (!label) {
      toast.error("Name is required");
      return;
    }
    setBusy(key);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, label }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Rename failed");
      setCats(data.categories);
      setDrafts(
        Object.fromEntries(
          (data.categories as PromptCategory[]).map((c) => [c.key, c.label]),
        ),
      );
      toast.success("Category renamed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rename failed");
    } finally {
      setBusy(null);
    }
  }

  const originalLabel = (key: string) =>
    cats.find((c) => c.key === key)?.label ?? "";

  // Inlined (not a nested component) so the input keeps focus while typing —
  // a child component declared in render remounts every keystroke.
  const renderRow = (cat: PromptCategory, indented = false) => {
    const changed = (drafts[cat.key] ?? "") !== originalLabel(cat.key);
    return (
      <div
        key={cat.key}
        className={`flex items-center gap-2 ${indented ? "pl-5" : ""}`}
      >
        <input
          value={drafts[cat.key] ?? ""}
          onChange={(e) =>
            setDrafts((d) => ({ ...d, [cat.key]: e.target.value }))
          }
          className="flex-1 px-3 py-1.5 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40"
        />
        <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground w-28 truncate">
          {cat.key}
        </span>
        <button
          type="button"
          onClick={() => save(cat.key)}
          disabled={!changed || busy === cat.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy === cat.key && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
      </div>
    );
  };

  const tops = cats.filter((c) => !c.parent);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-muted-foreground">
        Rename a category or subcategory. The internal key stays the same, so
        existing products keep their tags. Add new ones from the prompt form.
      </p>
      {tops.map((top) => (
        <div key={top.key} className="flex flex-col gap-2">
          {renderRow(top)}
          {cats.filter((c) => c.parent === top.key).map((s) => renderRow(s, true))}
        </div>
      ))}
    </div>
  );
}
