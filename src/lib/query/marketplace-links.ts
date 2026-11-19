import type { Product, Store } from "@/types";

/**
 * Single source of truth for marketplace -> storefront URLs.
 *
 * Real routes in this app:
 *   /store/[slug]                       seller storefront
 *   /store/[slug]/products/[productId]  product detail (resolved inside that store)
 *
 * The product page is always addressed through its OWN seller's slug, so a
 * product can never link to another seller.
 */
export const storeHref = (store: Pick<Store, "slug">) =>
  `/store/${encodeURIComponent(store.slug)}`;

export const productHref = (product: Pick<Product, "id" | "store">) =>
  `${storeHref(product.store)}/products/${encodeURIComponent(product.id)}`;

export const categoryHref = (slug: string) =>
  `/products?category=${encodeURIComponent(slug)}`;

export function discountPercent(price: number, compareAt?: number): number {
  if (!compareAt || compareAt <= price || price < 0) return 0;
  return Math.round((1 - price / compareAt) * 100);
}
