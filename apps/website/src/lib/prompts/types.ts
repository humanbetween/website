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

export type PromptRow = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  isFree: boolean;
  priceCents: number;
  categories: string[];
  tags: string[];
  tools: string[];
  popularityCount: number;
  createdAt: Date;
  promptText: string;
};

export function rowToListItem(p: PromptRow): PromptListItem {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    videoUrl: p.videoUrl,
    thumbnailUrl: p.thumbnailUrl,
    isFree: p.isFree,
    priceCents: p.priceCents,
    categories: p.categories as Category[],
    tags: p.tags,
    tools: p.tools,
    popularityCount: p.popularityCount,
    createdAt: p.createdAt.toISOString(),
    promptText: p.isFree ? p.promptText : null,
  };
}

export type PromptListResponse = {
  items: PromptListItem[];
  nextCursor: string | null;
};
