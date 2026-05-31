"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { HomeCtaBanner } from "@/lib/site-settings";

export function HomeCtaBannerForm({ initial }: { initial: HomeCtaBanner }) {
  const [values, setValues] = useState<HomeCtaBanner>(initial);
  const [pending, setPending] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<"video" | "image" | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof HomeCtaBanner>(key: K, v: HomeCtaBanner[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function uploadFile(file: File, kind: "video" | "image") {
    setUploadingKind(kind);
    try {
      const presignRes = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: kind === "video" ? "video" : "asset",
          contentType: file.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
          size: file.size,
          filename: file.name,
        }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not get upload URL");
      }
      const presign = (await presignRes.json()) as {
        url: string;
        publicUrl: string;
        contentType: string;
      };
      const uploadRes = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": presign.contentType },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error(`Upload failed (${uploadRes.status})`);
      }
      if (kind === "video") set("videoUrl", presign.publicUrl);
      else set("imageUrl", presign.publicUrl);
      toast.success(`${kind === "video" ? "Video" : "Image"} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingKind(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "home_cta_banner",
          value: {
            active: values.active,
            eyebrow: values.eyebrow.trim(),
            title: values.title.trim(),
            description: values.description.trim(),
            ctaLabel: values.ctaLabel.trim(),
            ctaUrl: values.ctaUrl.trim(),
            imageUrl: values.imageUrl.trim(),
            videoUrl: values.videoUrl.trim(),
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      toast.success("Home banner saved");
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
          checked={values.active}
          onChange={(e) => set("active", e.target.checked)}
          className="h-4 w-4 rounded border-border/60 accent-foreground"
        />
        Show this banner at the bottom of the home page
      </label>

      <Field label="Eyebrow" hint="Small tag above the title. Emoji + caps work well.">
        <input
          value={values.eyebrow}
          onChange={(e) => set("eyebrow", e.target.value)}
          maxLength={80}
          className={inputCls}
        />
      </Field>

      <Field label="Title" hint="The big bold line. Up to 160 chars.">
        <textarea
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={160}
          rows={2}
          required
          className={inputCls}
        />
      </Field>

      <Field label="Description" hint="The supporting sentence. Up to 500 chars.">
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={500}
          rows={3}
          className={inputCls}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Button label" hint="Up to 40 chars.">
          <input
            value={values.ctaLabel}
            onChange={(e) => set("ctaLabel", e.target.value)}
            maxLength={40}
            required
            className={inputCls}
          />
        </Field>
        <Field
          label="Button URL"
          hint="Internal path like /pricing or full https:// URL."
        >
          <input
            value={values.ctaUrl}
            onChange={(e) => set("ctaUrl", e.target.value)}
            maxLength={500}
            required
            className={inputCls}
          />
        </Field>
      </div>

      <Field
        label="Right-side video URL"
        hint="Optional MP4 — auto-plays muted in loop on desktop. Takes priority over the image."
      >
        <div className="flex flex-col gap-2">
          <input
            type="url"
            value={values.videoUrl}
            onChange={(e) => set("videoUrl", e.target.value)}
            maxLength={500}
            placeholder="https://media.humanbetween.ai/videos/..."
            className={inputCls}
          />
          <div className="flex items-center gap-2">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, "video");
                if (videoInputRef.current) videoInputRef.current.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingKind !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground/5 border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/10 disabled:opacity-60 transition-colors"
            >
              {uploadingKind === "video" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              Upload MP4
            </button>
            {values.videoUrl && (
              <button
                type="button"
                onClick={() => set("videoUrl", "")}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </Field>

      <Field
        label="Right-side image URL"
        hint="Optional. Used as the poster while the video loads, or alone if no video is set."
      >
        <div className="flex flex-col gap-2">
          <input
            type="url"
            value={values.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            maxLength={500}
            placeholder="https://media.humanbetween.ai/assets/..."
            className={inputCls}
          />
          <div className="flex items-center gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, "image");
                if (imageInputRef.current) imageInputRef.current.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingKind !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground/5 border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/10 disabled:opacity-60 transition-colors"
            >
              {uploadingKind === "image" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              Upload image
            </button>
            {values.imageUrl && (
              <button
                type="button"
                onClick={() => set("imageUrl", "")}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors self-start"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save banner
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
