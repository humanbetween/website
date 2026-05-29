export const CATEGORIES = [
  "IMAGE",
  "VIDEO",
  "WEBSITE",
  "BACKGROUND",
  "TOOL",
  "PRESENTATION",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  IMAGE: "Image",
  VIDEO: "Video",
  WEBSITE: "Website",
  BACKGROUND: "Background",
  TOOL: "Tool",
  PRESENTATION: "Presentation",
};

export type SortKey = "popular" | "recent";

export type PromptListItem = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  isFree: boolean;
  priceCents: number;
  categories: Category[];
  tags: string[];
  tools: string[];
  popularityCount: number;
  createdAt: string;
  // Only sent when is_free === true. For paid prompts, fetched on demand
  // by the dialog through /api/prompts/[id], which applies access gating.
  promptText: string | null;
};

export type PromptDetail = PromptListItem & {
  canAccess: boolean;
};

export type PromptListResponse = {
  items: PromptListItem[];
  nextCursor: string | null;
};
