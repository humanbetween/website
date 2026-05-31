import { and, asc, desc, eq, gt, ilike, isNull, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
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
  freeOnly?: boolean;
  sort?: SortKey;
  search?: string | null;
  hasUnlimited?: boolean;
};

export async function listPrompts(args: ListPromptsArgs): Promise<PromptListResponse> {
  const sort: SortKey = args.sort ?? "recent";
  const cursor = decodeCursor(args.cursor ?? null);

  const wheres = [isNull(schema.prompts.deletedAt)];
  if (args.category) {
    wheres.push(sql`${schema.prompts.categories} @> ARRAY[${args.category}]::text[]`);
  }
  if (args.freeOnly) {
    wheres.push(eq(schema.prompts.isFree, true));
  }
  if (args.search && args.search.trim()) {
    const term = `%${args.search.trim()}%`;
    wheres.push(
      or(
        ilike(schema.prompts.title, term),
        sql`EXISTS (SELECT 1 FROM unnest(${schema.prompts.tags}) AS t WHERE t ILIKE ${term})`,
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

  const items: PromptListItem[] = page.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    videoUrl: r.videoUrl,
    thumbnailUrl: r.thumbnailUrl,
    isFree: r.isFree,
    priceCents: r.priceCents,
    categories: r.categories as Category[],
    tags: r.tags,
    tools: r.tools,
    popularityCount: r.popularityCount,
    favoriteCount: r.favoriteCount,
    createdAt: r.createdAt.toISOString(),
    promptText: r.isFree || args.hasUnlimited ? r.promptText : null,
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
        sql`${schema.prompts.categories} && ${sql.raw(`ARRAY[${categories.map((c) => `'${c}'`).join(",")}]::text[]`)}`,
      ),
    )
    .orderBy(desc(schema.prompts.popularityCount))
    .limit(limit);
}
