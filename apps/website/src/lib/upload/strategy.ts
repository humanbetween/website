// Pure helpers for the client-side upload pipeline. No browser APIs here so the
// logic stays trivially reviewable and reusable across compress modules.

export type PresignKind = "video" | "asset";

export type Plan = "video" | "image-webp" | "passthrough";

/** Decide how a file should be processed based on its MIME type. */
export function planFor(mimeType: string): Plan {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "image/svg+xml") return "passthrough";
  if (mimeType === "image/gif") return "passthrough"; // keep animation
  if (mimeType.startsWith("image/")) return "image-webp";
  return "passthrough";
}

/** Which R2 prefix/limit the presign endpoint should use for a processed file. */
export function presignKindFor(mimeType: string): PresignKind {
  return mimeType.startsWith("video/") ? "video" : "asset";
}

/**
 * Scale dimensions to fit within `maxEdge` on the longest side without
 * upscaling, rounding to even numbers (libx264 + WebP encoders prefer them).
 */
export function scaledDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  const ratio = longest > maxEdge ? maxEdge / longest : 1;
  const even = (n: number) => Math.max(2, Math.round((n * ratio) / 2) * 2);
  return { width: even(width), height: even(height) };
}

/** ffmpeg argv for a 720p, fast-start H.264 transcode that keeps audio (AAC
 * 128k). Whether the sound actually plays is a per-product toggle in the UI. */
export function videoFfmpegArgs(input: string, output: string): string[] {
  return [
    "-i",
    input,
    "-vf",
    "scale='min(1280,iw)':-2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "26",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    "-pix_fmt",
    "yuv420p",
    output,
  ];
}

/** Swap a filename's extension, keeping a safe stem. */
export function withExtension(filename: string, ext: string): string {
  const stem = filename.replace(/\.[^.]+$/, "") || "file";
  return `${stem}.${ext.replace(/^\./, "")}`;
}

export function readableBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
