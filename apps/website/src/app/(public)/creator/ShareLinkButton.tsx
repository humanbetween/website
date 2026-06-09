"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2, Check } from "lucide-react";

export function ShareLinkButton({ url, label = "Share" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Share link copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
