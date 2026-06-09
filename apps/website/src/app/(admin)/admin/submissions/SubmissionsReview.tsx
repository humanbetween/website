"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, ExternalLink, Copy } from "lucide-react";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";

export type PendingSubmission = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  websiteUrl: string | null;
  promptText: string | null;
  categories: string[];
  createdAt: string | Date;
  creatorName: string | null;
  creatorEmail: string | null;
};

export function SubmissionsReview({ rows }: { rows: PendingSubmission[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function review(
    id: string,
    action: "approve" | "reject",
    notes?: string,
  ) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { action, notes } : { action }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success(action === "approve" ? "Published" : "Sent back to creator");
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function copyPrompt(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Prompt copied — paste it into your tool to test");
    } catch {
      toast.error("Could not copy");
    }
  }

  function reject(id: string) {
    const notes = window.prompt(
      "What needs to change? (sent to the creator)",
    );
    if (notes === null) return;
    if (!notes.trim()) {
      toast.error("Add a short note for the creator");
      return;
    }
    review(id, "reject", notes.trim());
  }

  if (rows.length === 0) {
    return (
      <p className="px-5 py-12 text-center text-sm text-muted-foreground">
        No submissions waiting for review.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {rows.map((s) => {
        const type = s.websiteUrl ? "Website" : "Prompt";
        return (
          <div
            key={s.id}
            className="rounded-2xl border border-border/40 bg-card/40 p-4 flex flex-col gap-4"
          >
            <div className="flex gap-4">
              <div className="w-40 sm:w-56 shrink-0">
                <AutoPlayMedia
                  src={s.videoUrl}
                  poster={s.thumbnailUrl}
                  alt={s.title}
                  aspectRatio="4 / 3"
                  className="rounded-lg border border-border/40"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{s.title}</h3>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full bg-card/60 border border-border/60 text-muted-foreground">
                    {type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.creatorName ? `${s.creatorName} · ` : ""}
                  {s.creatorEmail}
                </p>
                {s.description && (
                  <p className="text-sm text-foreground/70 mt-2">
                    {s.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.categories.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 text-[11px] rounded-full bg-secondary border border-border/40 text-muted-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                {s.websiteUrl && (
                  <a
                    href={s.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 underline"
                  >
                    <ExternalLink className="h-3 w-3" /> {s.websiteUrl}
                  </a>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0 self-start">
                <button
                  type="button"
                  onClick={() => review(s.id, "approve")}
                  disabled={busy === s.id}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => reject(s.id)}
                  disabled={busy === s.id}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground text-xs font-medium disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>

            {s.promptText && (
              <div className="rounded-xl border border-border/40 bg-background/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Prompt
                  </span>
                  <button
                    type="button"
                    onClick={() => copyPrompt(s.promptText!)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
                  >
                    <Copy className="h-3 w-3" /> Copy to test
                  </button>
                </div>
                <pre className="max-h-64 overflow-auto px-4 py-3 text-xs whitespace-pre-wrap font-mono text-foreground/90">
                  {s.promptText}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
