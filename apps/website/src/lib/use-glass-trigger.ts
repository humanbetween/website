"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Detects whether the sticky header should become "glass" (backdrop blur +
 * tinted background).
 *
 * Strategy:
 * - On pages that render the prompt filter bar (marked with
 *   `data-filter-bar`), we measure its natural document position once
 *   (before it gets pinned). Glass kicks in only once the user has
 *   scrolled at least `EXTRA_PX` *past* the point where pinning happens.
 *   This stops the tinted band from showing the very instant the bar
 *   reaches the header.
 * - On pages without a filter bar (e.g. /pricing), it falls back to a
 *   simple scroll threshold so the header still gets a backdrop.
 */
const HEADER_HEIGHT = 64; // matches top-16 sticky offset
const EXTRA_PX = 0; // fire as soon as the bar reaches its sticky slot

export function useGlassTrigger() {
  const [active, setActive] = useState(false);
  const naturalTopRef = useRef<number | null>(null);

  useEffect(() => {
    function check() {
      const filterBar = document.querySelector<HTMLElement>("[data-filter-bar]");
      if (!filterBar) {
        setActive(window.scrollY > 32);
        return;
      }

      // Capture the bar's natural document position the first time we see
      // it before pinning. After that we always use the cached value.
      if (naturalTopRef.current === null) {
        const rect = filterBar.getBoundingClientRect();
        if (rect.top > HEADER_HEIGHT) {
          naturalTopRef.current = rect.top + window.scrollY;
        }
      }

      if (naturalTopRef.current === null) {
        // Bar was already pinned on mount — fall back to a sane scroll
        // threshold so we don't trigger immediately.
        setActive(window.scrollY > 500);
        return;
      }

      const pinAtScroll = naturalTopRef.current - HEADER_HEIGHT;
      setActive(window.scrollY > pinAtScroll + EXTRA_PX);
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
