"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";
import type { PromptListItem } from "@/lib/prompts/types";
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

  async function recordClick() {
    try {
      await fetch(`/api/prompts/${prompt.id}/click`, { method: "POST", keepalive: true });
    } catch {
      /* fire-and-forget */
    }
  }

  return (
    <Link
      href={`/prompt/${prompt.id}`}
      onClick={recordClick}
      className="group block w-full rounded-2xl p-2 bg-card/60 border border-border/40 hover:border-border hover:bg-card/90 transition-colors"
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
          <h3 className="text-sm font-medium truncate leading-tight">{prompt.title}</h3>
          {primaryCategory && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {CATEGORY_LABELS[primaryCategory]}
            </p>
          )}
        </div>
        {prompt.isFree ? (
          <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Free
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Lock className="h-3 w-3" />
          </span>
        )}
      </div>
    </Link>
  );
}
