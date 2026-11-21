"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { addToSellerCart, useCartQty } from "@/lib/cart/marketplace-cart";
import { marketplaceProductHref } from "@/lib/query/marketplace-links";
import type { CardProduct } from "./TopSellingCard";

const addBtn =
  "inline-grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#bcbcbc] bg-white text-neutral-900 hover:bg-[#ededed] disabled:bg-[#efefef] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-900";

export function AddToCartButton({ product }: { product: CardProduct }) {
  const { id, title, price, compareAtPrice, images, store } = product;
  const added = useCartQty(store.slug, id) > 0;

  if (product.inStock === false)
    return <span className="text-xs text-[#696969]">Sold out</span>;

  if (product.hasVariants) {
    return (
      <Link
        href={marketplaceProductHref(store.slug, id)}
        className={addBtn}
        aria-label={`Select options for ${title}`}
      >
        <Plus size={18} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={addBtn}
      disabled={added}
      aria-label={added ? `${title} is in your cart` : `Add ${title} to cart`}
      onClick={() =>
        addToSellerCart({
          id,
          title,
          price,
          compareAtPrice,
          image: images[0],
          storeSlug: store.slug,
          storeName: store.name,
        })
      }
    >
      {added ? <Check size={18} /> : <Plus size={18} />}
    </button>
  );
}
