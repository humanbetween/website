"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";
import type { PromptDetail, PromptListItem } from "@/lib/prompts/types";
import { useCategoryLabel } from "./CategoriesContext";

type Props = {
  prompt: PromptListItem;
  open: boolean;
  onOpenChange: (next: boolean) => void;
};

export function PromptDialog({ prompt, open, onOpenChange }: Props) {
  const [detail, setDetail] = useState<PromptDetail | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset transient state whenever the open prompt changes
  useEffect(() => {
    setDetail(null);
    setCopied(false);
  }, [prompt.id]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch(`/api/prompts/${prompt.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PromptDetail | null) => {
        if (active && data) setDetail(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open, prompt.id]);

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
  const categoryLabel = useCategoryLabel(primaryCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[920px] p-0 overflow-hidden bg-card border-border/60 [&>button]:hidden">
        <header className="flex items-start justify-between px-5 py-4 border-b border-border/40 gap-3">
          <div className="min-w-0">
            <DialogTitle className="text-base font-medium truncate">
              {prompt.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {categoryLabel ?? "Prompt"}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {accessText ? (
              <>
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy prompt"}
                </button>
                <UnlimitedPill />
              </>
            ) : showUnlockCta ? (
              <PremiumPill />
            ) : null}
          </div>
        </header>

        <AutoPlayMedia
          src={prompt.videoUrl}
          poster={prompt.thumbnailUrl}
          alt={prompt.title}
          aspectRatio="16 / 10"
          className="bg-background"
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

function PremiumPill() {
  return (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card/80 text-xs font-medium transition-colors"
    >
      <Lock className="h-3.5 w-3.5" /> Premium
    </Link>
  );
}

function UnlimitedPill() {
  return (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card/80 text-xs font-medium transition-colors"
    >
      Unlimited
    </Link>
  );
}
