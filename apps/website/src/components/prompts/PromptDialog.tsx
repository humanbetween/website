"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Lock,
  Download,
  ExternalLink,
  Share2,
  Link as LinkIcon,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";
import { slugify } from "@/lib/prompts/slug";
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

  function shareUrl() {
    return `${window.location.origin}/?prompt=${slugify(prompt.title)}`;
  }

  async function onCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }

  function onShareTo(network: "x" | "facebook" | "linkedin") {
    const url = encodeURIComponent(shareUrl());
    const text = encodeURIComponent(prompt.title);
    const target =
      network === "x"
        ? `https://twitter.com/intent/tweet?url=${url}&text=${text}`
        : network === "facebook"
          ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
          : `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    window.open(target, "_blank", "noopener,noreferrer,width=600,height=640");
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
  const creatorName = prompt.creatorName ?? detail?.creatorName ?? null;
  const creatorAvatar =
    prompt.creatorAvatarUrl ?? detail?.creatorAvatarUrl ?? null;
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Share this prompt"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card/80 text-xs font-medium transition-colors outline-none"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={onCopyLink} className="cursor-pointer">
                  <LinkIcon className="h-4 w-4" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onShareTo("x")}
                  className="cursor-pointer"
                >
                  <XMark className="h-4 w-4" />
                  Share on X
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onShareTo("facebook")}
                  className="cursor-pointer"
                >
                  <FacebookMark className="h-4 w-4" />
                  Share on Facebook
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onShareTo("linkedin")}
                  className="cursor-pointer"
                >
                  <LinkedInMark className="h-4 w-4" />
                  Share on LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="relative h-[50vh] sm:h-[70vh] overflow-hidden bg-black">
            <AutoPlayMedia
              src={prompt.videoUrl}
              poster={prompt.thumbnailUrl}
              alt={prompt.title}
              fit
              sound={detail?.hasAudio ?? prompt.hasAudio}
              startUnmuted={detail?.hasAudio ?? prompt.hasAudio}
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

          {creatorName && (
            <div className="flex items-center gap-3 px-5 py-4 border-t border-border/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creatorAvatar || "/creator-default.svg"}
                alt=""
                className="h-11 w-11 rounded-xl object-cover border border-border/40 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{creatorName}</p>
                <p className="text-xs text-muted-foreground">Author</p>
              </div>
            </div>
          )}

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

          {prompt.description && (
            <div className="px-5 py-4 border-t border-border/40">
              <HowItWorks text={prompt.description} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Parse a numbered list ("1. … 2. …") into step strings. Returns null when the
// text isn't a clean numbered list, so we fall back to a plain paragraph.
function parseSteps(text: string): string[] | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const steps: string[] = [];
  for (const line of lines) {
    const m = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (!m) return null;
    steps.push(m[2]);
  }
  return steps.length >= 2 ? steps : null;
}

function HowItWorks({ text }: { text: string }) {
  const steps = parseSteps(text);
  return (
    <div>
      <p className="text-sm font-semibold mb-3">How it works</p>
      {steps ? (
        <ol className="flex flex-col md:flex-row md:items-stretch gap-2">
          {steps.map((s, i) => (
            <Fragment key={i}>
              <li className="flex-1 rounded-xl border border-border/40 bg-background/40 p-3 flex flex-col gap-2 min-w-0">
                <span className="h-6 w-6 shrink-0 rounded-full bg-foreground text-background text-xs font-semibold inline-flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-xs text-foreground/80 leading-relaxed">
                  {s}
                </span>
              </li>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="flex items-center justify-center text-muted-foreground shrink-0"
                >
                  <ChevronRight className="hidden md:block h-4 w-4" />
                  <ChevronDown className="md:hidden h-4 w-4" />
                </span>
              )}
            </Fragment>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
          {text}
        </p>
      )}
    </div>
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

// Lucide dropped brand glyphs, so the social marks are inline SVGs that inherit
// the current text color like any other menu icon.
function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
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
