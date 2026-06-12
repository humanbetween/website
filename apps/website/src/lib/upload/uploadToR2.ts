import { compressImage } from "./compressImage";
import { compressVideo } from "./compressVideo";
import { planFor, presignKindFor } from "./strategy";

export type UploadResult = {
  url: string;
  originalSize: number;
  finalSize: number;
};

type PresignResponse = {
  method: "PUT";
  url: string;
  publicUrl: string;
  contentType: string;
};

export type UploadOptions = {
  /** Receives 0..1 transcode progress for videos. */
  onProgress?: (ratio: number) => void;
};

/**
 * Single entry point for admin media uploads: compress (image→WebP,
 * video→720p H.264) then PUT the result to R2 via a presigned URL. Throws on
 * compression or upload failure so the caller never ships a heavy original.
 */
export async function uploadToR2(
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const plan = planFor(file.type);
  let processed = file;
  if (plan === "video") {
    processed = await compressVideo(file, options.onProgress);
  } else if (plan === "image-webp") {
    processed = await compressImage(file);
  }

  const kind = presignKindFor(processed.type);
  const presignRes = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      contentType: processed.type || "application/octet-stream",
      size: processed.size,
      filename: processed.name,
    }),
  });
  if (!presignRes.ok) {
    const body = await presignRes.json().catch(() => ({}));
    throw new Error(body.error ?? "Could not get upload URL");
  }
  const presign = (await presignRes.json()) as PresignResponse;

  const put = await fetch(presign.url, {
    method: "PUT",
    headers: { "Content-Type": presign.contentType },
    body: processed,
  });
  if (!put.ok) {
    throw new Error(`Upload failed (${put.status} ${put.statusText})`);
  }

  return {
    url: presign.publicUrl,
    originalSize: file.size,
    finalSize: processed.size,
  };
}
