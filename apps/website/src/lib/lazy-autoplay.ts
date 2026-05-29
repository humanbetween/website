"use client";

import { useEffect, useRef } from "react";

let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, (visible: boolean) => void>();

function getObserver() {
  if (typeof window === "undefined") return null;
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const cb = callbacks.get(entry.target);
        if (cb) cb(entry.isIntersecting);
      }
    },
    { rootMargin: "200px 0px", threshold: 0.01 },
  );
  return observer;
}

export function useLazyAutoplay<T extends HTMLElement>(
  onVisibilityChange: (visible: boolean) => void,
) {
  const ref = useRef<T | null>(null);
  const cbRef = useRef(onVisibilityChange);
  cbRef.current = onVisibilityChange;

  useEffect(() => {
    const node = ref.current;
    const io = getObserver();
    if (!node || !io) return;
    callbacks.set(node, (visible) => cbRef.current(visible));
    io.observe(node);
    return () => {
      io.unobserve(node);
      callbacks.delete(node);
    };
  }, []);

  return ref;
}
