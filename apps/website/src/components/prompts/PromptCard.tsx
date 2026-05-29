"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Copy, Check, ExternalLink } from "lucide-react";
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

const ASPECT_RATIOS = ["3 / 4", "1 / 1", "4 / 3", "4 / 5", "3 / 2"];

function pickAspect(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return ASPECT_RATIOS[sum % ASPECT_RATIOS.length] ?? "1 / 1";
}

export function PromptCard({ prompt }: { prompt: PromptListItem }) {
  const aspect = pickAspect(prompt.id);
  const primaryCategory = prompt.categories[0];
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState<PromptDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  function recordClick() {
    fetch(`/api/prompts/${prompt.id}/click`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }

  async function doCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  async function onCardButtonClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (prompt.promptText) {
      await doCopy(prompt.promptText);
      return;
    }
    await onOpenChange(true);
  }

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    recordClick();
    if (detail || loadingDetail) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/prompts/${prompt.id}`);
      if (res.ok) setDetail((await res.json()) as PromptDetail);
    } catch {
      /* ignore — modal still renders preview */
    } finally {
      setLoadingDetail(false);
    }
  }

  const accessText = detail?.promptText ?? prompt.promptText;
  const canAccess = detail?.canAccess ?? prompt.isFree;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenChange(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenChange(true);
          }
        }}
        className="group w-full rounded-2xl p-2 bg-card/60 border border-border/40 hover:border-border hover:bg-card/90 transition-colors cursor-pointer"
      >
        <AutoPlayMedia
          src={prompt.videoUrl}
          poster={prompt.thumbnailUrl}
          alt={prompt.title}
          aspectRatio={aspect}
          className="rounded-xl"
        />
        <div className="px-2 pt-3 pb-1 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate leading-tight">
              {prompt.title}
            </h3>
            {primaryCategory && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {CATEGORY_LABELS[primaryCategory]}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCardButtonClick}
            aria-label={prompt.isFree ? "Copy prompt" : "Locked — open"}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-foreground/5 border border-border/60 text-[11px] text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
          >
            {prompt.isFree ? (
              <>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </>
            ) : (
              <Lock className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border/60 [&>button]:hidden">
          <div className="flex items-start justify-between px-5 py-4 border-b border-border/40 gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-base font-medium truncate">
                {prompt.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {primaryCategory ? CATEGORY_LABELS[primaryCategory] : "Prompt"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {accessText ? (
                <button
                  type="button"
                  onClick={() => doCopy(accessText)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy prompt"}
                </button>
              ) : detail && !canAccess ? (
                <UnlockDialogCta prompt={prompt} />
              ) : null}
              <Link
                href={`/prompt/${prompt.id}`}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Open full page"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <AutoPlayMedia
            src={prompt.videoUrl}
            poster={prompt.thumbnailUrl}
            alt={prompt.title}
            aspectRatio="16 / 10"
            className="bg-background"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          {(prompt.tools.length > 0 || prompt.tags.length > 0) && (
            <div className="px-5 py-4 border-t border-border/40 grid sm:grid-cols-2 gap-4">
              {prompt.tools.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider mb-2">
                    Use with
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {prompt.tools.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[11px] bg-secondary border border-border/40 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {prompt.tags.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider mb-2">
                    Best for
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {prompt.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[11px] bg-secondary border border-border/40 rounded-full text-muted-foreground"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function UnlockDialogCta({ prompt }: { prompt: PromptListItem }) {
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
