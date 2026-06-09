"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";
import type { PromptListItem } from "@/lib/prompts/types";
import { useCategoryLabel } from "./CategoriesContext";
import { FavoriteButton } from "./FavoriteButton";

const CARD_ASPECT = "4 / 3";

export function PromptCard({
  prompt,
  onOpen,
  hasUnlimited = false,
  isFavorited = false,
  isSignedIn = false,
}: {
  prompt: PromptListItem;
  onOpen: () => void;
  hasUnlimited?: boolean;
  isFavorited?: boolean;
  isSignedIn?: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const primaryCategory = prompt.categories[0];
  const categoryLabel = useCategoryLabel(primaryCategory);
  const accessible = prompt.isFree || hasUnlimited;

  async function onCardButtonClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!accessible) {
      router.push("/pricing");
      return;
    }
    if (prompt.hasWebsite) {
      // Open the full-screen dialog like a normal prompt; the actual
      // "Visit website" action lives inside the dialog.
      onOpen();
      return;
    }
    if (prompt.promptText) {
      try {
        await navigator.clipboard.writeText(prompt.promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        toast.success("Prompt copied to clipboard");
      } catch {
        toast.error("Could not copy");
      }
      return;
    }
    onOpen();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex flex-col rounded-2xl overflow-hidden bg-card/60 border border-border/40 hover:border-border hover:bg-card/90 transition-colors cursor-pointer"
    >
      <div className="relative">
        <AutoPlayMedia
          src={prompt.videoUrl}
          poster={prompt.thumbnailUrl}
          alt={prompt.title}
          aspectRatio={CARD_ASPECT}
        />
        <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
          <FavoriteButton
            promptId={prompt.id}
            initialCount={prompt.favoriteCount}
            initialFavorited={isFavorited}
            isSignedIn={isSignedIn}
          />
        </div>
        {prompt.referenceImageUrl && (
          <div
            className="absolute bottom-2 left-2 h-12 w-12 rounded-lg overflow-hidden border border-white/30 shadow-lg bg-black/40 backdrop-blur-sm"
            title="Reference frame — upload this image with the prompt"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prompt.referenceImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
      <div className="px-3 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium truncate leading-tight">
            {prompt.title}
          </h3>
          {(categoryLabel || prompt.creatorName) && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {categoryLabel}
              {categoryLabel && prompt.creatorName ? " · " : ""}
              {prompt.creatorName && (
                <span className="text-sky-400">by {prompt.creatorName}</span>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onCardButtonClick}
          aria-label={
            accessible
              ? prompt.hasWebsite
                ? "Open website preview"
                : "Copy prompt"
              : "Locked — open"
          }
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-foreground/5 border border-border/60 text-[11px] text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
        >
          {accessible ? (
            prompt.hasWebsite ? (
              <>
                <ExternalLink className="h-3 w-3" />
                Website
              </>
            ) : (
              <>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </>
            )
          ) : (
            <Lock className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
}
