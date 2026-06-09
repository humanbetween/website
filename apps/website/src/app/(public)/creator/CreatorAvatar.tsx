"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import { uploadToR2 } from "@/lib/upload/uploadToR2";

const DEFAULT_AVATAR = "/creator-default.svg";

export function CreatorAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const src = avatarUrl || DEFAULT_AVATAR;

  async function save(url: string | null, okMsg: string) {
    const res = await fetch("/api/creator/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: url }),
    });
    if (!res.ok) throw new Error("save failed");
    toast.success(okMsg);
    router.refresh();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadToR2(file);
      await save(url, "Profile photo updated");
    } catch {
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await save(null, "Photo removed");
    } catch {
      toast.error("Could not remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-full overflow-hidden border border-border/40 bg-card shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-xs font-medium cursor-pointer hover:bg-card/80 w-fit transition-colors">
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
          Change photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={onFile}
          />
        </label>
        {avatarUrl && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-[11px] text-muted-foreground hover:text-foreground underline w-fit disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
