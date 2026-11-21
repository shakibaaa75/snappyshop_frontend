import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { marketplaceProductHref } from "@/lib/query/marketplace-links";
import type { ViewedProduct } from "@/lib/viewed-products";

/**
 * Small product card for "Recently viewed": photo, title and price in one link.
 *
 * It has no cart or heart button on purpose. Three cards sit side by side on a
 * 360px phone (about 100px each), which is too narrow for TopSellingCard's
 * price + cart button row. Opening the product is the one action here, and
 * the saved stock status could be out of date anyway.
 */
export function RecentlyViewedCard({
  product,
  coverImage = false,
}: {
  product: ViewedProduct;
  /** Fill the whole image box (used on the public home page). */
  coverImage?: boolean;
}) {
  const { id, slug, title, image, price, compareAtPrice } = product;

  return (
    <Link
      href={marketplaceProductHref(slug, id)}
      className="group flex h-full min-w-0 flex-col gap-0.5 bg-white text-left text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
    >
      <span className="relative block aspect-square overflow-hidden rounded-[clamp(12px,1.6vw,20px)] bg-[#f3f3f3]">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 767px) 31vw, 20vw"
            className={`${coverImage ? "object-cover" : "object-contain p-[5%] mix-blend-multiply"} transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none`}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-neutral-400">
            <ImageOff size={22} aria-hidden />
          </span>
        )}
      </span>

      <span className="mt-[5px] line-clamp-2 text-[clamp(.75rem,1vw,.9375rem)] font-[550] leading-[1.35] tracking-[-.018em] group-hover:underline">
        {title}
      </span>

      <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 [overflow-wrap:anywhere]">
        <strong className="text-[clamp(.875rem,1.15vw,1.0625rem)] font-[750] leading-[1.2] text-[#151515]">
          {formatPrice(price)}
        </strong>
        {compareAtPrice !== undefined && compareAtPrice > price && (
          <del className="text-xs text-[#696969]">
            {formatPrice(compareAtPrice)}
          </del>
        )}
      </span>
    </Link>
  );
}
