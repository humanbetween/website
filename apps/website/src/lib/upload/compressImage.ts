import { scaledDimensions, withExtension } from "./strategy";

const MAX_EDGE = 1600;
const QUALITY = 0.82;

/**
 * Re-encode an image to WebP at a sane max resolution. Returns the original
 * file untouched if the encode somehow produces a larger result (already
 * optimized inputs) or if WebP isn't supported.
 */
export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = scaledDimensions(
      bitmap.width,
      bitmap.height,
      MAX_EDGE,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], withExtension(file.name, "webp"), {
      type: "image/webp",
    });
  } finally {
    bitmap.close();
  }
}
