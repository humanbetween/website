"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  promptFormSchema,
  type PromptFormValues,
} from "@/lib/prompts/schema";
import {
  DEFAULT_CATEGORIES,
  type PromptCategory,
} from "@/lib/prompts/types";
import { AutoPlayMedia } from "@/components/media/AutoPlayMedia";

type Props = {
  initial?: Partial<PromptFormValues> & { id?: string };
  mode: "create" | "edit";
};

export function PromptForm({ initial, mode }: Props) {
  const [availableCategories, setAvailableCategories] = useState<PromptCategory[]>(
    () => [...DEFAULT_CATEGORIES],
  );
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { categories?: PromptCategory[] } | null) => {
        if (active && data?.categories) setAvailableCategories(data.categories);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function addCategoryInline(
    currentSelection: string[],
    onChange: (next: string[]) => void,
  ) {
    const label = window.prompt("New category name");
    if (!label || !label.trim()) return;
    setAddingCategory(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Add failed");
      }
      const data = (await res.json()) as { categories: PromptCategory[] };
      setAvailableCategories(data.categories);
      // auto-select the newly added category
      const added = data.categories.find(
        (c) => !availableCategories.some((existing) => existing.key === c.key),
      );
      if (added) onChange([...currentSelection, added.key]);
      toast.success(`Added category "${label.trim()}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed");
    } finally {
      setAddingCategory(false);
    }
  }

  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      promptText: initial?.promptText ?? "",
      priceCents: 0,
      isFree: initial?.isFree ?? false,
      videoUrl: initial?.videoUrl ?? "",
      thumbnailUrl: initial?.thumbnailUrl ?? null,
      referenceImageUrl: initial?.referenceImageUrl ?? null,
      isPublished: initial?.isPublished ?? true,
      assets: initial?.assets ?? [],
      categories: initial?.categories ?? [],
      tags: initial?.tags ?? [],
      tools: initial?.tools ?? (mode === "create" ? ["Seedance 2"] : []),
    },
  });

  const videoUrl = watch("videoUrl");
  const referenceImageUrl = watch("referenceImageUrl");
  const categories = watch("categories");
  const tags = watch("tags");
  const tools = watch("tools");
  const [refUploading, setRefUploading] = useState(false);

  async function uploadVideo(file: File) {
    const presignRes = await fetch("/api/admin/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "video",
        contentType: file.type || "video/mp4",
        size: file.size,
        filename: file.name,
      }),
    });
    if (!presignRes.ok) {
      const body = await presignRes.json().catch(() => ({}));
      throw new Error(body.error ?? "Could not get upload URL");
    }
    const presign = (await presignRes.json()) as {
      method: "PUT";
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
      throw new Error(`Upload failed (${uploadRes.status} ${uploadRes.statusText})`);
    }
    return presign.publicUrl;
  }

  async function onReferenceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "asset",
          contentType: file.type || "image/jpeg",
          size: file.size,
          filename: file.name,
        }),
      });
      if (!presignRes.ok) throw new Error("Could not get upload URL");
      const presign = (await presignRes.json()) as {
        url: string;
        publicUrl: string;
        contentType: string;
      };
      const up = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": presign.contentType },
        body: file,
      });
      if (!up.ok) throw new Error(`Upload failed (${up.status})`);
      setValue("referenceImageUrl", presign.publicUrl, { shouldValidate: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reference upload failed");
    } finally {
      setRefUploading(false);
    }
  }

  async function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setError(null);
    try {
      const url = await uploadVideo(file);
      setValue("videoUrl", url, { shouldValidate: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setVideoFile(null);
    }
  }

  async function onSubmit(values: PromptFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/prompts"
          : `/api/admin/prompts/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Field label="Title" error={errors.title?.message}>
        <input
          {...register("title")}
          className={inputCls}
          placeholder="A short, punchy name"
        />
      </Field>

      <Field
        label="Video / preview"
        hint="MP4 up to 100 MB. Short, muted, looping. AVIF / JPEG / WEBP also OK as a poster."
        error={errors.videoUrl?.message}
      >
        <input
          {...register("videoUrl")}
          className={inputCls}
          placeholder="https://media.humanbetween.ai/videos/…"
        />
        <div className="flex items-center gap-3 mt-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-full glass text-xs cursor-pointer hover:bg-card/80">
            <Upload className="h-3.5 w-3.5" /> Upload to R2
            <input
              type="file"
              accept="video/mp4,video/webm,image/*"
              className="hidden"
              onChange={onVideoChange}
            />
          </label>
          {videoFile && (
            <span className="text-xs text-muted-foreground">{videoFile.name}</span>
          )}
        </div>
        {videoUrl && (
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {videoUrl}
          </p>
        )}
        {videoUrl && (
          <div className="mt-3">
            <AutoPlayMedia
              key={videoUrl}
              src={videoUrl}
              alt="Preview"
              aspectRatio="16 / 10"
              className="rounded-xl border border-border/40"
              sizes="(max-width: 640px) 100vw, 600px"
            />
          </div>
        )}
      </Field>

      <Field
        label="Reference image (optional)"
        hint="Small thumbnail shown on the prompt card and dialog — for the image / starting frame that needs to be uploaded to the AI tool along with the prompt. Leave empty to hide."
        error={errors.referenceImageUrl?.message}
      >
        <input
          {...register("referenceImageUrl")}
          className={inputCls}
          placeholder="https://media.humanbetween.ai/assets/…"
        />
        <div className="flex items-center gap-3 mt-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-full glass text-xs cursor-pointer hover:bg-card/80">
            {refUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Upload image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onReferenceChange}
            />
          </label>
          {referenceImageUrl && (
            <button
              type="button"
              onClick={() => setValue("referenceImageUrl", null, { shouldValidate: true })}
              className="text-[11px] text-muted-foreground hover:text-foreground underline"
            >
              Remove
            </button>
          )}
        </div>
        {referenceImageUrl && (
          <div className="mt-3 h-20 w-20 rounded-lg overflow-hidden border border-border/40 bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={referenceImageUrl}
              alt="Reference"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </Field>

      <Field label="Prompt text" error={errors.promptText?.message}>
        <textarea
          {...register("promptText")}
          rows={6}
          className={`${inputCls} font-mono text-xs`}
          placeholder="The actual prompt to copy."
        />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <textarea
          {...register("description")}
          rows={3}
          className={inputCls}
          placeholder="One or two sentences shown on the detail page."
        />
      </Field>

      <Field
        label="Visible on the public site"
        hint="Turn off to hide this prompt from the main library and search. Existing direct links also return 404 for non-admins."
      >
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...register("isPublished")}
            className="h-4 w-4"
          />
          <span className="text-muted-foreground">Published</span>
        </label>
      </Field>

      <Field
        label="Free for everyone"
        hint="When on, this prompt is accessible without an active subscription. Use for teasers."
      >
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("isFree")} className="h-4 w-4" />
          <span className="text-muted-foreground">
            Unlock without a subscription
          </span>
        </label>
      </Field>

      <Field label="Categories" error={errors.categories?.message as string}>
        <Controller
          control={control}
          name="categories"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((c) => {
                const on = field.value.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() =>
                      field.onChange(
                        on
                          ? field.value.filter((x: string) => x !== c.key)
                          : [...field.value, c.key],
                      )
                    }
                    className={
                      on
                        ? "px-3 py-1.5 rounded-full text-xs bg-foreground text-background"
                        : "px-3 py-1.5 rounded-full text-xs bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground"
                    }
                  >
                    {c.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => addCategoryInline(field.value, field.onChange)}
                disabled={addingCategory}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-card/40 border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-50"
              >
                {addingCategory ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Add new
              </button>
            </div>
          )}
        />
      </Field>

      <ChipsField
        label="Tags"
        values={tags}
        onChange={(v) => setValue("tags", v, { shouldValidate: true })}
        placeholder="editorial, cinematic, …"
      />

      <ChipsField
        label="Tools"
        values={tools}
        onChange={(v) => setValue("tools", v, { shouldValidate: true })}
        placeholder="Midjourney, Runway, Veo, …"
      />

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create prompt" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-input/40 border border-border/60 text-sm focus:outline-none focus:border-foreground/40";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function ChipsField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border/40 text-xs"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== t))}
              className="opacity-60 hover:opacity-100"
              aria-label={`Remove ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-full glass text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </Field>
  );
}
