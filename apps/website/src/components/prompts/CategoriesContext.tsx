"use client";

import { createContext, useContext, useMemo } from "react";
import type { PromptCategory } from "@/lib/prompts/types";
import { DEFAULT_CATEGORIES } from "@/lib/prompts/types";

const CategoriesContext = createContext<PromptCategory[]>([...DEFAULT_CATEGORIES]);

export function CategoriesProvider({
  categories,
  children,
}: {
  categories: PromptCategory[];
  children: React.ReactNode;
}) {
  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}

export function useCategoryLabel(key: string | undefined | null) {
  const categories = useCategories();
  return useMemo(() => {
    if (!key) return undefined;
    return categories.find((c) => c.key === key)?.label ?? key;
  }, [key, categories]);
}
