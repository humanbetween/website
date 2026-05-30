"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search } from "lucide-react";
import type { SortKey } from "@/lib/prompts/types";
import { useCategories } from "./CategoriesContext";

export function PromptFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const categories = useCategories();

  const activeCat = params.get("cat");
  const freeOnly = params.get("free") === "1";
  const sort = (params.get("sort") as SortKey) ?? "recent";
  const search = params.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(search);

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

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    push((sp) => {
      if (searchDraft.trim()) sp.set("q", searchDraft.trim());
      else sp.delete("q");
    });
  }

  return (
    <div className="sticky top-16 z-40 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 backdrop-blur-md bg-background/70 border-b border-border/40">
      <div className="container mx-auto max-w-7xl flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={chip(activeCat === null)}
        >
          All
        </button>
        {categories.map((c) => (
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
