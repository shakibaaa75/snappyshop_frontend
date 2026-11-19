"use client";

import { type HomeSection } from "@/lib/store-design/types";
import { galleryImagePosition } from "@/lib/store-design/template-gallery";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Block, Link } from "./blocks";
import { CAT_FADE } from "./category-tiles";
import { useGalleryAutoScroll } from "./gallery-autoscroll";
import { DUO_DEMO } from "./gallery-duo";
import { muted } from "./tokens";
import { type Ctx } from "./types";

/**
 * Yokai coverflow: a centered heading, then tall 3:5 photos in a snapping row.
 * The card in the middle is full size, the others sit back a little.
 */
export function Coverflow({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, mobile, interactive } = ctx;
  /* A tile with only a caption or a color still shows, so a gallery that has
     been started never looks empty. */
  const real = d.galleryItems.filter((g) => g.imageUrl || g.caption || g.color);
  const demo = !interactive && real.length === 0;
  const items = demo ? DUO_DEMO : real;
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useGalleryAutoScroll(
    ref,
    !!d.galleryAutoScroll && items.length > 1,
    d.galleryScrollSpeed,
    String(items.length),
  );

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((node, i) => {
      const c = node as HTMLElement;
      const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  }, []);

  const goTo = useCallback((i: number) => {
    const el = ref.current;
    const c = el?.children[i] as HTMLElement | undefined;
    if (!el || !c) return;
    el.scrollTo({
      left: c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync, items.length, mobile]);

  if (items.length === 0) return null;
  /* Container-query units, so the card width and the centering padding use
     the same full width (a % width would shrink by the padding). */
  const cardW = mobile ? "64cqw" : "21cqw";
  const arrow =
    "flex h-9 w-9 items-center justify-center border transition-opacity disabled:opacity-30";
  const arrowStyle: CSSProperties = {
    borderColor: "var(--s-border)",
    color: "var(--s-text)",
  };

  return (
    <Block ctx={ctx}>
      <div className="@container">
        <div className="relative mb-6 text-center">
          <h2 className="font-bold uppercase leading-tight tracking-[0.04em]">
            {section.title || "Shop your world"}
          </h2>
          {d.gallerySubtitle && (
            <p className="mx-auto mt-2 max-w-xl text-sm" style={muted}>
              {d.gallerySubtitle}
            </p>
          )}
          {!mobile && items.length > 1 && (
            <div className="absolute bottom-0 right-0 flex gap-1.5">
              <button
                type="button"
                aria-label="Previous"
                disabled={active === 0}
                onClick={() => goTo(active - 1)}
                className={arrow}
                style={arrowStyle}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next"
                disabled={active >= items.length - 1}
                onClick={() => goTo(active + 1)}
                className={arrow}
                style={arrowStyle}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <div
          ref={ref}
          onScroll={sync}
          className="no-scrollbar flex snap-x snap-mandatory items-center overflow-x-auto py-3 [-webkit-overflow-scrolling:touch]"
          style={{
            gap: mobile ? 12 : 20,
            paddingInline: `calc((100cqw - ${cardW}) / 2)`,
          }}
        >
          {items.map((g, i) => {
            const on = i === active;
            const inner = (
              <div
                className="relative overflow-hidden"
                style={{
                  aspectRatio: "3 / 5",
                  background: g.color || "var(--s-surface)",
                }}
              >
                {g.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    style={{
                      objectPosition: galleryImagePosition(g),
                      objectFit: g.imageFit === "contain" ? "contain" : "cover",
                    }}
                    src={g.imageUrl}
                    alt={g.caption || ""}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {g.caption && (
                  <span
                    className="absolute inset-x-0 bottom-0 p-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white"
                    style={{ background: CAT_FADE.soft }}
                  >
                    {g.caption}
                  </span>
                )}
              </div>
            );
            return (
              <div
                key={g.id}
                className="shrink-0 snap-center transition-[transform,opacity] duration-300"
                style={{
                  width: cardW,
                  transform: on ? "scale(1)" : "scale(.88)",
                  opacity: on ? 1 : 0.65,
                }}
              >
                {interactive && g.url ? (
                  <Link on href={g.url} title={g.caption || "View"}>
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
        {items.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {items.map((g, i) => (
              <button
                key={g.id}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                onClick={() => goTo(i)}
                className="h-1.5 w-1.5 rounded-full transition-opacity"
                style={{
                  background: "var(--s-text)",
                  opacity: i === active ? 1 : 0.25,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Block>
  );
}
