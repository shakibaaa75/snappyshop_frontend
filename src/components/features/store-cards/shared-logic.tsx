"use client";

import { type CSSProperties, type MouseEvent, type ReactNode } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  variantOptions,
  type VariantProduct,
} from "@/lib/store-design/variants";
import { cn } from "@/lib/utils";
import { type Product } from "@/lib/store-design/types";
import { useCart } from "@/lib/store-design/cart";
import { FOCUS } from "./tokens";
import { type CardCtx } from "./types";

/* ------------------------------------------------------------------ */
/* Shared logic                                                        */
/* ------------------------------------------------------------------ */

export function L({
  on,
  href,
  title,
  className,
  style,
  children,
}: {
  on: boolean;
  href: string;
  title?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (!on) {
    return (
      <span className={className} style={style} title={title}>
        {children}
      </span>
    );
  }
  return (
    <NextLink
      href={href}
      prefetch
      scroll={false}
      title={title}
      aria-label={title}
      className={cn(FOCUS, className)}
      style={style}
    >
      {children}
    </NextLink>
  );
}
export function useCardData(p: Product, ctx: CardCtx) {
  const { d, interactive, categories } = ctx;
  const cart = useCart();
  const router = useRouter();
  // "Added" is derived from the cart itself, so it survives re-renders and
  // page loads, and a second click never adds another unit.
  const added = cart.lines.some((l) => l.productId === p.id);

  const onSale = !!p.comparePrice && p.comparePrice > p.price;
  const off = onSale
    ? Math.round((1 - p.price / (p.comparePrice as number)) * 100)
    : 0;
  const soldOut = p.stock === 0;
  const paused = d.vacationMode;
  const setting = d.cardCustom?.button;
  const mode: "cart" | "buy" | "both" =
    setting === "buy" || setting === "both" ? setting : "cart";
  const buyOnly = mode === "buy";

  /** Returns true when the product can go straight into the cart. */
  const ready = (e: MouseEvent) => {
    e.preventDefault();
    if (!interactive || paused) return false;
    // A product with sizes/colours can't be added blind: the buyer must pick
    // one first, so send them to the product page instead of adding a default.
    if (variantOptions(p as VariantProduct).length > 0) {
      router.push(`/store/${d.storeSlug}/products/${p.id}`);
      return false;
    }
    return true;
  };
  const addToCart = (e: MouseEvent) => {
    if (!ready(e)) return;
    if (added) return;
    cart.addItem(p, 1);
  };
  const buy = (e: MouseEvent) => {
    if (!ready(e)) return;
    // Buy now: put it in the cart (once) and go straight to checkout.
    if (!added) cart.addItem(p, 1);
    router.push(`/store/${d.storeSlug}/checkout`);
  };
  // Single-button cards use `add`: it follows the seller's choice.
  const add = buyOnly ? buy : addToCart;

  return {
    href: `/store/${d.storeSlug}/products/${p.id}`,
    sub: categories.find((c) => c.id === p.categoryId)?.name || d.storeName,
    onSale,
    off,
    soldOut,
    paused,
    // In Buy now mode the button never turns into "Added".
    added: buyOnly ? false : added,
    /** "cart" | "buy" | "both": the seller's button choice. */
    mode,
    /** True only when the card shows Buy now alone. */
    buyNow: buyOnly,
    both: mode === "both",
    /** Button text for single-button cards. */
    label: buyOnly ? "Buy now" : "Add to cart",
    ariaLabel: buyOnly ? `Buy ${p.name} now` : `Add ${p.name} to cart`,
    ariaCart: `Add ${p.name} to cart`,
    ariaBuy: `Buy ${p.name} now`,
    add,
    addToCart,
    buy,
    canAdd: d.showAddToCart && !soldOut,
  };
}
export type CardData = ReturnType<typeof useCardData>;
