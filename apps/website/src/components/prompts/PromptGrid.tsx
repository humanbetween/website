"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PromptCard } from "./PromptCard";
import type { PromptListResponse } from "@/lib/prompts/types";

async function fetchPage({
  pageParam,
  query,
}: {
  pageParam: string | null;
  query: string;
}): Promise<PromptListResponse> {
  const sp = new URLSearchParams(query);
  if (pageParam) sp.set("cursor", pageParam);
  const res = await fetch(`/api/prompts?${sp.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch prompts");
  return res.json() as Promise<PromptListResponse>;
}

export function PromptGrid() {
  const params = useSearchParams();
  const cat = params.get("cat") ?? "";
  const free = params.get("free") ?? "";
  const sort = params.get("sort") ?? "";
  const q = params.get("q") ?? "";
  const query = new URLSearchParams(
    Object.entries({ cat, free, sort, q }).filter(([, v]) => v),
  ).toString();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["prompts", query],
      initialPageParam: null as string | null,
      queryFn: ({ pageParam }) => fetchPage({ pageParam, query }),
      getNextPageParam: (last) => last.nextCursor,
    });

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === "pending") {
    return <GridSkeleton />;
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-border/40 bg-card/40 p-8 text-center text-sm text-muted-foreground">
        Could not load prompts. Refresh the page.
      </div>
    );
  }

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/40 p-12 text-center text-sm text-muted-foreground">
        No prompts match your filters yet.
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5 [&>*]:mb-5 [&>*]:break-inside-avoid">
        {items.map((p) => (
          <PromptCard key={p.id} prompt={p} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-12" />
      {isFetchingNextPage && (
        <p className="text-center text-xs text-muted-foreground py-4">Loading more…</p>
      )}
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5 [&>*]:mb-5 [&>*]:break-inside-avoid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-card/40 border border-border/40 animate-pulse"
          style={{ height: 200 + ((i * 37) % 180) }}
        />
      ))}
    </div>
  );
}
