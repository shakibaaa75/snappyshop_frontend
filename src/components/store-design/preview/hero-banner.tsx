"use client";

import { type HeroLayout, type HeroStyle } from "@/lib/store-design/types";
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
import { ProductArt } from "../productArt";
import { Block, Link } from "./blocks";
import {
  HERO_ALIGN,
  HERO_FOCUS,
  HERO_HEIGHT,
  HERO_RADIUS,
  HERO_SHAPE,
  HERO_TITLE,
  HERO_VALIGN,
  INTERNAL,
  type Slide,
} from "./hero-tokens";
import { CTA_BG, GLASS, INK } from "./tokens";
import { type Ctx } from "./types";

export function HeroBanner({ ctx }: { ctx: Ctx }) {
  const { d, products, interactive, mobile } = ctx;
  const base = `/store/${d.storeSlug}`;
  const scroller = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const [index, setIndex] = useState(0);

  const resolveUrl = useCallback(
    (url: string) => {
      const u = (url || "").trim();
      if (/^(https?:|mailto:|tel:)/.test(u) || u.startsWith("/store/"))
        return u;
      if (INTERNAL.test(u)) return `${base}${u}`;
      return base;
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
      image: d.heroImageUrl,
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
    return [first, ...extra, ...promos].filter((x) => x.title);
  }, [d]);

  /* Small product photos under the text (the "thumbnails" toggle). */
  const thumbs = useMemo(
    () => (d.bannerProducts ? products.slice(0, 4) : []),
    [d.bannerProducts, products],
  );
  /* Products for the "Showcase" layout. Shown even when the toggle is off. */
  const showcase = useMemo(() => products.slice(0, 4), [products]);

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

  const sizeIdx = mobile ? 0 : 1;
  const multi = slides.length > 1;

  return (
    <Block ctx={ctx}>
      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          onPointerEnter={() => (hovering.current = true)}
          onPointerLeave={() => (hovering.current = false)}
          className={cn(
            "no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto [-webkit-overflow-scrolling:touch]",
            mobile && "-mx-4 scroll-px-4 px-4",
          )}
        >
          {slides.map((s, si) => {
            const st: HeroStyle = s.style ?? {};
            const hasImg = !!s.image;
            const wanted: HeroLayout = st.layout ?? d.heroLayout;
            /* "Full image" without a photo falls back to split. */
            const layout: HeroLayout =
              wanted === "image" && !hasImg ? "split" : wanted;
            const tone = st.tone ?? d.bannerTone;

            const isFull = layout === "image";
            const isCard = layout === "card";
            const isStacked = layout === "stacked";
            const isMinimal = layout === "minimal";
            const isShowcase = layout === "showcase" && showcase.length > 0;
            const isCentered = layout === "centered";
            const isSplit =
              layout === "split" || (layout === "showcase" && !isShowcase);

            const align =
              st.align ?? (isCentered || isMinimal ? "center" : "left");
            const valign = st.valign ?? (isFull ? "bottom" : "middle");
            const minH = HERO_HEIGHT[st.height ?? "md"][sizeIdx];
            const titleSize = HERO_TITLE[st.titleSize ?? "md"][sizeIdx];
            const radius = HERO_RADIUS[st.radius ?? "xl"];
            const overlay = st.overlay ?? 70;
            const focus = HERO_FOCUS[st.imageFocus ?? "center"];

            /* Resolved colors: custom > style preset */
            let bgSolid: string;
            let fg: string;
            if (st.bgColor) {
              bgSolid = st.bgColor;
              fg = readableOn(st.bgColor);
            } else if (tone === "light") {
              bgSolid = "var(--s-surface)";
              fg = "var(--s-text)";
            } else if (tone === "brand") {
              bgSolid = s.color || "var(--s-primary)";
              fg = s.color ? readableOn(s.color) : "var(--s-on-primary)";
            } else {
              bgSolid = "#111113";
              fg = "#fafafa";
            }
            const bgCss =
              st.bgColor && st.bgColor2
                ? `linear-gradient(135deg, ${st.bgColor}, ${st.bgColor2})`
                : bgSolid;
            if (isFull && !st.textColor) fg = "#ffffff";
            if (st.textColor) fg = st.textColor;

            /* Text color actually used inside the text block */
            const ink = isCard ? (st.textColor ?? "var(--s-text)") : fg;

            const bs = st.buttonStyle ?? "solid";
            const buttonStyle: CSSProperties =
              bs === "outline"
                ? {
                    background: "transparent",
                    color: ink,
                    border: `1.5px solid ${ink}`,
                  }
                : bs === "soft"
                  ? {
                      background:
                        "color-mix(in srgb, currentColor 16%, transparent)",
                      color: ink,
                    }
                  : bs === "brand"
                    ? { background: CTA_BG, color: "var(--s-on-primary)" }
                    : isFull
                      ? { background: "#ffffff", color: "#111111" }
                      : isCard
                        ? INK
                        : { background: fg, color: bgSolid };

            /* ---------- pieces ---------- */
            const imgEl = (cls: string, eager = false) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img(s.image, { width: 1600 })}
                alt=""
                decoding="async"
                loading={eager || si === 0 ? "eager" : "lazy"}
                fetchPriority={eager || si === 0 ? "high" : "auto"}
                draggable={false}
                className={cn("object-cover", cls)}
                style={{ objectPosition: focus }}
              />
            );

            const textBlock = (
              <>
                {st.badge && (
                  <span
                    className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      background:
                        "color-mix(in srgb, currentColor 16%, transparent)",
                    }}
                  >
                    {st.badge}
                  </span>
                )}
                {d.storeName &&
                  st.showStoreName !== false &&
                  align !== "center" &&
                  !st.badge && (
                    <p className="mb-2 text-xs font-semibold opacity-60">
                      {d.storeName}
                    </p>
                  )}
                <h3
                  className="font-bold leading-[1.08] tracking-tight [text-wrap:balance]"
                  style={{ fontSize: titleSize, letterSpacing: "-0.02em" }}
                >
                  {s.title}
                </h3>
                {s.subtitle && (
                  <p
                    className="mt-2.5 max-w-md text-sm leading-relaxed sm:text-[15px]"
                    style={{ opacity: 0.72 }}
                  >
                    {s.subtitle}
                  </p>
                )}
                {thumbs.length > 0 && isSplit && (
                  <div className="mt-4 flex gap-2">
                    {thumbs.map((t) => (
                      <span
                        key={t.id}
                        className="h-10 w-10 overflow-hidden rounded-xl ring-1 ring-white/20"
                      >
                        <ProductArt product={t} emojiClassName="text-lg" />
                      </span>
                    ))}
                  </div>
                )}
                {isShowcase && mobile && (
                  <div className="mt-4 flex gap-2">
                    {showcase.map((t) => (
                      <span
                        key={t.id}
                        className="h-12 w-12 overflow-hidden rounded-xl ring-1 ring-white/20"
                      >
                        <ProductArt product={t} emojiClassName="text-xl" />
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-6">
                  <Link
                    on={interactive}
                    href={resolveUrl(s.url)}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 px-6 text-sm font-semibold transition-transform duration-150 active:scale-[0.97]",
                      HERO_SHAPE[st.buttonShape ?? "pill"],
                    )}
                    style={buttonStyle}
                  >
                    {s.button}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            );

            /* Split: image on one side. Showcase: product grid on one side. */
            const imageOnLeft = (isSplit || isShowcase) && align === "right";
            const sideVisual =
              (isSplit && (hasImg || (!mobile && !!thumbs[0]))) ||
              (isShowcase && !mobile);

            const textCls = cn(
              "relative flex flex-1 flex-col p-6 sm:p-10",
              HERO_ALIGN[align],
              HERO_VALIGN[valign],
            );

            return (
              <div
                key={s.id}
                className={cn(
                  "relative flex shrink-0 snap-start flex-col overflow-hidden",
                  multi ? (mobile ? "w-[90%]" : "w-[92%]") : "w-full",
                )}
                style={{
                  minHeight: minH,
                  background: bgCss,
                  color: isCard ? undefined : fg,
                  borderRadius: radius,
                }}
              >
                {/* ---- backgrounds ---- */}
                {hasImg &&
                  !isStacked &&
                  !isMinimal &&
                  (isFull || isCard) &&
                  imgEl("absolute inset-0 h-full w-full")}
                {hasImg &&
                  (isCentered || isShowcase) &&
                  imgEl(
                    cn(
                      "absolute inset-0 h-full w-full",
                      tone === "light" && !st.bgColor
                        ? "opacity-20"
                        : "opacity-30",
                    ),
                  )}
                {isFull && overlay > 0 && (
                  <span
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to top, rgba(0,0,0,${overlay / 100}) 0%, rgba(0,0,0,${overlay / 250}) 55%, transparent 100%)`,
                    }}
                  />
                )}
                {isCard && hasImg && overlay > 0 && (
                  <span
                    className="absolute inset-0"
                    style={{ background: `rgba(0,0,0,${overlay / 400})` }}
                  />
                )}

                {/* ---- split ---- */}
                {isSplit &&
                  hasImg &&
                  imgEl(
                    cn(
                      "absolute inset-y-0 h-full w-[42%]",
                      imageOnLeft ? "left-0" : "right-0",
                    ),
                  )}
                {isSplit && !hasImg && !mobile && thumbs[0] && (
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-4 w-[38%] overflow-hidden rounded-[24px]",
                      imageOnLeft ? "left-4" : "right-4",
                    )}
                  >
                    <ProductArt product={thumbs[0]} emojiClassName="text-8xl" />
                  </div>
                )}

                {/* ---- showcase grid (desktop) ---- */}
                {isShowcase && !mobile && (
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-6 grid w-[38%] grid-cols-2 gap-3",
                      imageOnLeft ? "left-6" : "right-6",
                    )}
                  >
                    {showcase.map((t) => (
                      <span
                        key={t.id}
                        className="overflow-hidden rounded-[20px] ring-1 ring-white/15"
                      >
                        <ProductArt product={t} emojiClassName="text-5xl" />
                      </span>
                    ))}
                  </div>
                )}

                {/* ---- stacked: photo on top ---- */}
                {isStacked && hasImg && (
                  <div
                    className="relative w-full shrink-0 overflow-hidden"
                    style={{ height: Math.round(minH * (mobile ? 0.55 : 0.6)) }}
                  >
                    {imgEl("absolute inset-0 h-full w-full")}
                  </div>
                )}

                {/* ---- text ---- */}
                {isCard ? (
                  <div
                    className={cn(
                      "relative flex flex-1 p-4 sm:p-8",
                      align === "left" && "justify-start",
                      align === "center" && "justify-center",
                      align === "right" && "justify-end",
                      valign === "top" && "items-start",
                      valign === "middle" && "items-center",
                      valign === "bottom" && "items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "flex w-full max-w-[420px] flex-col rounded-[24px] p-5 sm:p-7",
                        HERO_ALIGN[align],
                      )}
                      style={{
                        background:
                          "color-mix(in srgb, var(--s-bg) 92%, transparent)",
                        color: ink,
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        boxShadow: "0 12px 32px rgba(0,0,0,.18)",
                      }}
                    >
                      {textBlock}
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      textCls,
                      isFull && "pb-8 sm:pb-10",
                      isStacked && "p-5 sm:p-8",
                      (isSplit || isShowcase) && sideVisual && "max-w-[58%]",
                      imageOnLeft && "ml-auto",
                    )}
                  >
                    {textBlock}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {interactive && !mobile && multi && (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={() => goTo((index - 1 + slides.length) % slides.length)}
              className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full transition-transform active:scale-95"
              style={GLASS}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={() => goTo((index + 1) % slides.length)}
              className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full transition-transform active:scale-95"
              style={GLASS}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {multi && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show banner ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none"
              style={{
                width: i === index ? 24 : 8,
                background: "var(--s-text)",
                opacity: i === index ? 1 : 0.22,
              }}
            />
          ))}
        </div>
      )}
    </Block>
  );
}
