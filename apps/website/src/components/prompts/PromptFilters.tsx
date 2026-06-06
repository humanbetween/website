"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Heart, Search } from "lucide-react";
import { toast } from "sonner";
import { type SortKey, topLevel, subsOf } from "@/lib/prompts/types";
import { authClient } from "@/lib/auth-client";
import { useGlassTrigger } from "@/lib/use-glass-trigger";
import { useCategories } from "./CategoriesContext";

export function PromptFilters({
  activeCategoryKeys = [],
}: {
  activeCategoryKeys?: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const categories = useCategories();
  const activeSet = new Set(activeCategoryKeys);
  const { data: session } = authClient.useSession();
  const signedIn = !!session?.user;
  const pinned = useGlassTrigger();

  const activeCat = params.get("cat");
  const activeSub = params.get("sub");
  const parents = topLevel(categories);
  const activeParentSubs = activeCat
    ? subsOf(categories, activeCat).filter((s) => activeSet.has(s.key))
    : [];
  const freeOnly = params.get("free") === "1";
  const favoritesOnly = params.get("fav") === "1";
  const sort = (params.get("sort") as SortKey) ?? "recent";
  const search = params.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(search);

  // If the currently selected category no longer has any prompts, drop it
  // from the URL so the filter chip disappears and we don't show an empty grid.
  useEffect(() => {
    if (activeCat && !activeSet.has(activeCat)) {
      const sp = new URLSearchParams(params.toString());
      sp.delete("cat");
      startTransition(() => {
        router.replace(`/?${sp.toString()}`, { scroll: false });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat, activeCategoryKeys.join("|")]);

  // Drop a subcategory filter once it has no prompts left.
  useEffect(() => {
    if (activeSub && !activeSet.has(activeSub)) {
      const sp = new URLSearchParams(params.toString());
      sp.delete("sub");
      startTransition(() => {
        router.replace(`/?${sp.toString()}`, { scroll: false });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSub, activeCategoryKeys.join("|")]);

  const push = useCallback(
    (mut: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(params.toString());
      mut(sp);
      startTransition(() => {
        router.replace(`/?${sp.toString()}`, { scroll: false });
      });
    },
    [params, router],
  );

  function setCategory(cat: string | null) {
    push((sp) => {
      if (cat) sp.set("cat", cat);
      else sp.delete("cat");
      sp.delete("sub"); // changing the parent always clears the subfilter
    });
  }

  function setSubcat(sub: string | null) {
    push((sp) => {
      if (sub) sp.set("sub", sub);
      else sp.delete("sub");
    });
  }

  function toggleFree() {
    push((sp) => {
      if (freeOnly) sp.delete("free");
      else sp.set("free", "1");
    });
  }

  function setSort(next: SortKey) {
    push((sp) => sp.set("sort", next));
  }

  function toggleFavoritesOnly() {
    if (!signedIn) {
      toast("Sign in to filter by favorites.");
      router.push("/auth/sign-in?redirect=/");
      return;
    }
    push((sp) => {
      if (favoritesOnly) sp.delete("fav");
      else sp.set("fav", "1");
    });
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    push((sp) => {
      if (searchDraft.trim()) sp.set("q", searchDraft.trim());
      else sp.delete("q");
    });
  }

  return (
    <div
      data-filter-bar
      className={
        "sticky top-16 z-40 py-3 transition-colors duration-200 " +
        (pinned
          ? "backdrop-blur-md bg-background/70 border-b border-border/30"
          : "bg-transparent border-b border-transparent")
      }
    >
      <div className="container mx-auto max-w-[1440px] px-5 sm:px-6 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={chip(activeCat === null)}
        >
          All
        </button>
        {parents
          .filter((c) => activeSet.has(c.key))
          .map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key === activeCat ? null : c.key)}
              className={chip(c.key === activeCat)}
            >
              {c.label}
            </button>
          ))}

        <span className="hidden sm:inline-block w-px h-5 bg-border/60 mx-1" />

        <button type="button" onClick={toggleFree} className={chip(freeOnly)}>
          Free only
        </button>

        <span className="hidden sm:inline-block w-px h-5 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() => setSort("recent")}
          className={chip(sort === "recent")}
        >
          Recent
        </button>
        <button
          type="button"
          onClick={() => setSort("popular")}
          className={chip(sort === "popular")}
        >
          Popular
        </button>

        <span className="hidden sm:inline-block w-px h-5 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={toggleFavoritesOnly}
          aria-pressed={favoritesOnly}
          className={chip(favoritesOnly) + " inline-flex items-center gap-1.5"}
          title={signedIn ? "Show only favorited prompts" : "Sign in to see favorites"}
        >
          <Heart
            className={
              "h-3 w-3 " + (favoritesOnly ? "fill-current" : "")
            }
          />
          Favorites
        </button>

        <form onSubmit={applySearch} className="ml-auto relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search prompts"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full bg-card/60 border border-border/60 focus:outline-none focus:border-foreground/40"
          />
        </form>
        </div>

        {activeParentSubs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSubcat(null)}
              className={chip(activeSub === null)}
            >
              All
            </button>
            {activeParentSubs.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSubcat(s.key === activeSub ? null : s.key)}
                className={chip(s.key === activeSub)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function chip(active: boolean) {
  const base =
    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap";
  return active
    ? `${base} bg-foreground text-background border-foreground`
    : `${base} bg-card/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-card/80`;
}
