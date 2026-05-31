import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().min(1).max(500),
  sizeBytes: z.number().int().min(0),
  type: z.string().max(80),
});

const categoryKey = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[A-Z0-9_]+$/, "Category keys are UPPERCASE_WITH_UNDERSCORES only");

export const promptFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  promptText: z.string().min(1).max(20_000),
  priceCents: z.number().int().min(0).max(100_000),
  isFree: z.boolean(),
  videoUrl: z.string().min(1),
  thumbnailUrl: z.string().nullable(),
  referenceImageUrl: z.string().nullable(),
  isPublished: z.boolean(),
  assets: z.array(assetSchema),
  categories: z.array(categoryKey).min(1).max(10),
  tags: z.array(z.string().max(40)).max(20),
  tools: z.array(z.string().max(40)).max(20),
});

export type PromptFormValues = z.infer<typeof promptFormSchema>;

export const promptPatchSchema = promptFormSchema.partial();

export const uploadUrlSchema = z.object({
  kind: z.enum(["video", "asset"]),
  contentType: z.string().min(3).max(120),
  size: z.number().int().min(1).max(100 * 1024 * 1024),
  filename: z.string().min(1).max(200),
});
