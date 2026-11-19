"use client";

import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { addToSellerCart, useCartQty } from "@/lib/cart/marketplace-cart";
import { cn } from "@/lib/utils";

/**
 * Add-to-cart for marketplace product cards.
 *
 * - Sold out            -> disabled "Sold out"
 * - Has size/colour     -> "Select options" link to the product page
 *                          (the cart needs to know which variant)
 * - Otherwise           -> adds 1 to that seller's cart right here
 *
 * Sits above the card's stretched link (relative + z-10), so clicking it
 * never opens the product page.
 */
export function AddToCartButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  // Once it is in the cart the button stays "Added" and does nothing.
  // Quantity is changed in the cart or on the product page.
  const inCart = useCartQty(product.store.slug, product.id);
  const added = inCart > 0;
  const productHref = `/store/${product.store.slug}/products/${product.id}`;

  const base =
    "relative z-10 inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF6845] focus-visible:ring-offset-2 motion-reduce:transition-none";

  if (product.inStock === false) {
    return (
      <span
        className={cn(
          base,
          "cursor-not-allowed bg-muted text-muted-foreground",
          className,
        )}
      >
        Sold out
      </span>
    );
  }

  if (product.hasVariants) {
    return (
      <Link
        href={productHref}
        className={cn(
          base,
          "border border-[#17645F] text-[#17645F] hover:bg-[#17645F]/10 dark:border-[#D93A2B] dark:text-[#FF6B4A] dark:hover:bg-[#D93A2B]/10",
          className,
        )}
      >
        Select options
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={
        added
          ? `${product.title} is in your cart`
          : `Add ${product.title} to cart`
      }
      aria-pressed={added}
      onClick={() => {
        if (added) return;
        addToSellerCart({
          id: product.id,
          title: product.title,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.images[0],
          storeSlug: product.store.slug,
          storeName: product.store.name,
        });
      }}
      className={cn(
        base,
        added
          ? "cursor-default bg-emerald-600 text-white"
          : "bg-[#17645F] text-white hover:bg-[#17645F]/90 dark:bg-[#D93A2B] dark:hover:bg-[#D93A2B]/90",
        className,
      )}
    >
      {added ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden /> Added
        </>
      ) : (
        <>
          <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
          Add
        </>
      )}
    </button>
  );
}
