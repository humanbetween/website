"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";
import type { PromptDetail, PromptListItem } from "@/lib/prompts/types";
import { CATEGORY_LABELS } from "@/lib/prompts/types";

type Props = {
  prompt: PromptListItem;
  open: boolean;
  onOpenChange: (next: boolean) => void;
};

export function PromptDialog({ prompt, open, onOpenChange }: Props) {
  const [detail, setDetail] = useState<PromptDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || detail || loading) return;
    let active = true;
    setLoading(true);
    fetch(`/api/prompts/${prompt.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PromptDetail | null) => {
        if (active && data) setDetail(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, prompt.id, detail, loading]);

  async function onCopy() {
    const text = detail?.promptText ?? prompt.promptText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  }

  const accessText = detail?.promptText ?? prompt.promptText;
  const showUnlockCta = detail !== null && !detail.canAccess && !accessText;
  const primaryCategory = prompt.categories[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 bg-card border-border/60 [&>button]:hidden max-h-[90vh] flex flex-col gap-0">
        <header className="shrink-0 flex items-start justify-between px-5 py-4 border-b border-border/40 gap-3">
          <div className="min-w-0">
            <DialogTitle className="text-base font-medium truncate">
              {prompt.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {primaryCategory ? CATEGORY_LABELS[primaryCategory] : "Prompt"}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {accessText && (
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy prompt"}
              </button>
            )}
            {showUnlockCta && <UnlockCta prompt={prompt} />}
            <Link
              href={`/prompt/${prompt.id}`}
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Open full page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <AutoPlayMedia
            src={prompt.videoUrl}
            poster={prompt.thumbnailUrl}
            alt={prompt.title}
            className="bg-background"
            natural
          />

          {(prompt.tools.length > 0 || prompt.tags.length > 0) && (
            <div className="px-5 py-4 border-t border-border/40 grid sm:grid-cols-2 gap-4">
              {prompt.tools.length > 0 && (
                <ChipGroup title="Use with" items={prompt.tools} />
              )}
              {prompt.tags.length > 0 && (
                <ChipGroup title="Best for" items={prompt.tags} prefix="#" muted />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChipGroup({
  title,
  items,
  prefix = "",
  muted = false,
}: {
  title: string;
  items: string[];
  prefix?: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider mb-2">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <span
            key={t}
            className={`px-2 py-0.5 text-[11px] bg-secondary border border-border/40 rounded-full ${
              muted ? "text-muted-foreground" : ""
            }`}
          >
            {prefix}
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function UnlockCta({ prompt }: { prompt: PromptListItem }) {
  if (prompt.priceCents > 0) {
    return (
      <Link
        href={`/prompt/${prompt.id}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90"
      >
        <Lock className="h-3.5 w-3.5" />
        Unlock ${(prompt.priceCents / 100).toFixed(2)}
      </Link>
    );
  }
  return (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90"
    >
      <Lock className="h-3.5 w-3.5" /> Go unlimited
    </Link>
  );
}
