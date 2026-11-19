"use client";

import { type Category, usesYokaiLayout } from "@/lib/store-design/types";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import { Link } from "./blocks";
import {
  CAT_ASPECT,
  CAT_FADE,
  CAT_GAP,
  catPhoto,
  CatTile,
} from "./category-tiles";
import { type Ctx } from "./types";

/** Scroll state and prev/next for a sideways-scrolling row. */
export function useRailScroll(dep: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync, dep]);

  const go = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  return { ref, edge, sync, go };
}
/**
 * Rail: a row of tall photos that scrolls sideways, the name underneath and
 * a little peek of the next photo. Prev/next arrows show on desktop.
 */
export function CategoryRail({ ctx, list }: { ctx: Ctx; list: Category[] }) {
  const { mobile } = ctx;
  const o = ctx.d.categoryOptions;
  const gap = CAT_GAP[o.gap];
  const cols = mobile ? 2.3 : Math.min(5, Math.max(2, o.columns)) + 0.3;
  const { ref, edge, sync, go } = useRailScroll(`${list.length}-${mobile}`);

  const arrow =
    "absolute top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-opacity sm:flex";
  const arrowStyle: CSSProperties = {
    background: "var(--s-bg)",
    color: "var(--s-text)",
    borderColor: "var(--s-border)",
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={sync}
        className={cn(
          "no-scrollbar flex snap-x snap-mandatory overflow-x-auto [-webkit-overflow-scrolling:touch]",
          mobile && "-mx-4 scroll-px-4 px-4",
        )}
        style={{ gap }}
      >
        {list.map((c) => (
          <div
            key={c.id}
            className="shrink-0 snap-start"
            style={{
              width: `calc((100% - ${gap * (Math.ceil(cols) - 1)}px) / ${cols})`,
              minWidth: mobile ? 130 : 160,
            }}
          >
            <CatTile
              c={c}
              ctx={ctx}
              o={{ ...o, label: "below" }}
              aspect={CAT_ASPECT[o.aspect]}
            />
          </div>
        ))}
      </div>
      {!mobile && !edge.start && (
        <button
          type="button"
          aria-label="Previous categories"
          onClick={() => go(-1)}
          className={cn(arrow, "left-2")}
          style={arrowStyle}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {!mobile && !edge.end && (
        <button
          type="button"
          aria-label="Next categories"
          onClick={() => go(1)}
          className={cn(arrow, "right-2")}
          style={arrowStyle}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
/**
 * Drop-style collections: big 4:5 photos packed edge to edge, the name and
 * item count centered at the bottom over a soft fade.
 */
export function CollectionGrid({ ctx, list }: { ctx: Ctx; list: Category[] }) {
  const { d, mobile, products, interactive } = ctx;
  const wide = usesYokaiLayout(d);
  const cols = wide
    ? mobile
      ? 1
      : 2
    : mobile
      ? 2
      : list.length === 5
        ? 5
        : Math.min(list.length, 4);
  return (
    <div
      className="grid"
      style={{
        gap: wide ? 12 : 4,
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {list.map((c) => {
        const photo = catPhoto(c, products);
        const n = products.filter((p) => p.categoryId === c.id).length;
        return (
          <Link
            key={c.id}
            on={interactive}
            href={`/store/${d.storeSlug}/products?category=${c.id}`}
            title={c.name}
            className="group relative block overflow-hidden"
            style={{
              aspectRatio: wide ? "1200 / 563" : "4 / 5",
              background: "var(--s-surface)",
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img(photo, { width: 900 })}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]"
              />
            ) : (
              <span
                className="absolute inset-0 flex items-center justify-center text-5xl font-semibold opacity-30"
                aria-hidden
              >
                {c.emoji || c.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            {photo && (
              <span
                className="pointer-events-none absolute inset-0"
                style={{ background: CAT_FADE.soft }}
                aria-hidden
              />
            )}
            <span
              className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 p-4 text-center"
              style={{ color: photo ? "#ffffff" : "var(--s-text)" }}
            >
              <span className="line-clamp-1 text-sm font-semibold uppercase tracking-[0.16em]">
                {c.name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] opacity-80">
                {n} {n === 1 ? "item" : "items"}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
