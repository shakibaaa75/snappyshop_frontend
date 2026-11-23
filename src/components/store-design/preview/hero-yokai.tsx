"use client";

import { type HeroStyle } from "@/lib/store-design/types";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import { readableOn } from "@/lib/store-design/utilts";
import { Link } from "./blocks";
import {
  HERO_ALIGN,
  HERO_FOCUS,
  HERO_HEIGHT,
  HERO_SHAPE,
  HERO_TITLE,
  HERO_VALIGN,
  INTERNAL,
  type Slide,
} from "./hero-tokens";
import { CTA_BG } from "./tokens";
import { type Ctx } from "./types";

/**
 * Yokai hero: edge-to-edge slides with a big uppercase headline bottom-left,
 * a counter with square arrows bottom-right, and a scrolling ticker strip
 * underneath. Uses the same banners as the normal hero (main + extra slides).
 */
export function YokaiHero({ ctx }: { ctx: Ctx }) {
  const { d, interactive, mobile } = ctx;
  const base = `/store/${d.storeSlug}`;
  const scroller = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const [index, setIndex] = useState(0);

  const resolveUrl = useCallback(
    (url: string) => {
      const u = (url || "").trim();
      if (/^(https?:|mailto:|tel:)/.test(u) || u.startsWith("/store/"))
        return u;
      if (INTERNAL.test(u) || /^\/products(?:[/?#]|$)/.test(u))
        return `${base}${u}`;
      return `${base}/products`;
    },
    [base],
  );

  const slides = useMemo<Slide[]>(() => {
    const first: Slide = {
      id: "hero",
      title: d.heroTitle,
      subtitle: d.heroSubtitle,
      button: d.heroButtonText || "Shop now",
      url: d.heroButtonUrl,
      /* The store cover photo is the main banner picture unless a banner image is set. */
      image: d.heroImageUrl || d.coverUrl,
      color: "",
      style: d.heroStyle,
    };
    const extra: Slide[] = (d.heroSlides ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      button: b.buttonText || "Shop now",
      url: b.url,
      image: b.imageUrl,
      color: b.color,
      style: b.style,
    }));
    /* "Slide in promo banners" adds each promo banner as one more slide. */
    const promos: Slide[] = d.bannerPromos
      ? (d.promoBanners ?? []).map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          button: b.buttonText || "Details",
          url: b.url,
          image: "",
          color: b.color,
        }))
      : [];
    return [first, ...extra, ...promos].filter((x) => x.title || x.image);
  }, [d]);

  const goTo = useCallback((i: number) => {
    const el = scroller.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (!el || !child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, []);

  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    let best = 0;
    let dist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const x = Math.abs(
        (c as HTMLElement).offsetLeft - el.offsetLeft - el.scrollLeft,
      );
      if (x < dist) {
        dist = x;
        best = i;
      }
    });
    setIndex(best);
  }, []);

  useEffect(() => {
    if (!interactive || !d.bannerAutoplay || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      if (hovering.current || document.hidden) return;
      goTo((index + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(t);
  }, [interactive, d.bannerAutoplay, slides.length, index, goTo]);

  if (slides.length === 0) return null;
  const multi = slides.length > 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  const ticker = d.announcementText || d.tagline || d.storeName;
  const arrow =
    "flex h-10 w-10 items-center justify-center bg-white text-black transition-opacity disabled:opacity-40";

  return (
    <section>
      <style>{`@keyframes yk-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}@media (prefers-reduced-motion:reduce){.yk-marquee{animation:none!important}}`}</style>
      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          onPointerEnter={() => (hovering.current = true)}
          onPointerLeave={() => (hovering.current = false)}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto [-webkit-overflow-scrolling:touch]"
        >
          {slides.map((s, si) => {
            const st: HeroStyle = s.style ?? {};
            const href = resolveUrl(s.url);
            const sizeIdx = mobile ? 0 : 1;
            const align = st.align ?? "left";
            const valign = st.valign ?? "bottom";
            const titleSize = st.titleSize
              ? HERO_TITLE[st.titleSize][sizeIdx]
              : mobile
                ? "2.4rem"
                : "clamp(3rem, 6vw, 5.5rem)";
            const overlay = st.overlay ?? 72;
            const focus = HERO_FOCUS[st.imageFocus ?? "center"];
            const bg = st.bgColor
              ? st.bgColor2
                ? `linear-gradient(135deg, ${st.bgColor}, ${st.bgColor2})`
                : st.bgColor
              : s.color || "#15161a";
            const fg =
              st.textColor ||
              (st.bgColor && !s.image ? readableOn(st.bgColor) : "#ffffff");
            const bs = st.buttonStyle ?? "solid";
            const buttonStyle: CSSProperties =
              bs === "outline"
                ? {
                    background: "transparent",
                    color: fg,
                    border: `1.5px solid ${fg}`,
                  }
                : bs === "soft"
                  ? {
                      background:
                        "color-mix(in srgb, currentColor 18%, transparent)",
                      color: fg,
                    }
                  : bs === "brand"
                    ? { background: CTA_BG, color: "var(--s-on-primary)" }
                    : { background: "#ffffff", color: "#111111" };
            return (
              <div
                key={s.id}
                className="relative w-full shrink-0 snap-start overflow-hidden"
                style={{
                  aspectRatio: mobile ? "4 / 5" : "21 / 9",
                  minHeight: st.height
                    ? HERO_HEIGHT[st.height][sizeIdx]
                    : undefined,
                  background: bg,
                  color: fg,
                }}
              >
                {s.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img(s.image, { width: 2000 })}
                    alt=""
                    decoding="async"
                    loading={si === 0 ? "eager" : "lazy"}
                    fetchPriority={si === 0 ? "high" : "auto"}
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: focus }}
                  />
                )}
                {s.image && overlay > 0 && (
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `linear-gradient(to top, rgba(0,0,0,${overlay / 100}) 0%, rgba(0,0,0,${overlay / 400}) 55%, rgba(0,0,0,${overlay / 1600}) 100%)`,
                    }}
                    aria-hidden
                  />
                )}
                <div
                  className={cn(
                    "absolute inset-0 flex flex-col",
                    HERO_ALIGN[align],
                    HERO_VALIGN[valign],
                    mobile ? "gap-3 p-5 pb-16 pt-6" : "gap-4 p-10 pb-14",
                  )}
                >
                  {st.badge && (
                    <span
                      className="inline-flex items-center px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        background:
                          "color-mix(in srgb, currentColor 18%, transparent)",
                      }}
                    >
                      {st.badge}
                    </span>
                  )}
                  {st.showStoreName !== false && d.storeName && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.3em] opacity-80">
                      {d.storeName}
                    </span>
                  )}
                  {s.title && (
                    <h2
                      className="max-w-[16ch] font-extrabold uppercase leading-[0.92] tracking-tight"
                      style={{ fontSize: titleSize }}
                    >
                      {s.title}
                    </h2>
                  )}
                  {s.subtitle && (
                    <p className="max-w-md text-sm opacity-85">{s.subtitle}</p>
                  )}
                  <Link
                    on={interactive}
                    href={href}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 px-7 text-[11px] font-semibold uppercase tracking-[0.16em]",
                      st.buttonShape ? HERO_SHAPE[st.buttonShape] : "",
                    )}
                    style={buttonStyle}
                  >
                    {s.button}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                {interactive && !!s.url?.trim() && (
                  <a
                    href={resolveUrl(s.url)}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute inset-0 z-[1]"
                  />
                )}
              </div>
            );
          })}
        </div>
        {multi && (
          <div
            className={cn(
              "pointer-events-none absolute z-10 flex items-center gap-4",
              mobile ? "bottom-4 right-5" : "bottom-8 right-10",
            )}
          >
            <span className="pointer-events-auto text-xs font-semibold tabular-nums text-white">
              {pad(index + 1)} / {pad(slides.length)}
            </span>
            {!mobile && (
              <div className="pointer-events-auto flex gap-1">
                <button
                  type="button"
                  aria-label="Previous slide"
                  disabled={index === 0}
                  onClick={() => goTo(index - 1)}
                  className={arrow}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next slide"
                  disabled={index >= slides.length - 1}
                  onClick={() => goTo(index + 1)}
                  className={arrow}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
        {multi && (
          <div
            className={cn(
              "pointer-events-none absolute flex gap-1.5",
              mobile ? "bottom-4 left-5" : "bottom-8 left-10",
            )}
          >
            {slides.map((s, i) => (
              <span
                key={s.id}
                className="h-[3px] w-8 bg-white transition-opacity"
                style={{ opacity: i === index ? 1 : 0.35 }}
              />
            ))}
          </div>
        )}
      </div>
      {ticker && (
        <div
          className="overflow-hidden py-2.5"
          style={{
            background: "var(--s-primary)",
            color: "var(--s-on-primary)",
          }}
          aria-hidden
        >
          <div
            className="yk-marquee flex w-max whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.24em]"
            style={{ animation: "yk-marquee 28s linear infinite" }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="px-6">
                {ticker} <span className="px-6 opacity-50">✦</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
