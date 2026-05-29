"use client";

import { useRef, useState } from "react";
import Image from "next/image";
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
  sizes,
}: AutoPlayMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const isImage = IMAGE_RE.test(src);

  const containerRef = useLazyAutoplay<HTMLDivElement>((visible) => {
    setLoaded(true);
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
      className={`relative overflow-hidden bg-card ${className ?? ""}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {loaded &&
        (isImage ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
            className="object-cover"
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
        ))}
    </div>
  );
}
