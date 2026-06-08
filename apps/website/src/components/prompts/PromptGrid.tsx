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
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { PromptCard } from "./PromptCard";
import { PromptDialog } from "./PromptDialog";
import { PromoCard } from "./PromoCard";
import {
  buildPromptsQuery,
  promptsInfiniteOptions,
} from "@/lib/prompts/promptsQuery";
import { slugify } from "@/lib/prompts/slug";
import type { PromptListItem } from "@/lib/prompts/types";
import type { PromoCard as PromoCardData } from "@/lib/site-settings";

const GRID_CLASSES =
  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5";

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
  const query = buildPromptsQuery(params);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      ...promptsInfiniteOptions(query),
      // Keep the previous category's grid on screen while the next one loads —
      // no skeleton flash, the swap feels instant.
      placeholderData: keepPreviousData,
    });

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  // The open prompt is driven by the ?prompt=<slug> URL param so it's shareable
  // and the browser back button just works. The ref is a readable title slug;
  // we still accept a raw UUID for backward-compatible links.
  const activeRef = params.get("prompt");
  const matchesRef = useCallback(
    (p: PromptListItem) =>
      !!activeRef && (slugify(p.title) === activeRef || p.id === activeRef),
    [activeRef],
  );
  const activeIndex = activeRef ? items.findIndex(matchesRef) : -1;
  const [deepLinked, setDeepLinked] = useState<PromptListItem | null>(null);

  // A shared/deep link may point at a prompt that isn't in the loaded grid —
  // fetch it on demand (the API resolves slug or UUID) so the dialog can still
  // open.
  useEffect(() => {
    if (!activeRef || items.some(matchesRef)) return;
    let active = true;
    fetch(`/api/prompts/${activeRef}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PromptListItem | null) => {
        if (!active || !d) return;
        setDeepLinked(d);
        fetch(`/api/prompts/${d.id}/click`, {
          method: "POST",
          keepalive: true,
        }).catch(() => {});
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeRef, items, matchesRef]);

  const setPromptUrl = useCallback(
    (ref: string | null, mode: "push" | "replace") => {
      const sp = new URLSearchParams(window.location.search);
      if (ref) sp.set("prompt", ref);
      else sp.delete("prompt");
      const qs = sp.toString();
      const url = qs ? `/?${qs}` : "/";
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [],
  );

  const openItem = useCallback(
    (p: PromptListItem) => {
      setPromptUrl(slugify(p.title), "push");
      fetch(`/api/prompts/${p.id}/click`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    },
    [setPromptUrl],
  );

  const closePrompt = useCallback(() => {
    setPromptUrl(null, "replace");
  }, [setPromptUrl]);

  const goPrev = useCallback(() => {
    if (activeIndex > 0)
      setPromptUrl(slugify(items[activeIndex - 1]!.title), "replace");
  }, [activeIndex, items, setPromptUrl]);

  const goNext = useCallback(() => {
    if (activeIndex < 0) return;
    if (activeIndex < items.length - 1)
      setPromptUrl(slugify(items[activeIndex + 1]!.title), "replace");
    else if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [
    activeIndex,
    items,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    setPromptUrl,
  ]);

  const openPrompt =
    activeIndex >= 0
      ? items[activeIndex]
      : deepLinked && matchesRef(deepLinked)
        ? deepLinked
        : null;

  // Keyboard navigation while the dialog is open (desktop)
  useEffect(() => {
    if (!openPrompt) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPrompt, goPrev, goNext]);

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
              onOpen={() => openItem(p)}
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
          open
          onOpenChange={(next) => {
            if (!next) closePrompt();
          }}
          onPrev={goPrev}
          onNext={goNext}
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
