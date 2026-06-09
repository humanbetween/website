export type PromptCategory = {
  key: string;
  label: string;
  /** When set, this is a subcategory nested under the category with this key. */
  parent?: string;
};

/** Top-level categories (no parent). */
export function topLevel(cats: readonly PromptCategory[]): PromptCategory[] {
  return cats.filter((c) => !c.parent);
}

/** Subcategories of a given parent, in list order. */
export function subsOf(
  cats: readonly PromptCategory[],
  parentKey: string,
): PromptCategory[] {
  return cats.filter((c) => c.parent === parentKey);
}

export const DEFAULT_CATEGORIES: readonly PromptCategory[] = [
  { key: "IMAGE", label: "Image" },
  { key: "VIDEO", label: "Video" },
  { key: "WEBSITE", label: "Website" },
  { key: "SKILLS", label: "Skills" },
  { key: "TOOL", label: "Tool" },
  { key: "PRESENTATION", label: "Presentation" },
] as const;

/**
 * Default category keys. Use this when the live category list is not
 * available (server-side fallback, type literals). For UI labelling
 * always prefer `useCategories()` from CategoriesContext to support
 * admin-added categories.
 */
export const DEFAULT_CATEGORY_KEYS = DEFAULT_CATEGORIES.map((c) => c.key);

/**
 * Loose type — categories are dynamic strings now. The DEFAULT_CATEGORY_KEYS
 * are the canonical seeds but admins can add their own.
 */
export type Category = string;

/**
 * Static fallback label map for SSR / server components that can't access
 * the dynamic context. Covers the defaults.
 */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.key, c.label]),
);

export type SortKey = "popular" | "recent";

export type PromptListItem = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  referenceImageUrl: string | null;
  isFree: boolean;
  priceCents: number;
  categories: Category[];
  tags: string[];
  tools: string[];
  popularityCount: number;
  favoriteCount: number;
  isPublished: boolean;
  createdAt: string;
  // Only sent when is_free === true. For paid prompts, fetched on demand
  // by the dialog through /api/prompts/[id], which applies access gating.
  promptText: string | null;
  // Same gating as promptText. `hasWebsite` is always present so the UI can
  // show a (locked) "Visit website" affordance even when the URL is withheld.
  websiteUrl: string | null;
  hasWebsite: boolean;
  // Set only for creator-submitted prompts — shown as "by <name>" on the card.
  creatorName: string | null;
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
  referenceImageUrl: string | null;
  isFree: boolean;
  priceCents: number;
  categories: string[];
  tags: string[];
  tools: string[];
  popularityCount: number;
  favoriteCount: number;
  isPublished: boolean;
  createdAt: Date;
  promptText: string | null;
  websiteUrl: string | null;
};

export function rowToListItem(p: PromptRow): PromptListItem {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    videoUrl: p.videoUrl,
    thumbnailUrl: p.thumbnailUrl,
    referenceImageUrl: p.referenceImageUrl,
    isFree: p.isFree,
    priceCents: p.priceCents,
    categories: p.categories,
    tags: p.tags,
    tools: p.tools,
    popularityCount: p.popularityCount,
    favoriteCount: p.favoriteCount,
    isPublished: p.isPublished,
    createdAt: p.createdAt.toISOString(),
    promptText: p.isFree ? p.promptText : null,
    websiteUrl: p.isFree ? p.websiteUrl : null,
    hasWebsite: !!p.websiteUrl,
    creatorName: null,
  };
}

export type PromptListResponse = {
  items: PromptListItem[];
  nextCursor: string | null;
};
