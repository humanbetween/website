"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function JoinCreator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function join() {
    setLoading(true);
    try {
      const res = await fetch("/api/creator/join", { method: "POST" });
      if (!res.ok) throw new Error("join failed");
      toast.success("You're a creator now");
      router.push("/creator");
      router.refresh();
    } catch {
      toast.error("Could not join. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={join}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Become a creator
    </button>
  );
}
