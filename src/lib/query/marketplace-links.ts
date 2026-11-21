import type { Product, Store } from "@/types";

export const storeHref = (store: Pick<Store, "slug">) =>
  `/store/${encodeURIComponent(store.slug)}`;

export const marketplaceProductHref = (slug: string, id: string) =>
  `/products/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`;

export const productHref = (product: Pick<Product, "id" | "store">) =>
  marketplaceProductHref(product.store.slug, product.id);

export const categoryHref = (slug: string) =>
  `/products?category=${encodeURIComponent(slug)}`;

export function discountPercent(price: number, compareAt?: number): number {
  if (!compareAt || compareAt <= price || price < 0) return 0;
  return Math.round((1 - price / compareAt) * 100);
}
