import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Flame, Tag } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, productDiscount } from "@/lib/format";
import { AddToCartButton } from "@/components/features/AddToCartButton";

/**
 * Card used in the "Best Big Deals" section.
 * Only shows facts the API really has: price, compare price, sold count,
 * sold-out state. Nothing here is invented urgency.
 */
export function DealCard({ product }: { product: Product }) {
  const off = productDiscount(product);
  const soldOut = product.inStock === false;
  const sold = product.sold ?? 0;
  const was =
    product.compareAtPrice !== undefined &&
    product.compareAtPrice > product.price
      ? product.compareAtPrice
      : undefined;
  const saved = was ? was - product.price : 0;

  const href = `/store/${product.store.slug}/products/${product.id}`;

  return (
    <article className="group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-[#FF6845] focus-within:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#EDE6DC]">
        <Image
          src={product.images[0] || "/placeholder-product.jpg"}
          alt={product.title}
          fill
          // Mobile cards are ~75vw wide, tablets ~40vw, desktop ~20vw.
          sizes="(max-width: 640px) 75vw, (max-width: 768px) 40vw, 20vw"
          className={`object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none ${
            soldOut ? "opacity-50 grayscale" : ""
          }`}
        />
        {off > 0 && !soldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#FF6845] px-2.5 py-1 text-xs font-bold leading-none text-white shadow-sm">
            -{off}%
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-[#17645F]/85 dark:bg-[#D93A2B]/85 py-1 text-center text-[11px] font-semibold text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <div className="flex items-center gap-1">
          <span className="min-w-0 truncate text-xs font-medium text-slate-500">
            {product.store.name}
          </span>
          {product.store.isVerified && (
            <BadgeCheck
              className="h-3.5 w-3.5 shrink-0 fill-[#FF6845] text-white"
              aria-label="Verified seller"
            />
          )}
        </div>

        {/* One line (full title on hover) so the price always sits right
            under the name and every card is the same height */}
        <h3
          title={product.title}
          className="truncate text-sm font-bold leading-snug text-primary sm:text-base"
        >
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {product.title}
          </Link>
        </h3>

        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-lg font-extrabold leading-none text-[#C93B17] dark:text-[#FF6B4A] sm:text-xl">
            {formatPrice(product.price)}
          </span>
          {was && (
            <span className="truncate text-xs leading-none text-slate-400 line-through">
              {formatPrice(was)}
            </span>
          )}
        </div>

        {/* One wrapping row: saving badge and sold count sit side by side */}
        <div className="mt-auto flex min-h-7 flex-wrap items-center gap-x-2 gap-y-1 pt-2">
          {saved > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#17645F]/10 dark:bg-[#D93A2B]/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Tag className="h-3 w-3" aria-hidden />
              Save {formatPrice(saved)}
            </span>
          )}
          {sold > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Flame className="h-3.5 w-3.5 text-[#FF6845]" aria-hidden />
              {sold.toLocaleString("en-US")} sold
            </span>
          )}
          <AddToCartButton product={product} className="ml-auto" />
        </div>
      </div>
    </article>
  );
}
