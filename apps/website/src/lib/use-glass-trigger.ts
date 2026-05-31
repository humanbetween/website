"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the sticky header should become "glass" (backdrop blur +
 * tinted background).
 *
 * On pages that render the prompt filter bar (marked with `data-filter-bar`),
 * the trigger fires once that bar reaches its sticky position — so the header
 * and the filters bar transition together. On pages without a filter bar
 * (e.g. /pricing), it falls back to a small scroll threshold so the header
 * still gets a backdrop once the user scrolls.
 */
export function useGlassTrigger() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    function check() {
      const filterBar = document.querySelector<HTMLElement>("[data-filter-bar]");
      if (filterBar) {
        const rect = filterBar.getBoundingClientRect();
        setActive(rect.top <= 64);
      } else {
        setActive(window.scrollY > 32);
      }
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return active;
}
