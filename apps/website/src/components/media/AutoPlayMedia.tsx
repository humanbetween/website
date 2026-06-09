"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
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
  /**
   * When true (fit mode only), show a mute/unmute control. Video still
   * autoplays muted — browsers block autoplay with sound — and the viewer
   * clicks to hear it.
   */
  sound?: boolean;
};

export function AutoPlayMedia({
  src,
  poster,
  alt,
  aspectRatio,
  className,
  natural = false,
  fit = false,
  sound = false,
}: AutoPlayMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isImage = IMAGE_RE.test(src);
  const [muted, setMuted] = useState(true);

  // Reset to muted whenever the clip changes (e.g. arrow-key navigation).
  useEffect(() => {
    setMuted(true);
  }, [src]);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) v.play().catch(() => {});
    setMuted(v.muted);
  }

  const containerRef = useLazyAutoplay<HTMLDivElement>((visible) => {
    if (isImage || !videoRef.current) return;
    if (visible) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  });

  // When the src changes (e.g. arrow-key navigation in the dialog) the
  // <video> element is reused — IntersectionObserver doesn't fire again
  // because nothing entered the viewport, so we kickstart playback here.
  useEffect(() => {
    if (isImage || !videoRef.current) return;
    const v = videoRef.current;
    // React sets the `muted` attribute but not always the property; iOS/Chrome
    // only allow muted autoplay when the property is true. Force it here.
    v.muted = true;
    v.load();
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [src, isImage]);

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
            className="block h-full w-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={poster ?? undefined}
              autoPlay
              muted
              playsInline
              loop
              preload="metadata"
              aria-label={alt}
              className="block h-full w-full object-contain"
            />
            {sound && (
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="absolute bottom-3 right-3 h-9 w-9 inline-flex items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75 backdrop-blur-sm transition-colors"
              >
                {muted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            )}
          </>
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
            autoPlay
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
          autoPlay
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
