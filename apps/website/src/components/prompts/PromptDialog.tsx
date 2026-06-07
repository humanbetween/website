"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy, Check, Lock, Download, ExternalLink } from "lucide-react";
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
  onPrev?: () => void;
  onNext?: () => void;
};

export function PromptDialog({
  prompt,
  open,
  onOpenChange,
  onPrev,
  onNext,
}: Props) {
  const [detail, setDetail] = useState<PromptDetail | null>(null);
  const [copied, setCopied] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Horizontal swipe only: dominant X movement over a small threshold.
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) onNext?.();
    else onPrev?.();
  }

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

  async function onDownloadReference() {
    const url = prompt.referenceImageUrl;
    if (!url) return;
    const filename = (() => {
      const fromUrl = url.split("/").pop()?.split("?")[0] ?? "";
      if (fromUrl) return `${prompt.title.replace(/[^a-z0-9-]+/gi, "-")}-${fromUrl}`;
      return `${prompt.title.replace(/[^a-z0-9-]+/gi, "-")}-reference.jpg`;
    })();
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // Fallback: open the image in a new tab so the user can save it
      window.open(url, "_blank", "noopener");
    }
  }

  const accessText = detail?.promptText ?? prompt.promptText;
  const websiteUrl = detail?.websiteUrl ?? prompt.websiteUrl;
  const hasAccess = !!accessText || !!websiteUrl;
  const showUnlockCta = detail !== null && !detail.canAccess;
  const primaryCategory = prompt.categories[0];
  const categoryLabel = useCategoryLabel(primaryCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="max-w-[920px] w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] p-0 overflow-hidden bg-card border-border/60 flex flex-col [&>button]:hidden"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border/40 gap-3 shrink-0">
          <div className="min-w-0">
            <DialogTitle className="text-base font-medium truncate">
              {prompt.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {categoryLabel ?? "Prompt"}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasAccess ? (
              <>
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
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Visit website
                  </a>
                )}
                {prompt.referenceImageUrl && (
                  <button
                    type="button"
                    onClick={onDownloadReference}
                    title="Download the reference image to combine with the prompt"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card/80 text-xs font-medium transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Reference
                  </button>
                )}
                <UnlimitedPill />
              </>
            ) : showUnlockCta ? (
              <PremiumPill />
            ) : null}
          </div>
        </header>

        <div className="relative h-[50vh] sm:h-[70vh] overflow-hidden bg-black">
          <AutoPlayMedia
            src={prompt.videoUrl}
            poster={prompt.thumbnailUrl}
            alt={prompt.title}
            fit
            className="h-full"
          />
          {prompt.referenceImageUrl && (
            <div
              className="absolute bottom-3 left-3 h-24 w-24 sm:h-[120px] sm:w-[120px] rounded-xl overflow-hidden border border-white/30 shadow-xl bg-black/40 backdrop-blur-sm"
              title="Reference frame — upload this image with the prompt"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prompt.referenceImageUrl}
                alt="Reference"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        {(prompt.tools.length > 0 || prompt.tags.length > 0) && (
          <div className="px-5 py-4 border-t border-border/40 grid sm:grid-cols-2 gap-4 shrink-0">
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
