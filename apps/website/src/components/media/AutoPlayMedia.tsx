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
  /**
   * When true, the media renders at its natural aspect ratio (block
   * w-full h-auto) instead of being cropped to fill a fixed-ratio
   * container. Use for places where the viewer should see the whole
   * asset and scroll if needed.
   */
  natural?: boolean;
  /**
   * When true, the media is centered inside the container and scaled to
   * fit using object-contain. Combined with a max-height on the parent
   * this lets vertical (9:16) and horizontal (16:9) assets coexist in
   * the same slot without cropping or layout jumps.
   */
  fit?: boolean;
};

export function AutoPlayMedia({
  src,
  poster,
  alt,
  aspectRatio,
  className,
  natural = false,
  fit = false,
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

  if (fit) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full flex items-center justify-center bg-black ${className ?? ""}`}
      >
        {isImage ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="block max-h-full max-w-full w-auto h-auto object-contain"
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
            className="block max-h-full max-w-full w-auto h-auto object-contain"
          />
        )}
      </div>
    );
  }

  if (natural) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full bg-card ${className ?? ""}`}
      >
        {isImage ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="block w-full h-auto"
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
            className="block w-full h-auto"
          />
        )}
      </div>
    );
  }

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
