"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Lock, Download } from "lucide-react";
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
  const showUnlockCta = detail !== null && !detail.canAccess && !accessText;
  const primaryCategory = prompt.categories[0];
  const categoryLabel = useCategoryLabel(primaryCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[920px] w-[calc(100vw-2rem)] max-h-[calc(100vh-3rem)] p-0 overflow-hidden bg-card border-border/60 flex flex-col [&>button]:hidden"
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

        <div className="relative flex-1 min-h-0 overflow-hidden bg-black">
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
