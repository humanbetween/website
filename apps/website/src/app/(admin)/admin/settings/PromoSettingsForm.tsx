"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { PromoCard } from "@/lib/site-settings";
import { uploadToR2 } from "@/lib/upload/uploadToR2";

type Props = {
  initial: PromoCard;
};

export function PromoSettingsForm({ initial }: Props) {
  const [active, setActive] = useState(initial.active);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel);
  const [ctaUrl, setCtaUrl] = useState(initial.ctaUrl);
  const [position, setPosition] = useState(initial.position);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  async function onUpload(file: File) {
    const isVideo = file.type.startsWith("video/");
    setUploading(true);
    setProgress(null);
    try {
      const { url } = await uploadToR2(file, {
        onProgress: isVideo ? setProgress : undefined,
      });
      setImageUrl(url);
      toast.success(`${isVideo ? "Video" : "Image"} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  const isVideoUrl =
    !!imageUrl && !/\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(imageUrl);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "promo_card",
          value: {
            active,
            title: title.trim(),
            description: description.trim(),
            imageUrl: imageUrl.trim(),
            ctaLabel: ctaLabel.trim() || "Explore",
            ctaUrl: ctaUrl.trim(),
            position: Number.isFinite(position) ? position : 8,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      toast.success("Promo card updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4"
        />
        Show the promo card on the home grid
      </label>

      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Animated backgrounds designed to convert"
          className={inputCls}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="One or two short sentences shown over the image."
          className={inputCls}
        />
      </Field>

      <Field
        label="Background media URL"
        hint="Image or video. Upload to R2 or paste any public URL. Videos autoplay muted and loop in the card."
      >
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://pub-…r2.dev/videos/…"
          className={inputCls}
        />
        <div className="flex items-center gap-3 mt-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-full glass text-xs cursor-pointer hover:bg-card/80">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading
              ? progress !== null
                ? `Compressing ${Math.round(progress * 100)}%`
                : "Uploading…"
              : "Upload to R2"}
            <input
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>
          {imageUrl &&
            (isVideoUrl ? (
              <video
                src={imageUrl}
                muted
                playsInline
                preload="metadata"
                className="h-10 w-16 object-cover rounded-md border border-border/40"
              />
            ) : (
              <img
                src={imageUrl}
                alt=""
                className="h-10 w-16 object-cover rounded-md border border-border/40"
              />
            ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="CTA label">
          <input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            maxLength={40}
            placeholder="Explore videos"
            className={inputCls}
          />
        </Field>
        <Field label="CTA URL" hint="External link, opens in a new tab.">
          <input
            type="url"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://…"
            className={inputCls}
          />
        </Field>
      </div>

      <Field
        label="Position in grid"
        hint="The card appears after this many prompts. 8 puts it at the start of the third row on desktop."
      >
        <input
          type="number"
          min={0}
          max={200}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          className={inputCls}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors self-start"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save promo card
      </button>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </label>
  );
}
