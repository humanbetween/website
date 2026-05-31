"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

type Props = {
  promptId: string;
  initialCount: number;
  initialFavorited: boolean;
  isSignedIn: boolean;
};

export function FavoriteButton({
  promptId,
  initialCount,
  initialFavorited,
  isSignedIn,
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function onClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isSignedIn) {
      toast("Sign in to save favorites.");
      return;
    }
    if (pending) return;

    const nextFavorited = !favorited;
    const nextCount = Math.max(0, count + (nextFavorited ? 1 : -1));
    setFavorited(nextFavorited);
    setCount(nextCount);
    setPending(true);

    try {
      const res = await fetch(`/api/prompts/${promptId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Toggle failed");
      }
      const body = (await res.json()) as { favorited: boolean; count: number };
      setFavorited(body.favorited);
      setCount(body.count);
    } catch {
      setFavorited(!nextFavorited);
      setCount(count);
      toast.error("Couldn't update favorite. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[11px] text-white/90 hover:bg-black/80 transition-colors tabular-nums"
    >
      <span>{count}</span>
      <Heart
        className={
          "h-3.5 w-3.5 transition-colors " +
          (favorited ? "fill-rose-500 text-rose-500" : "text-white/80")
        }
      />
    </button>
  );
}
