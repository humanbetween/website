import type { PromptListResponse } from "./types";

type ReadableParams = { get(key: string): string | null };

/**
 * Canonical query string for the prompt list, built in a FIXED key order so the
 * React Query key is identical whether it comes from the grid (reading
 * useSearchParams) or from a prefetch — otherwise the cache wouldn't hit.
 */
export function buildPromptsQuery(sp: ReadableParams): string {
  const out = new URLSearchParams();
  const cat = sp.get("cat");
  if (cat) out.set("cat", cat);
  const sub = sp.get("sub");
  if (sub) out.set("sub", sub);
  if (sp.get("free") === "1") out.set("free", "1");
  if (sp.get("fav") === "1") out.set("fav", "1");
  const sort = sp.get("sort");
  if (sort) out.set("sort", sort);
  const q = sp.get("q");
  if (q) out.set("q", q);
  return out.toString();
}

export async function fetchPromptsPage(
  query: string,
  cursor: string | null,
): Promise<PromptListResponse> {
  const sp = new URLSearchParams(query);
  if (cursor) sp.set("cursor", cursor);
  const res = await fetch(`/api/prompts?${sp.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch prompts");
  return res.json() as Promise<PromptListResponse>;
}

/** Shared infinite-query options so the grid and prefetchers stay in sync. */
export function promptsInfiniteOptions(query: string) {
  return {
    queryKey: ["prompts", query] as const,
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      fetchPromptsPage(query, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last: PromptListResponse) => last.nextCursor,
  };
}
