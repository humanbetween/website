import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
const bucket = process.env.R2_BUCKET ?? "humanbetween-prompts-media";
const publicUrl =
  process.env.R2_PUBLIC_URL ?? "https://media.humanbetween.ai";

export const r2 = new S3Client({
  region: "auto",
  endpoint: accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : "https://placeholder.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: accessKeyId || "placeholder",
    secretAccessKey: secretAccessKey || "placeholder",
  },
});

export const r2Config = { bucket, publicUrl };

export type UploadKind = "video" | "asset";

export async function makePresignedUpload({
  kind,
  contentType,
  size,
  filename,
}: {
  kind: UploadKind;
  contentType: string;
  size: number;
  filename: string;
}) {
  const ext = (filename.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();
  const safe = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .toLowerCase()
    .slice(0, 60);
  const id = crypto.randomUUID();
  const prefix = kind === "video" ? "videos" : "assets";
  const key = `${prefix}/${id}-${safe}${ext}`;

  const maxBytes = kind === "video" ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
  if (size > maxBytes) {
    throw new Error(
      `File too large: ${size} bytes (max ${maxBytes} for ${kind})`,
    );
  }

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );

  return {
    method: "PUT" as const,
    url,
    key,
    publicUrl: `${publicUrl}/${key}`,
    contentType,
    maxBytes,
    size,
  };
}

export function r2KeyToPublicUrl(key: string) {
  if (!key) return "";
  if (key.startsWith("http")) return key;
  return `${publicUrl}/${key.replace(/^\/+/, "")}`;
}
