"use client";

import { useState } from "react";
import { Lock, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";
import type { PromptListItem } from "@/lib/prompts/types";
import { useCategoryLabel } from "./CategoriesContext";

const CARD_ASPECT = "4 / 3";

export function PromptCard({
  prompt,
  onOpen,
}: {
  prompt: PromptListItem;
  onOpen: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const primaryCategory = prompt.categories[0];
  const categoryLabel = useCategoryLabel(primaryCategory);

  async function onCardButtonClick(e: React.MouseEvent) {
    e.stopPropagation();
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
      <AutoPlayMedia
        src={prompt.videoUrl}
        poster={prompt.thumbnailUrl}
        alt={prompt.title}
        aspectRatio={CARD_ASPECT}
      />
      <div className="px-3 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium truncate leading-tight">
            {prompt.title}
          </h3>
          {categoryLabel && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {categoryLabel}
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
  );
}
