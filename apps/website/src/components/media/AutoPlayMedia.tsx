"use client";

import { useRef } from "react";
import { useLazyAutoplay } from "@/lib/lazy-autoplay";

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)(\?|$)/i;

export type AutoPlayMediaProps = {
  src: string;
  poster?: string | null;
  alt: string;
  aspectRatio?: string;
  className?: string;
  sizes?: string;
};

export function AutoPlayMedia({
  src,
  poster,
  alt,
  aspectRatio,
  className,
}: AutoPlayMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isImage = IMAGE_RE.test(src);

  const containerRef = useLazyAutoplay<HTMLDivElement>((visible) => {
    if (isImage || !videoRef.current) return;
    if (visible) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-card ${className ?? ""}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {isImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src={src}
          poster={poster ?? undefined}
          muted
          playsInline
          loop
          preload="metadata"
          aria-label={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
