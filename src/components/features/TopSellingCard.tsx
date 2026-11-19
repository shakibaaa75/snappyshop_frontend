"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Flame, Heart, Package, Star } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, productDiscount } from "@/lib/format";
import { AddToCartButton } from "@/components/features/AddToCartButton";

/** Optional social-proof fields; the rating only shows when they exist. */
type CardProduct = Product & { rating?: number; reviewCount?: number };

/** Round seller profile picture, falls back to the seller's first letter. */
function SellerAvatar({ name, logo }: { name: string; logo?: string }) {
  return (
    <span className="relative grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-[#17645F] dark:bg-[#D93A2B] text-[10px] font-bold uppercase text-white ring-1 ring-border">
      {name.trim().charAt(0) || "?"}
      {logo ? (
        <Image
          src={logo}
          alt=""
          fill
          sizes="24px"
          className="bg-card object-cover"
        />
      ) : null}
    </span>
  );
}

/**
 * Compact product card. Designed to stay tidy from about 160px wide
 * (5 per row) up to about 260px (4 per row).
 */
export function TopSellingCard({
  product,
  rank,
}: {
  product: CardProduct;
  /** Only passed for ranked lists (Top Selling). */
  rank?: number;
}) {
  const [wished, setWished] = useState(false);

  const onSale =
    product.compareAtPrice !== undefined &&
    product.compareAtPrice > product.price;
  const off = productDiscount(product);
  const soldOut = product.inStock === false;
  const sold = product.sold ?? 0;
  // Hide "0.0" for products nobody has reviewed yet.
  const hasRating =
    typeof product.rating === "number" &&
    product.rating > 0 &&
    (product.reviewCount ?? 1) > 0;
  const showSold = !soldOut && sold > 0;

  // Real product page: /store/<seller-slug>/products/<product-id>
  const href = `/store/${product.store.slug}/products/${product.id}`;

  return (
    // The whole card opens the product (stretched link on the title); the
    // wishlist and Add buttons sit above it with z-10.
    <article className="group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-none transition-shadow duration-200 hover:shadow-lg focus-within:ring-2 focus-within:ring-[#FF6845] focus-within:ring-offset-2 motion-reduce:transition-none">
      {/* Photo: discount badge left, wishlist right */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={product.images[0] || "/placeholder-product.jpg"}
          alt={product.title}
          fill
          className={`object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none ${
            soldOut ? "opacity-50 grayscale" : ""
          }`}
          sizes="(max-width: 768px) 45vw, 20vw"
        />
        {off > 0 && !soldOut && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-[#D7191F] px-2 py-1 text-[10px] font-extrabold leading-none text-white shadow-sm">
            <Flame className="h-3 w-3 fill-white" aria-hidden />
            {off}% OFF
          </span>
        )}
        <button
          type="button"
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-xl bg-white/95 shadow-sm transition-transform active:scale-90"
        >
          <Heart
            className={`h-4 w-4 ${
              wished ? "fill-[#D7191F] text-[#D7191F]" : "text-slate-900"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* Seller: avatar + name + verified */}
        <div className="flex min-w-0 items-center gap-1.5">
          <SellerAvatar name={product.store.name} logo={product.store.logo} />
          <span className="min-w-0 truncate text-xs font-medium text-slate-600">
            {product.store.name}
          </span>
          {product.store.isVerified && (
            <BadgeCheck
              className="-ml-0.5 h-4 w-4 shrink-0 fill-[#1D7BFF] text-white"
              aria-label="Verified seller"
            />
          )}
        </div>

        {/* Product name, one line so every card has the same height */}
        <h3
          title={product.title}
          className="truncate text-sm font-extrabold leading-snug text-foreground"
        >
          {rank !== undefined && (
            <span className="mr-1.5 inline-block rounded-full bg-[#17645F] dark:bg-[#D93A2B] px-1.5 py-0.5 align-middle text-[10px] font-bold leading-none text-white">
              #{rank}
            </span>
          )}
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {product.title}
          </Link>
        </h3>

        {/* Rating + sold count (one fixed-height line) */}
        <div className="flex h-4 min-w-0 items-center gap-2 text-[11px] leading-none text-slate-500">
          {hasRating && (
            <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-foreground">
              <Star
                className="h-3 w-3 fill-amber-400 text-amber-400"
                aria-hidden
              />
              {product.rating!.toFixed(1)}
            </span>
          )}
          {showSold && (
            <span className="inline-flex min-w-0 items-center gap-1 truncate">
              <Package className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">
                {sold.toLocaleString("en-US")} sold
              </span>
            </span>
          )}
        </div>

        {/* Price (discount is already shown on the photo) */}
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0 text-base font-extrabold leading-none text-[#D7191F] dark:text-[#FF6B4A]">
            {formatPrice(product.price)}
          </span>
          {onSale && (
            <span className="truncate text-[11px] leading-none text-slate-500 line-through">
              {formatPrice(product.compareAtPrice as number)}
            </span>
          )}
        </div>

        {/* Full-width Add to Cart */}
        <div className="relative z-10 mt-auto pt-1.5">
          <div className="[&>button]:h-9 [&>button]:w-full [&>button]:rounded-full [&>button]:bg-[#17645F] [&>button]:text-white">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </article>
  );
}
