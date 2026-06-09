import { and, asc, desc, eq, gt, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { slugify, UUID_RE } from "./slug";
import type { Category, PromptListItem, PromptListResponse, SortKey } from "./types";

const PAGE_SIZE = 24;

type Cursor =
  | { key: "popular"; popularity: number; createdAt: string; id: string }
  | { key: "recent"; createdAt: string; id: string };

function encodeCursor(c: Cursor) {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

function decodeCursor(raw: string | null): Cursor | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Cursor;
  } catch {
    return null;
  }
}

export type ListPromptsArgs = {
  cursor?: string | null;
  category?: Category | null;
  /** Narrow within a category. A prompt carries both its parent and sub keys. */
  subcategory?: Category | null;
  freeOnly?: boolean;
  sort?: SortKey;
  search?: string | null;
  hasUnlimited?: boolean;
  /** If set, only return prompts favorited by this user. */
  favoritesOfUserId?: string | null;
  /** Admin-only: when true, also include unpublished (hidden) prompts. */
  includeUnpublished?: boolean;
};

export async function getActiveCategoryKeys(): Promise<string[]> {
  try {
    const rows = await db
      .select({ categories: schema.prompts.categories })
      .from(schema.prompts)
      .where(
        and(
          isNull(schema.prompts.deletedAt),
          eq(schema.prompts.isPublished, true),
        ),
      );
    const set = new Set<string>();
    for (const r of rows) {
      for (const c of r.categories ?? []) set.add(c);
    }
    return Array.from(set);
  } catch (err) {
    console.error("getActiveCategoryKeys failed", err);
    return [];
  }
}

export async function listPrompts(args: ListPromptsArgs): Promise<PromptListResponse> {
  const sort: SortKey = args.sort ?? "recent";
  const cursor = decodeCursor(args.cursor ?? null);

  const wheres = [isNull(schema.prompts.deletedAt)];
  if (!args.includeUnpublished) {
    wheres.push(eq(schema.prompts.isPublished, true));
  }
  if (args.category) {
    wheres.push(sql`${schema.prompts.categories} @> ARRAY[${args.category}]::text[]`);
  }
  if (args.subcategory) {
    wheres.push(sql`${schema.prompts.categories} @> ARRAY[${args.subcategory}]::text[]`);
  }
  if (args.freeOnly) {
    wheres.push(eq(schema.prompts.isFree, true));
  }
  if (args.favoritesOfUserId) {
    wheres.push(
      sql`exists (select 1 from ${schema.favorites} where ${schema.favorites.promptId} = ${schema.prompts.id} and ${schema.favorites.userId} = ${args.favoritesOfUserId})`,
    );
  }
  if (args.search && args.search.trim()) {
    const term = `%${args.search.trim()}%`;
    wheres.push(
      or(
        ilike(schema.prompts.title, term),
        sql`EXISTS (SELECT 1 FROM unnest(${schema.prompts.tags}) AS t WHERE t ILIKE ${term})`,
        // Also match the creator's name so people can search a creator.
        sql`EXISTS (SELECT 1 FROM users u WHERE u.id = ${schema.prompts.createdByUserId} AND u.name ILIKE ${term})`,
      )!,
    );
  }

  if (cursor) {
    if (cursor.key === "popular" && sort === "popular") {
      wheres.push(
        or(
          lt(schema.prompts.popularityCount, cursor.popularity),
          and(
            eq(schema.prompts.popularityCount, cursor.popularity),
            lt(schema.prompts.createdAt, new Date(cursor.createdAt)),
          )!,
        )!,
      );
    } else if (cursor.key === "recent" && sort === "recent") {
      wheres.push(lt(schema.prompts.createdAt, new Date(cursor.createdAt)));
    }
  }

  const order =
    sort === "popular"
      ? [desc(schema.prompts.popularityCount), desc(schema.prompts.createdAt)]
      : [asc(schema.prompts.displayOrder), desc(schema.prompts.createdAt)];

  const rows = await db
    .select()
    .from(schema.prompts)
    .where(and(...wheres))
    .orderBy(...order)
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = page[page.length - 1];

  const nextCursor =
    hasMore && last
      ? sort === "popular"
        ? encodeCursor({
            key: "popular",
            popularity: last.popularityCount,
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : encodeCursor({
            key: "recent",
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
      : null;

  // Resolve creator names for creator-submitted prompts in one extra query.
  const creatorIds = [
    ...new Set(
      page.map((r) => r.createdByUserId).filter((x): x is string => !!x),
    ),
  ];
  const creatorNames = new Map<string, string | null>();
  if (creatorIds.length) {
    const us = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(inArray(schema.users.id, creatorIds));
    for (const u of us) creatorNames.set(u.id, u.name);
  }

  const items: PromptListItem[] = page.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    videoUrl: r.videoUrl,
    thumbnailUrl: r.thumbnailUrl,
    referenceImageUrl: r.referenceImageUrl,
    isFree: r.isFree,
    priceCents: r.priceCents,
    categories: r.categories as Category[],
    tags: r.tags,
    tools: r.tools,
    popularityCount: r.popularityCount,
    favoriteCount: r.favoriteCount,
    isPublished: r.isPublished,
    createdAt: r.createdAt.toISOString(),
    promptText: r.isFree || args.hasUnlimited ? r.promptText : null,
    websiteUrl: r.isFree || args.hasUnlimited ? r.websiteUrl : null,
    hasWebsite: !!r.websiteUrl,
    creatorName: r.createdByUserId
      ? creatorNames.get(r.createdByUserId) ?? null
      : null,
  }));

  return { items, nextCursor };
}

export async function getPromptById(id: string) {
  const rows = await db
    .select()
    .from(schema.prompts)
    .where(and(eq(schema.prompts.id, id), isNull(schema.prompts.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

// Resolve a /?prompt=<ref> value — either a UUID or a title slug — to a prompt.
export async function resolvePromptRef(ref: string) {
  if (UUID_RE.test(ref)) return getPromptById(ref);
  const rows = await db
    .select({ id: schema.prompts.id, title: schema.prompts.title })
    .from(schema.prompts)
    .where(isNull(schema.prompts.deletedAt));
  const match = rows.find((r) => slugify(r.title) === ref);
  return match ? getPromptById(match.id) : null;
}

export async function incrementPopularity(id: string) {
  await db
    .update(schema.prompts)
    .set({ popularityCount: sql`${schema.prompts.popularityCount} + 1` })
    .where(eq(schema.prompts.id, id));
}

export async function getSimilarPrompts(promptId: string, categories: string[], limit = 4) {
  if (categories.length === 0) return [];
  return db
    .select()
    .from(schema.prompts)
    .where(
      and(
        isNull(schema.prompts.deletedAt),
        sql`${schema.prompts.id} <> ${promptId}`,
        sql`${schema.prompts.categories} && ARRAY[${sql.join(
          categories.map((c) => sql`${c}`),
          sql`, `,
        )}]::text[]`,
      ),
    )
    .orderBy(desc(schema.prompts.popularityCount))
    .limit(limit);
}
