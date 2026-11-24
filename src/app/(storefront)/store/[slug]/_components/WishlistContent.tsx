"use client";

import { Check, Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ProductArt } from "@/components/store-design/productArt";
import { useCart } from "@/lib/store-design/cart";
import {
  toggleWishlistItem,
  useSavedIds,
} from "@/lib/store-design/use-wishlist";
import type { Product, StoreDesign } from "@/lib/store-design/types";
import { formatPrice } from "@/lib/store-design/utilts";

const aspect = {
  square: "1 / 1",
  portrait: "3 / 4",
  landscape: "4 / 3",
} as const;

export function WishlistContent({
  design,
  products,
}: {
  design: StoreDesign;
  products: Product[];
}) {
  const ids = useSavedIds(design.storeSlug);
  const cart = useCart();
  const base = `/store/${design.storeSlug}`;
  const saved = products.filter((p) => ids.has(p.id));

  return (
    <div className="@container w-full min-w-0">
      <div
        className="sf-page sf-fade-in mx-auto w-full max-w-5xl px-4 @lg:px-6 @3xl:px-8"
        style={{ paddingBlock: 8 }}
      >
        <header className="sf-page-head">
          <h1>Wishlist</h1>
          <p>
            {saved.length > 0
              ? `${saved.length} saved ${saved.length === 1 ? "item" : "items"} from ${design.storeName || "this store"}.`
              : `Items you save from ${design.storeName || "this store"} appear here.`}
          </p>
        </header>

        {saved.length === 0 ? (
          <div className="sf-panel flex flex-col items-center gap-4 py-14 text-center">
            <span className="sf-icon-btn" style={{ height: 56, width: 56 }}>
              <Heart className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Your wishlist is empty</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--s-muted)" }}>
                Tap the heart on any product to keep it for later.
              </p>
            </div>
            <Link href={base} scroll={false} className="sf-btn">
              Continue shopping
            </Link>
          </div>
        ) : (
          <ul
            className="grid grid-cols-2 gap-3 @lg:grid-cols-3 @lg:gap-4 @3xl:grid-cols-4"
            aria-label="Saved products"
          >
            {saved.map((p) => {
              const href = `${base}/products/${p.id}`;
              const onSale = !!p.comparePrice && p.comparePrice > p.price;
              const off = onSale
                ? Math.round((1 - p.price / (p.comparePrice as number)) * 100)
                : 0;
              const soldOut = p.stock === 0;
              const hasVariants = !!p.options?.length;
              const paused = design.vacationMode;
              return (
                <li key={p.id} className="sf-card-motion flex min-w-0 flex-col">
                  <div className="relative">
                    <Link
                      href={href}
                      className="block overflow-hidden"
                      style={{
                        aspectRatio: aspect[design.imageAspectRatio],
                        borderRadius: "var(--sf-radius-md)",
                        background: "var(--s-surface)",
                      }}
                    >
                      <ProductArt product={p} emojiClassName="text-5xl" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleWishlistItem(design.storeSlug, p.id)}
                      aria-label={`Remove ${p.name} from wishlist`}
                      className="sf-icon-btn sf-icon-btn-sm sf-icon-btn-on absolute right-2.5 top-2.5"
                    >
                      <Heart className="h-4 w-4" fill="currentColor" />
                    </button>
                    {(soldOut || onSale) && (
                      <span
                        className={`sf-chip absolute bottom-2.5 left-2.5 ${soldOut ? "sf-chip-dark" : ""}`}
                      >
                        {soldOut ? "Sold out" : `-${off}%`}
                      </span>
                    )}
                  </div>

                  <Link href={href} className="mt-3 block px-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {p.name}
                    </p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[15px] font-semibold">
                      {formatPrice(p.price)}
                      {onSale && (
                        <span
                          className="text-xs font-normal line-through"
                          style={{ color: "var(--s-muted)" }}
                        >
                          {formatPrice(p.comparePrice as number)}
                        </span>
                      )}
                    </p>
                    {hasVariants && (
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--s-muted)" }}
                      >
                        {p.options!.map((o) => o.name).join(", ")} available
                      </p>
                    )}
                  </Link>

                  <div className="mt-3 px-1 pb-1">
                    {soldOut ? (
                      <span
                        className="sf-btn sf-btn-ghost sf-btn-sm w-full"
                        aria-disabled="true"
                      >
                        Sold out
                      </span>
                    ) : hasVariants ? (
                      <Link
                        href={href}
                        className="sf-btn sf-btn-ghost sf-btn-sm w-full"
                      >
                        Choose options
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={paused}
                        onClick={() => {
                          if (!cart.lines.some((l) => l.productId === p.id)) {
                            cart.addItem(p, 1);
                          }
                        }}
                        className="sf-btn sf-btn-sm w-full"
                      >
                        {cart.lines.some((l) => l.productId === p.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <ShoppingBag className="h-4 w-4" />
                        )}
                        {paused
                          ? "Store paused"
                          : cart.lines.some((l) => l.productId === p.id)
                            ? "Added"
                            : "Add to cart"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
