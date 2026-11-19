/**
 * Server-only data fetching for the storefront.
 *
 * Server Components can't use relative URLs, so this file hits the Go API
 * directly. It must never be imported from a client component.
 */
import "server-only";

import { cache } from "react";
import type { Category, Product, StoreDesign } from "./types";
import { normalizeDesign } from "./types";

// Server-side calls go straight to the Go API (a relative /api/v1 can't be
// resolved in Node). The browser uses the same-origin proxy instead.
const API_BASE_URL = `${(
  process.env.API_INTERNAL_URL ?? "http://localhost:8080"
).replace(/\/+$/, "")}/api/v1`;

export interface PublicStoreData {
  design: StoreDesign;
  products: Product[];
  categories: Category[];
}

interface BackendProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: number;
  comparePrice?: number;
  stock: number;
  mainImageUrl?: string;
  imageUrls: string[];
  emoji: string;
  hue: number;
  options?: Array<{
    id: string;
    name: string;
    values: Array<{ id: string; label: string; colorHex?: string }>;
  }>;
  combinations?: Array<{
    id: string;
    valueIds: Record<string, string>;
    stock: number;
    imageUrls: string[];
    price?: number;
    sku?: string;
  }>;
  attributes?: Array<{ key: string; value: string }>;
  variantImageMode?: string;
  isNewArrival: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  rating: number;
  reviews: number;
  sold: number;
  createdAt: string;
}

interface BackendCategory {
  id: string;
  name: string;
  imageUrl?: string | null;
}

function toPublicProduct(p: BackendProduct): Product {
  const badge = p.isNewArrival
    ? "New Arrival"
    : p.isBestSeller
      ? "Best Seller"
      : p.isFeatured
        ? "Featured"
        : undefined;

  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    price: p.price,
    comparePrice: p.comparePrice || undefined,
    imageUrl: p.mainImageUrl || p.imageUrls?.[0] || undefined,
    mainImageUrl: p.mainImageUrl || undefined,
    imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
    emoji: p.emoji || "🛍️",
    hue: p.hue ?? 210,
    rating: p.rating ?? 0,
    reviews: p.reviews ?? 0,
    sold: p.sold ?? 0,
    stock: p.stock ?? 0,
    createdAt: p.createdAt,
    description: p.description,
    badge,
    options: p.options ?? [],
    combinations: p.combinations ?? [],
    attributes: p.attributes ?? [],
    variantImageMode:
      p.variantImageMode === "per-variant" ? "per-variant" : "shared",
  };
}

/**
 * How long Next may serve the store's PRODUCTS and CATEGORIES from its data
 * cache before re-checking the API. This keeps navigation fast. The store
 * itself (see getFresh) is never cached.
 */
const STORE_REVALIDATE_SECONDS = 30;

const getJson = (url: string, slug: string) =>
  fetch(url, {
    next: { revalidate: STORE_REVALIDATE_SECONDS, tags: [`store:${slug}`] },
    headers: { Accept: "application/json" },
  });

/**
 * The store itself is never cached. A cached copy would keep serving a shop
 * after its address was retired, because Next keeps the old entry when the
 * refresh answers 404. Fresh means an old address is a real 404.
 */
const getFresh = (url: string) =>
  fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

/**
 * Fetch a published store by slug on the server.
 * Returns null if the store doesn't exist (caller renders 404).
 */
export const fetchStoreServer = cache(async function fetchStoreServer(
  slug: string,
): Promise<PublicStoreData | null> {
  const encoded = encodeURIComponent(slug);

  const [designRes, productsRes, categoriesRes] = await Promise.all([
    getFresh(`${API_BASE_URL}/store/${encoded}`),
    getJson(`${API_BASE_URL}/store/${encoded}/products`, slug).catch(() => null),
    getJson(`${API_BASE_URL}/store/${encoded}/categories`, slug).catch(() => null),
  ]);

  if (!designRes.ok) {
    return null;
  }

  const designJson = (await designRes.json()) as {
    design: Record<string, unknown>;
  };
  // The address that just resolved is the current one. Never trust a copy of
  // the address stored inside the design payload for building links.
  const design = {
    ...normalizeDesign(designJson.design),
    storeSlug: slug.trim().toLowerCase(),
  };

  // No mock fallback: if products can't load, the store shows none.
  let rawProducts: BackendProduct[] = [];
  if (productsRes && productsRes.ok) {
    try {
      const prodsJson = (await productsRes.json()) as {
        products?: BackendProduct[];
      };
      rawProducts = prodsJson.products ?? [];
    } catch {
      rawProducts = [];
    }
  }
  const products = rawProducts.map(toPublicProduct);

  let categories: Category[] | null = null;
  if (categoriesRes && categoriesRes.ok) {
    try {
      const catsJson = (await categoriesRes.json()) as
        | { categories?: BackendCategory[] }
        | BackendCategory[];
      const rows = Array.isArray(catsJson)
        ? catsJson
        : (catsJson.categories ?? []);
      categories = rows.map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl ?? null,
      }));
    } catch {
      categories = null;
    }
  }

  if (categories === null) {
    // Endpoint unreachable: build names from the products (no images).
    const seen = new Map<string, Category>();
    for (const p of rawProducts) {
      if (p.categoryId && !seen.has(p.categoryId)) {
        seen.set(p.categoryId, {
          id: p.categoryId,
          name: p.categoryName || "Category",
          imageUrl: null,
        });
      }
    }
    categories = [...seen.values()];
  }

  return { design, products, categories };
});

/**
 * Fetch a single product on the server for the product detail page.
 * Returns null if the store or product doesn't exist.
 */
export async function fetchProductServer(
  slug: string,
  productId: string,
): Promise<{
  store: PublicStoreData;
  product: Product;
} | null> {
  const store = await fetchStoreServer(slug);
  if (!store) return null;

  const product = store.products.find((p) => p.id === productId);
  if (!product) return null;

  return { store, product };
}