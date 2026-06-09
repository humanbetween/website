"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  /**
   * When true, begin with sound ON (best effort — opening a dialog is a user
   * gesture, so most browsers allow it; falls back to muted if blocked). The
   * choice persists across src changes (arrow navigation).
   */
  startUnmuted?: boolean;
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
  startUnmuted = false,
}: AutoPlayMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isImage = IMAGE_RE.test(src);
  const [muted, setMuted] = useState(() => !startUnmuted);
  // Latest muted value for callbacks (IntersectionObserver) that close over it.
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // Play honoring the current mute choice. If unmuted autoplay is blocked,
  // fall back to muted so the clip still plays.
  const play = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = mutedRef.current;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        if (!v.muted) {
          v.muted = true;
          mutedRef.current = true;
          setMuted(true);
          v.play().catch(() => {});
        }
      });
    }
  }, []);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) v.play().catch(() => {});
    setMuted(v.muted);
  }

  const containerRef = useLazyAutoplay<HTMLDivElement>((visible) => {
    if (isImage || !videoRef.current) return;
    if (visible) play();
    else videoRef.current.pause();
  });

  // When the src changes (e.g. arrow-key navigation in the dialog) the <video>
  // is reused — IntersectionObserver doesn't fire again, so kickstart here.
  // The mute choice is preserved across changes (no reset), so sound stays on.
  useEffect(() => {
    if (isImage || !videoRef.current) return;
    videoRef.current.load();
    play();
  }, [src, isImage, play]);

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
      className={`group/snd relative w-full overflow-hidden bg-card ${className ?? ""}`}
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
      {sound && !isImage && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Sound available — tap to unmute" : "Mute"}
          className="absolute top-2 left-2 h-7 w-7 inline-flex items-center justify-center rounded-full bg-black/45 text-white/90 hover:bg-black/70 backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover/snd:opacity-100 transition-opacity"
        >
          {muted ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
