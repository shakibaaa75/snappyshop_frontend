"use client";

import { type Product } from "@/lib/store-design/types";
import { CardScope } from "@/lib/store-design/card-style";
import { type CSSProperties, memo, useCallback, useState } from "react";
import { EXTRA_CARDS } from "@/components/features/Storecards";
import { Check, Heart, ShoppingBag, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/store-design/utilts";
import { ProductArt } from "../productArt";
import { useCart } from "@/lib/store-design/cart";
import { useRouter } from "next/navigation";
import {
  variantOptions,
  type VariantProduct,
} from "@/lib/store-design/variants";
import {
  toggleWishlistItem,
  useWishlisted,
} from "@/lib/store-design/use-wishlist";
import { Link, Stars } from "./blocks";
import { aspectCss, CTA_BG, INK, muted, NAME_PILL } from "./tokens";
import {
  cardImageFit,
  cardImageRatio,
} from "@/components/features/store-cards/tokens";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

function WishButton({
  slug,
  id,
  interactive,
  className,
  light,
}: {
  slug: string;
  id: string;
  interactive: boolean;
  className?: string;
  light?: boolean;
}) {
  const saved = useWishlisted(slug, id, interactive);
  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlistItem(slug, id);
    },
    [slug, id],
  );
  const idle: CSSProperties = light
    ? {
        background: "#fff",
        color: "#111",
        boxShadow: "0 1px 4px rgba(0,0,0,.12)",
      }
    : INK;
  const style: CSSProperties = saved
    ? { background: "#ef4444", color: "#fff" }
    : idle;
  const base =
    "z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-150 active:scale-90";

  if (!interactive) {
    return (
      <span className={cn(base, className)} style={idle}>
        <Heart className="h-4 w-4" />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      className={cn(base, className)}
      style={style}
    >
      <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
/**
 * Default "shop" card: white card, soft image tile, red sale chip top-left,
 * heart top-right, price row with a quick-add button.
 */
function ShopCard({ p, ctx }: { p: Product; ctx: Ctx }) {
  const { d, interactive, categories } = ctx;
  const cart = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const onSale = !!p.comparePrice && p.comparePrice > p.price;
  const off = onSale
    ? Math.round((1 - p.price / (p.comparePrice as number)) * 100)
    : 0;
  const soldOut = p.stock === 0;
  const lowStock = !soldOut && p.stock <= 5;
  const paused = d.vacationMode;
  const buyNow = d.cardCustom?.button === "buy";
  const both = d.cardCustom?.button === "both";
  const href = `/store/${d.storeSlug}/products/${p.id}`;

  /* Small line under the name: category, falling back to the store name */
  const sub =
    categories.find((c) => c.id === p.categoryId)?.name || d.storeName;

  const note =
    d.showStockStatus && lowStock
      ? `Only ${p.stock} left`
      : d.showSoldCount
        ? `${p.sold.toLocaleString("en-US")} sold`
        : null;

  /* Dark card, light text: derived from the seller's theme */
  const cardBg = "color-mix(in srgb, var(--s-text) 94%, #fff)";
  const onCard = "var(--s-bg)";
  const onCardMuted = "color-mix(in srgb, var(--s-bg) 62%, transparent)";

  const handleAdd = (e: React.MouseEvent, buy = buyNow) => {
    e.preventDefault();
    if (!interactive || paused) return;
    // Sizes/colours must be chosen on the product page, never defaulted.
    if (variantOptions(p as VariantProduct).length > 0) {
      router.push(`/store/${d.storeSlug}/products/${p.id}`);
      return;
    }
    if (buy) {
      // Buy now: add to the cart, then go straight to checkout.
      if (!cart.lines.some((l) => l.productId === p.id)) cart.addItem(p, 1);
      router.push(`/store/${d.storeSlug}/checkout`);
      return;
    }
    cart.addItem(p, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  const chip =
    soldOut && d.showStockStatus ? (
      <span
        className="pointer-events-none absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold"
        style={{ background: "rgba(0,0,0,.75)", color: "#fff" }}
      >
        Sold out
      </span>
    ) : onSale && d.showSaleBadge ? (
      <span
        className="pointer-events-none absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold"
        style={{ background: "#ef4444", color: "#fff" }}
      >
        -{off}%
      </span>
    ) : null;

  return (
    <article
      className="group relative flex min-w-0 flex-col p-2"
      style={{
        background: cardBg,
        color: onCard,
        borderRadius: 30,
        boxShadow: "var(--sf-shadow-md)",
      }}
    >
      {/* Image tile with the heart button in the top-right corner */}
      <div className="relative">
        <Link
          on={interactive}
          href={href}
          title={p.name}
          className="block overflow-hidden"
          style={{
            aspectRatio: cardImageRatio(d, aspectCss[d.imageAspectRatio]),
            borderRadius: 24,
            background: "var(--s-surface)",
          }}
        >
          <div className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.04]">
            <ProductArt
              product={p}
              className={cardImageFit(d)}
              emojiClassName="text-5xl"
            />
          </div>
        </Link>
        {chip}
        {d.showWishlist && (
          <WishButton
            slug={d.storeSlug}
            id={p.id}
            interactive={interactive}
            className="absolute right-2.5 top-2.5 h-10 w-10"
          />
        )}
      </div>

      <div className="px-2.5 pb-1.5 pt-3">
        {/* Name + category */}
        <Link on={interactive} href={href} className="block min-w-0">
          <p className="line-clamp-1 text-[15px] font-semibold leading-snug">
            {p.name}
          </p>
          <div
            className="mt-0.5 flex items-center justify-between gap-2 text-xs"
            style={{ color: onCardMuted }}
          >
            <span className="truncate">{sub}</span>
            {d.showRatings && p.reviews > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1">
                <Star
                  className="h-3 w-3"
                  style={{ color: "#f59e0b" }}
                  fill="currentColor"
                />
                {p.rating.toFixed(1)}
              </span>
            )}
          </div>
        </Link>

        {/* Price + add to bag */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <Link on={interactive} href={href} className="block min-w-0 flex-1">
            <span className="block text-xl font-bold leading-none tracking-tight sm:text-2xl">
              {formatPrice(p.price)}
            </span>
            {d.showComparePrice && onSale && (
              <span
                className="mt-1 block text-xs line-through"
                style={{ color: onCardMuted }}
              >
                {formatPrice(p.comparePrice as number)}
              </span>
            )}
            {note && !(d.showComparePrice && onSale) && (
              <span
                className="mt-1 block text-[11px]"
                style={{
                  color:
                    lowStock && d.showStockStatus ? "#fbbf24" : onCardMuted,
                }}
              >
                {note}
              </span>
            )}
          </Link>

          {d.showAddToCart && !soldOut && (
            <div className="flex shrink-0 items-center gap-1">
              {(both
                ? (["cart", "buy"] as const)
                : ([buyNow ? "buy" : "cart"] as const)
              ).map((action) => {
                const buy = action === "buy";
                const Icon =
                  added && !buy && !buyNow ? Check : buy ? Zap : ShoppingBag;
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={(e) => handleAdd(e, buy)}
                    aria-label={
                      paused
                        ? "Store paused"
                        : buy
                          ? `Buy ${p.name} now`
                          : `Add ${p.name} to cart`
                    }
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-2xl transition-transform duration-150 active:scale-90",
                      both
                        ? "h-9 w-9 sm:h-11 sm:w-11"
                        : "h-11 w-11 sm:h-12 sm:w-12",
                      paused && "opacity-50",
                    )}
                    style={{
                      background: "var(--s-bg)",
                      color: "var(--s-text)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
/**
 * One product card, three looks driven by `design.cardVariant`:
 * - classic / tile: soft tile, glass name pill over the photo, price row below
 * - minimal: borderless photo, name and price on one line
 * - editorial: tall photo with a centred caption
 */
function ProductCardBase({ p, ctx }: { p: Product; ctx: Ctx; index: number }) {
  const Extra = EXTRA_CARDS[ctx.d.cardVariant];
  if (Extra) return <Extra p={p} ctx={ctx} />;
  if (ctx.d.cardVariant === "classic") return <ShopCard p={p} ctx={ctx} />;
  const { d, interactive } = ctx;
  const variant = d.cardVariant;
  const tile = variant !== "minimal" && variant !== "editorial";
  const onSale = !!p.comparePrice && p.comparePrice > p.price;
  const off = onSale
    ? Math.round((1 - p.price / (p.comparePrice as number)) * 100)
    : 0;
  const soldOut = p.stock === 0;
  const lowStock = !soldOut && p.stock <= 5;
  const paused = d.vacationMode;
  const href = `/store/${d.storeSlug}/products/${p.id}`;
  const imgRadius = tile
    ? 28
    : variant === "editorial"
      ? 6
      : Math.min(ctx.radius, 20);

  const note =
    d.showStockStatus && lowStock
      ? { text: `Only ${p.stock} left`, color: "#d97706" }
      : d.showSoldCount
        ? {
            text: `${p.sold.toLocaleString("en-US")} sold`,
            color: "var(--s-muted)",
          }
        : null;

  const price = (
    <span className="flex items-baseline gap-2">
      <span className="text-sm font-bold">{formatPrice(p.price)}</span>
      {d.showComparePrice && onSale && (
        <span className="text-xs line-through" style={muted}>
          {formatPrice(p.comparePrice as number)}
        </span>
      )}
    </span>
  );

  const badge =
    (soldOut && d.showStockStatus) || (onSale && d.showSaleBadge) ? (
      <span
        className="pointer-events-none absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold"
        style={
          soldOut
            ? { background: "rgba(0,0,0,.75)", color: "#fff" }
            : {
                background: "var(--s-secondary)",
                color: "var(--s-on-secondary)",
              }
        }
      >
        {soldOut ? "Sold out" : `-${off}%`}
      </span>
    ) : null;

  const wish = d.showWishlist && (
    <WishButton
      slug={d.storeSlug}
      id={p.id}
      interactive={interactive}
      className="absolute left-3 top-3"
    />
  );

  return (
    <article className="group relative flex min-w-0 flex-col">
      <div className="relative">
        <Link
          on={interactive}
          href={href}
          title={p.name}
          className="block overflow-hidden"
          style={{
            aspectRatio: cardImageRatio(d, aspectCss[d.imageAspectRatio]),
            borderRadius: imgRadius,
            background: "var(--s-surface)",
          }}
        >
          <div className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]">
            <ProductArt
              product={p}
              className={cardImageFit(d)}
              emojiClassName="text-5xl"
            />
          </div>
        </Link>
        {wish}
        {badge}
        {tile && (
          <span
            className="pointer-events-none absolute inset-x-3 bottom-3 truncate rounded-full px-3 py-2 text-center text-sm font-semibold"
            style={NAME_PILL}
          >
            {p.name}
          </span>
        )}
      </div>

      {tile ? (
        <div className="mt-2.5 flex items-center justify-between gap-2 px-2">
          <div className="min-w-0">
            {price}
            {note && (
              <p className="mt-0.5 text-[11px]" style={{ color: note.color }}>
                {note.text}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {d.showRatings && p.reviews > 0 && (
              <span className="text-xs" style={muted}>
                <Stars value={p.rating} />
              </span>
            )}
            {d.showAddToCart && !soldOut && (
              <Link
                on={interactive}
                href={href}
                title={
                  paused
                    ? "Store paused"
                    : d.cardCustom?.button === "buy"
                      ? "Buy now"
                      : "Add to bag"
                }
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90",
                  paused && "opacity-50",
                )}
                style={{ background: CTA_BG, color: "var(--s-on-primary)" }}
              >
                {d.cardCustom?.button === "buy" ? (
                  <Zap className="h-4 w-4" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
              </Link>
            )}
          </div>
        </div>
      ) : variant === "minimal" ? (
        <Link
          on={interactive}
          href={href}
          className="mt-3 flex items-baseline justify-between gap-3 px-1"
        >
          <span className="line-clamp-1 text-sm">{p.name}</span>
          {price}
        </Link>
      ) : (
        <Link on={interactive} href={href} className="mt-3 block text-center">
          <p className="line-clamp-2 text-[15px] leading-snug tracking-wide">
            {p.name}
          </p>
          <div className="mt-1 flex justify-center">{price}</div>
          {d.showRatings && p.reviews > 0 && (
            <div className="mt-1 flex justify-center text-xs" style={muted}>
              <Stars value={p.rating} />
            </div>
          )}
        </Link>
      )}
    </article>
  );
}
export const ProductCard = memo(function ProductCard(props: {
  p: Product;
  ctx: Ctx;
  index: number;
}) {
  return (
    <CardScope d={props.ctx.d}>
      <ProductCardBase {...props} />
    </CardScope>
  );
});
export function BaseCardPreview({ p, ctx }: { p: Product; ctx: Ctx }) {
  return <ProductCardBase p={p} ctx={ctx} index={0} />;
}
