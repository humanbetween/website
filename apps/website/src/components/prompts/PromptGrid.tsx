"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PromptCard } from "./PromptCard";
import { PromptDialog } from "./PromptDialog";
import { PromoCard } from "./PromoCard";
import type { PromptListResponse } from "@/lib/prompts/types";
import type { PromoCard as PromoCardData } from "@/lib/site-settings";

const GRID_CLASSES =
  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5";

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

export function PromptGrid({
  promo,
  hasUnlimited = false,
  favoriteIds = [],
  isSignedIn = false,
}: {
  promo?: PromoCardData;
  hasUnlimited?: boolean;
  favoriteIds?: string[];
  isSignedIn?: boolean;
}) {
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const params = useSearchParams();
  const query = new URLSearchParams(
    Object.entries({
      cat: params.get("cat") ?? "",
      sub: params.get("sub") ?? "",
      free: params.get("free") ?? "",
      fav: params.get("fav") ?? "",
      sort: params.get("sort") ?? "",
      q: params.get("q") ?? "",
    }).filter(([, v]) => v),
  ).toString();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["prompts", query],
      initialPageParam: null as string | null,
      queryFn: ({ pageParam }) => fetchPage({ pageParam, query }),
      getNextPageParam: (last) => last.nextCursor,
    });

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const openAt = useCallback(
    (index: number, promptId: string) => {
      setOpenIndex(index);
      fetch(`/api/prompts/${promptId}/click`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    },
    [],
  );

  // Keyboard navigation while the dialog is open
  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (openIndex === null) return;
      if (e.key === "ArrowLeft") {
        if (openIndex > 0) {
          e.preventDefault();
          setOpenIndex(openIndex - 1);
        }
      } else if (e.key === "ArrowRight") {
        if (openIndex < items.length - 1) {
          e.preventDefault();
          setOpenIndex(openIndex + 1);
        } else if (hasNextPage && !isFetchingNextPage) {
          e.preventDefault();
          fetchNextPage();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reset openIndex if filters change and current index falls out of range
  useEffect(() => {
    if (openIndex !== null && openIndex >= items.length) {
      setOpenIndex(null);
    }
  }, [items.length, openIndex]);

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

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/40 p-12 text-center text-sm text-muted-foreground">
        No prompts match your filters yet.
      </div>
    );
  }

  const openPrompt = openIndex !== null ? items[openIndex] : null;
  const promoEnabled = !!(promo && promo.active);
  const promoPos = promoEnabled
    ? Math.min(Math.max(promo!.position ?? 8, 0), items.length)
    : -1;

  return (
    <>
      <div className={GRID_CLASSES}>
        {items.map((p, i) => (
          <Fragment key={p.id}>
            {promoEnabled && i === promoPos && <PromoCard promo={promo!} />}
            <PromptCard
              prompt={p}
              onOpen={() => openAt(i, p.id)}
              hasUnlimited={hasUnlimited}
              isFavorited={favoriteSet.has(p.id)}
              isSignedIn={isSignedIn}
            />
          </Fragment>
        ))}
        {promoEnabled && promoPos >= items.length && <PromoCard promo={promo!} />}
      </div>
      <div ref={sentinelRef} className="h-12" />
      {isFetchingNextPage && (
        <p className="text-center text-xs text-muted-foreground py-4">
          Loading more…
        </p>
      )}
      {openPrompt && (
        <PromptDialog
          prompt={openPrompt}
          open={openIndex !== null}
          onOpenChange={(next) => {
            if (!next) setOpenIndex(null);
          }}
        />
      )}
    </>
  );
}

function GridSkeleton() {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-card/40 border border-border/40 animate-pulse aspect-[4/3]"
        />
      ))}
    </div>
  );
}
