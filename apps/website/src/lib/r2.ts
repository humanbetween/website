import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

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

  const { url, fields } = await createPresignedPost(r2, {
    Bucket: bucket,
    Key: key,
    Conditions: [
      ["content-length-range", 0, maxBytes],
      ["starts-with", "$Content-Type", contentType.split("/")[0] ?? ""],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 300,
  });

  return {
    url,
    fields,
    key,
    publicUrl: `${publicUrl}/${key}`,
    maxBytes,
    size,
  };
}

export function r2KeyToPublicUrl(key: string) {
  if (!key) return "";
  if (key.startsWith("http")) return key;
  return `${publicUrl}/${key.replace(/^\/+/, "")}`;
}
