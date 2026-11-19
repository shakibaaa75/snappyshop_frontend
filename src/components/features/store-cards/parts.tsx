"use client";

import { type CSSProperties } from "react";
import {
  ArrowUpRight,
  Check,
  Heart,
  Plus,
  ShoppingBag,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Product, type StoreDesign } from "@/lib/store-design/types";
import { formatPrice } from "@/lib/store-design/utilts";
import {
  toggleWishlistItem,
  useWishlisted,
} from "@/lib/store-design/use-wishlist";
import { ProductArt } from "@/components/store-design/productArt";
import { type CardData, L } from "./shared-logic";
import {
  ART_MOTION,
  BTN,
  cardImageFit,
  cardImageRatio,
  type BtnKind,
  EASE,
  FOCUS,
  STAR,
  SZ_ROUND,
  type Tone,
  TONES,
} from "./tokens";
import { type CardCtx } from "./types";

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

/** Wishlist heart. "glass" sits on photos, "light" is a solid chip. */
export function Wish({
  slug,
  id,
  interactive,
  tone,
  className,
}: {
  slug: string;
  id: string;
  interactive: boolean;
  tone: "glass" | "light";
  className?: string;
}) {
  const saved = useWishlisted(slug, id, interactive);
  const idle: CSSProperties =
    tone === "glass"
      ? {
          background: "rgba(18,18,22,.45)",
          color: "#fff",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,.22)",
        }
      : {
          background: "var(--s-surface)",
          color: "var(--s-text)",
          border: "1px solid var(--s-border)",
        };
  const style: CSSProperties = saved
    ? {
        background: "var(--s-sale, #dc2626)",
        color: "var(--s-on-sale, #fff)",
        border: "1px solid var(--s-sale, #dc2626)",
      }
    : idle;
  const base = cn(
    `z-10 grid h-9 w-9 place-items-center rounded-full transition-[transform,background-color] duration-200 ${EASE} hover:scale-105 active:scale-90`,
    FOCUS,
    className,
  );

  if (!interactive) {
    return (
      <span className={base} style={idle}>
        <Heart className="h-4 w-4" />
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlistItem(slug, id);
      }}
      className={base}
      style={style}
    >
      <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
/** Sold-out / discount chip. Solid colors, readable on any photo. */
export function Chip({
  soldOut,
  onSale,
  off,
  showStock,
  showSale,
  position,
}: {
  soldOut: boolean;
  onSale: boolean;
  off: number;
  showStock: boolean;
  showSale: boolean;
  position?: string;
}) {
  const base =
    "pointer-events-none absolute z-10 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none";
  const pos = position ?? "left-2.5 top-2.5";
  if (soldOut && showStock) {
    return (
      <span
        className={cn(base, pos)}
        style={{ background: "rgba(17,17,20,.82)", color: "#fff" }}
      >
        Sold out
      </span>
    );
  }
  if (onSale && showSale) {
    return (
      <span
        className={cn(base, pos)}
        style={{
          background: "var(--s-sale, #dc2626)",
          color: "var(--s-on-sale, #fff)",
        }}
      >
        -{off}%
      </span>
    );
  }
  return null;
}
/** Product image inside a link, fixed aspect, hover zoom. */
export function Art({
  p,
  c,
  ctx,
  aspect,
  radius,
  className,
  bg = "var(--s-bg)",
}: {
  p: Product;
  c: CardData;
  ctx: CardCtx;
  aspect: string;
  radius: number | string;
  className?: string;
  bg?: string;
}) {
  // Seller overrides: photo shape and fit. "auto" ratios (full-bleed cards)
  // are left alone because the photo fills the whole card there.
  const ratio = aspect === "auto" ? aspect : cardImageRatio(ctx.d, aspect);
  const fit = cardImageFit(ctx.d);
  return (
    <L
      on={ctx.interactive}
      href={c.href}
      title={p.name}
      className={cn("block overflow-hidden", className)}
      style={{
        aspectRatio: ratio,
        borderRadius: radius,
        background: bg,
      }}
    >
      <div className={ART_MOTION}>
        <ProductArt
          product={p}
          className={fit}
          emojiClassName="text-6xl"
          width={600}
        />
      </div>
    </L>
  );
}
/** Sale/sold-out chip + wishlist heart, positioned on the nearest relative parent. */
export function Badges({
  p,
  c,
  ctx,
  tone = "glass",
  heartClass = "absolute right-2.5 top-2.5",
  chipClass,
}: {
  p: Product;
  c: CardData;
  ctx: CardCtx;
  tone?: "glass" | "light";
  heartClass?: string;
  chipClass?: string;
}) {
  const { d, interactive } = ctx;
  return (
    <>
      <Chip
        soldOut={c.soldOut}
        onSale={c.onSale}
        off={c.off}
        showStock={d.showStockStatus}
        showSale={d.showSaleBadge}
        position={chipClass}
      />
      {d.showWishlist && (
        <Wish
          slug={d.storeSlug}
          id={p.id}
          interactive={interactive}
          tone={tone}
          className={heartClass}
        />
      )}
    </>
  );
}
export function Rating({
  d,
  p,
  className,
}: {
  d: StoreDesign;
  p: Product;
  className?: string;
}) {
  if (!d.showRatings || p.reviews <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 tabular-nums",
        className,
      )}
    >
      <Star className="h-3 w-3" style={STAR} fill="currentColor" />
      {p.rating.toFixed(1)}
    </span>
  );
}
/** Name, category line and rating. */
export function Info({
  p,
  c,
  ctx,
  tone = "light",
  center,
  nameClass = "text-sm",
}: {
  p: Product;
  c: CardData;
  ctx: CardCtx;
  tone?: Tone;
  center?: boolean;
  nameClass?: string;
}) {
  const t = TONES[tone];
  return (
    <L
      on={ctx.interactive}
      href={c.href}
      className={cn("block min-w-0 rounded-sm", center && "text-center")}
    >
      <p
        className={cn(
          "line-clamp-1 font-semibold leading-snug tracking-tight",
          nameClass,
        )}
        style={{
          color: tone === "light" ? "var(--s-title, var(--s-text))" : t.fg,
        }}
      >
        {p.name}
      </p>
      <div
        className={cn(
          "mt-0.5 flex items-center gap-2 text-xs",
          center ? "justify-center" : "justify-between",
        )}
        style={{ color: t.muted }}
      >
        <span className="truncate">{c.sub}</span>
        <Rating d={ctx.d} p={p} />
      </div>
    </L>
  );
}
/** Price with optional struck-through compare price. */
export function Price({
  d,
  p,
  c,
  tone = "light",
  className = "text-lg",
  accent,
}: {
  d: StoreDesign;
  p: Product;
  c: CardData;
  tone?: Tone;
  className?: string;
  accent?: string;
}) {
  const t = TONES[tone];
  return (
    <div className="min-w-0">
      <span
        className={cn(
          "block font-semibold leading-none tracking-tight tabular-nums",
          className,
        )}
        style={{ color: accent ?? t.fg }}
      >
        {formatPrice(p.price)}
      </span>
      {d.showComparePrice && c.onSale && (
        <span
          className="mt-1 block text-xs tabular-nums line-through"
          style={{ color: t.muted }}
        >
          {formatPrice(p.comparePrice as number)}
        </span>
      )}
    </div>
  );
}
/**
 * Add-to-cart button. Same behavior everywhere; only the look changes.
 * The seller can switch it to "Buy now", or show both buttons side by side.
 */
export function AddBtn({
  p,
  c,
  kind = "primary",
  className = SZ_ROUND,
  icon = "bag",
  label,
}: {
  p: Product;
  c: CardData;
  kind?: BtnKind;
  className?: string;
  icon?: "bag" | "plus" | "arrow";
  label?: string;
}) {
  if (!c.canAdd) return null;
  const block = className.includes("w-full");
  const both = c.both;
  const cartIcon =
    icon === "plus" ? Plus : icon === "arrow" ? ArrowUpRight : ShoppingBag;

  const one = (action: "cart" | "buy") => {
    const buy = action === "buy";
    const Icon = buy ? Zap : cartIcon;
    const done = !buy && c.added;
    // With both buttons the second one gets a short label on pill buttons.
    const text = buy
      ? label
        ? both && !block
          ? "Buy"
          : "Buy now"
        : ""
      : label;
    const hideText = className.includes("@[230px]:w-auto") || (both && block);
    return (
      <button
        key={action}
        type="button"
        onClick={buy ? c.buy : c.addToCart}
        aria-label={c.paused ? "Store paused" : buy ? c.ariaBuy : c.ariaCart}
        className={cn(
          `inline-flex shrink-0 items-center justify-center gap-1.5 transition-transform duration-200 ${EASE} hover:scale-[1.04] active:scale-95`,
          FOCUS,
          c.paused && "opacity-50",
          both && block
            ? className.replace("w-full", "min-w-0 flex-1")
            : className,
        )}
        style={BTN[kind]}
      >
        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        {text && (
          <span className={cn(hideText && "hidden @[230px]:inline")}>
            {done ? "Added" : text}
          </span>
        )}
      </button>
    );
  };

  if (both) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1",
          // Two buttons are smaller on narrow cards so the price keeps room.
          !block &&
            (className.includes("@[230px]:w-auto")
              ? "[&>button]:!h-8 [&>button]:!w-8 @[230px]:gap-1.5 @[230px]:[&>button]:!h-10 @[230px]:[&>button]:!w-auto"
              : "[&>button]:!h-8 [&>button]:!w-8"),
          block && "flex w-full gap-2",
        )}
      >
        {one("cart")}
        {one("buy")}
      </span>
    );
  }
  return one(c.buyNow ? "buy" : "cart");
}
/**
 * Wide labelled button(s) for the Pookie / Pastel cards: one full-width
 * button, or Add to cart + Buy now side by side.
 */
export function WideActions({
  p,
  c,
  className,
  btnClass,
  style,
  altStyle,
  iconClass,
}: {
  p: Product;
  c: CardData;
  /** Wrapper spacing. */
  className?: string;
  /** Size / shape of each button. */
  btnClass: string;
  /** Main (filled) button style. */
  style: CSSProperties;
  /** Style of the Add to cart button when both are shown. */
  altStyle: CSSProperties;
  iconClass: string;
}) {
  const both = c.both;
  const one = (action: "cart" | "buy") => {
    const buy = action === "buy";
    const done = !buy && c.added;
    const Icon = done ? Check : buy ? Zap : ShoppingBag;
    return (
      <button
        key={action}
        type="button"
        onClick={buy ? c.buy : c.addToCart}
        aria-label={c.paused ? "Store paused" : buy ? c.ariaBuy : c.ariaCart}
        className={cn(
          btnClass,
          FOCUS,
          both
            ? buy
              ? "min-w-0 flex-1 whitespace-nowrap"
              : "w-9 shrink-0 px-0 @[230px]:w-auto @[230px]:min-w-0 @[230px]:flex-1 @[230px]:px-2"
            : "w-full",
          c.paused && "opacity-50",
        )}
        style={both && !buy ? altStyle : style}
      >
        <Icon className={iconClass} />
        {buy ? (
          "Buy now"
        ) : both ? (
          // Narrow cards: icon only (the check shows it was added).
          <span className="hidden whitespace-nowrap @[230px]:inline">
            {done ? "Added" : "Add to cart"}
          </span>
        ) : done ? (
          "Added"
        ) : (
          "Add to cart"
        )}
      </button>
    );
  };
  return (
    <div className={cn(both && "flex gap-1.5 @[230px]:gap-2", className)}>
      {both ? (
        <>
          {one("cart")}
          {one("buy")}
        </>
      ) : (
        one(c.buyNow ? "buy" : "cart")
      )}
    </div>
  );
}
/** Row holding price on the left and an action on the right. */
export const FOOT = "mt-auto flex items-center justify-between gap-2 pt-3";
