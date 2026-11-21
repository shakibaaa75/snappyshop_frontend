"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  /**
   * Path in /public, e.g. "/hero/hero-deals.jpg". Landscape, subject on the
   * right. Used as the background when there is no video, and as the
   * placeholder / fallback while the video loads or if it fails.
   */
  image: string;
  /**
   * Optional background video: a full https URL (e.g. from Cloudinary) or a
   * path in /public. MP4 (H.264), no audio, ~1280x560, 5 to 10 s.
   */
  video?: string;
  /** One string per line of the big title. */
  title: string[];
  text: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}

/** Time each slide stays on screen. */
const AUTOPLAY_MS = 5500;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const swipeStart = useRef<number | null>(null);

  // Video state
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastIndex = useRef(-1);
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const go = useCallback(
    (i: number) => setIndex(((i % count) + count) % count),
    [count],
  );

  // Autoplay: a fresh timer starts after every slide change, so tapping a
  // dot or swiping never causes a double jump.
  const [paused, setPaused] = useState(false);
  const running = count > 1 && !paused && !reducedMotion && !tabHidden;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [running, index, count]);

  // Respect "reduce motion": show the still image instead of playing video.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Pause video while the browser tab is in the background (saves battery).
  useEffect(() => {
    const update = () => setTabHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // A video can finish loading BEFORE React attaches onLoadedData (server
  // rendered page). Without this check it would stay invisible (opacity-0).
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (v.error) setFailed((f) => (f[i] ? f : { ...f, [i]: true }));
      else if (v.readyState >= 2)
        setReady((r) => (r[i] ? r : { ...r, [i]: true }));
    });
  }, [slides]);

  // Only the visible slide plays. The others are paused.
  useEffect(() => {
    const changed = lastIndex.current !== index;
    lastIndex.current = index;
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index && !paused && !reducedMotion && !tabHidden) {
        // Restart from the beginning each time the slide comes back.
        if (changed) v.currentTime = 0;
        v.play().catch(() => {
          /* autoplay blocked: the image underneath stays visible */
        });
      } else {
        v.pause();
      }
    });
  }, [index, paused, reducedMotion, tabHidden]);

  if (count === 0) return null;

  const onPointerUp = (e: React.PointerEvent) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="relative overflow-hidden rounded-3xl bg-[#102950] dark:bg-[#0B0B0B]"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
    >
      {/* Sliding track */}
      <div
        aria-live={running ? "off" : "polite"}
        className="flex touch-pan-y motion-reduce:transition-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onPointerDown={(e) => {
          swipeStart.current = e.clientX;
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >
        {slides.map((s, i) => {
          const active = i === index;
          const showVideo = !!s.video && !reducedMotion && !failed[i];
          return (
            <div
              key={s.image + i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              // Off-screen slides can't be tabbed into or read twice.
              inert={!active}
              className="relative isolate flex min-h-[380px] w-full shrink-0 basis-full items-end md:min-h-[420px] md:items-center"
            >
              {/* Image: the background for image-only slides, and the
                  placeholder under the video until its first frame is ready. */}
              <Image
                src={s.image}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 1100px, 100vw"
                draggable={false}
                className="-z-20 select-none object-cover object-center"
              />

              {showVideo && (
                <video
                  ref={(el) => {
                    // React does not always write the muted attribute, and
                    // browsers refuse autoplay unless the video is muted.
                    if (el) el.muted = true;
                    videoRefs.current[i] = el;
                  }}
                  src={s.video}
                  muted
                  loop
                  playsInline
                  preload={i === 0 ? "auto" : "metadata"}
                  aria-hidden
                  tabIndex={-1}
                  onLoadedData={() => setReady((r) => ({ ...r, [i]: true }))}
                  onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                  className={cn(
                    "pointer-events-none absolute inset-0 -z-20 h-full w-full select-none object-cover object-center transition-opacity duration-500",
                    ready[i] ? "opacity-100" : "opacity-0",
                  )}
                />
              )}

              {/* Shade so the title stays readable. Video slides get a lighter,
                  directional shade so the footage still shows through:
                  phones fade up from the bottom (where the text and buttons
                  are), larger screens fade in from the left. */}
              <div
                aria-hidden
                className={cn(
                  "absolute inset-0 -z-10",
                  s.video && !failed[i] && !reducedMotion
                    ? "bg-gradient-to-t from-[#102950]/95 dark:from-[#0B0B0B]/95 via-[#102950]/60 dark:via-[#0B0B0B]/60 to-[#102950]/20 dark:to-[#0B0B0B]/20 md:bg-gradient-to-r md:from-[#102950]/90 dark:md:from-[#0B0B0B]/90 md:via-[#102950]/55 dark:md:via-[#0B0B0B]/55 md:to-transparent"
                    : "bg-[#102950]/80 dark:bg-[#0B0B0B]/80 md:bg-gradient-to-r md:from-[#102950] dark:md:from-[#0B0B0B] md:via-[#102950]/80 dark:md:via-[#0B0B0B]/80 md:to-[#102950]/10 dark:md:to-[#0B0B0B]/10",
                )}
              />
              {/* Soft vignette: keeps the corners calm and focuses the eye */}
              {s.video && !failed[i] && !reducedMotion && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.25)_100%)]"
                />
              )}

              <div className="w-full px-5 pb-20 pt-10 sm:px-8 md:px-12 md:pb-16">
                <div
                  className={cn(
                    "max-w-xl space-y-5 text-left transition-all duration-700 delay-150 motion-reduce:transition-none lg:max-w-2xl",
                    active
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0",
                  )}
                >
                  {/* Title: tight tracking, big and left aligned */}
                  <h2 className="text-balance text-[1.9rem] font-extrabold leading-[1.08] tracking-[-0.025em] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] sm:text-4xl lg:text-5xl xl:text-[3.5rem]">
                    {s.title.map((line, n) => (
                      <span key={n} className="block">
                        {line}
                      </span>
                    ))}
                  </h2>

                  <p className="max-w-md text-[0.95rem] leading-relaxed text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] md:text-base">
                    {s.text}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                      asChild
                      className="group h-11 rounded-full bg-[#0C68F6] px-6 text-sm font-semibold text-white shadow-lg shadow-black/25 hover:bg-[#0C68F6]/90"
                    >
                      <Link href={s.primary.href}>
                        {s.primary.label}
                        <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                      </Link>
                    </Button>
                    {s.secondary && (
                      <Button
                        asChild
                        variant="outline"
                        className="h-11 rounded-full border-white/40 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                      >
                        <Link href={s.secondary.href}>{s.secondary.label}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1 rounded-full bg-black/60 p-1 text-white">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="grid size-10 place-items-center rounded-full hover:bg-white/20"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-1 text-xs tabular-nums">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="grid size-10 place-items-center rounded-full hover:bg-white/20"
          >
            <ChevronRight size={18} />
          </button>
          {!reducedMotion && (
            <button
              type="button"
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              onClick={() => setPaused((value) => !value)}
              className="grid size-10 place-items-center rounded-full hover:bg-white/20"
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
