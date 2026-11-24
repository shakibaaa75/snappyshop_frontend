"use client";

import { useState } from "react";
import { DiscountBadge } from "./DiscountBadge";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/format";
import { marketplaceProductHref } from "@/lib/query/marketplace-links";
import {
  toggleWishlistItem,
  useWishlisted,
} from "@/lib/store-design/use-wishlist";
import { AddToCartButton } from "./AddToCartButton";

export type CardProduct = Pick<
  Product,
  | "id"
  | "title"
  | "price"
  | "compareAtPrice"
  | "images"
  | "inStock"
  | "hasVariants"
> & {
  store: Pick<Product["store"], "slug" | "name">;
};

// Only crop images whose shape is close to the square card.
// Set to false to use "cover" for any image that is sharp enough.
const COVER_ONLY_NEAR_SQUARE = true;

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-900";

export function TopSellingCard({
  product,
  coverImage = false,
  showDiscount = false,
}: {
  product: CardProduct;
  rank?: number;
  /** Always fill the whole image box (used on the public home page). */
  coverImage?: boolean;
  showDiscount?: boolean;
}) {
  const { id, store, title, images, price, compareAtPrice } = product;
  const saved = useWishlisted(store.slug, id);
  const href = marketplaceProductHref(store.slug, id);
  const [fit, setFit] = useState<"contain" | "cover">("contain");

  return (
    <article className="flex h-full min-w-0 flex-col gap-0.5 bg-white text-left text-neutral-900">
      <div className="relative aspect-square overflow-hidden rounded-[clamp(12px,1.6vw,20px)] bg-[#f3f3f3]">
        <Link
          href={href}
          aria-label={title}
          className={`absolute inset-0 ${focus}`}
        >
          <Image
            src={images[0] || "/placeholder-product.jpg"}
            alt=""
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1000px) 30vw, 22vw"
            data-fit={coverImage ? "cover" : fit}
            className="object-contain p-[5%] mix-blend-multiply data-[fit=cover]:object-cover data-[fit=cover]:p-0 data-[fit=cover]:mix-blend-normal"
            onLoad={(e) => {
              const img = e.currentTarget;
              const { naturalWidth: w, naturalHeight: h } = img;
              if (!w || !h) return;

              // Next serves a resized copy, so compare against what the card
              // needs instead of a fixed pixel size. DPR is capped at 2 so
              // 3x phones are not penalised.
              const dpr = Math.min(window.devicePixelRatio || 1, 2);
              const needed = img.clientWidth * dpr * 0.9;
              const sharp = Math.min(w, h) >= needed;

              const ratio = w / h;
              const nearSquare = ratio > 0.75 && ratio < 1.34;

              setFit(
                sharp && (!COVER_ONLY_NEAR_SQUARE || nearSquare)
                  ? "cover"
                  : "contain",
              );
            }}
          />
        </Link>
        {showDiscount && <DiscountBadge price={price} compareAtPrice={compareAtPrice} />}
        <button
          type="button"
          aria-pressed={saved}
          aria-label={
            saved
              ? `Remove ${title} from wishlist`
              : `Save ${title} to wishlist`
          }
          onClick={() => toggleWishlistItem(store.slug, id)}
          className={`absolute right-2 top-2 inline-grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-neutral-900 hover:bg-[#ededed] ${focus}`}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <h3 className="mt-[5px] text-[clamp(.8125rem,1vw,.9375rem)] font-[550] leading-[1.35] tracking-[-.018em]">
        <Link
          href={href}
          className={`line-clamp-2 overflow-hidden text-inherit hover:underline ${focus}`}
        >
          {title}
        </Link>
      </h3>

      <div className="flex items-center justify-between gap-[5px]">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 [overflow-wrap:anywhere]">
          <strong className="text-[clamp(.9375rem,1.15vw,1.0625rem)] font-[750] leading-[1.2] text-[#151515]">
            {formatPrice(price)}
          </strong>
          {compareAtPrice !== undefined && compareAtPrice > price && (
            <del className="text-xs text-[#696969]">
              {formatPrice(compareAtPrice)}
            </del>
          )}
        </div>
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
