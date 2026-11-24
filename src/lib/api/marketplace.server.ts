/**
 * Server-only marketplace fetching for the home page.
 *
 * Same endpoints and same mapping as lib/api/marketplace.ts (it reuses its
 * mappers), but with two differences that matter on the server:
 *   - Next's data cache: one API call is shared by every visitor for
 *     REVALIDATE_SECONDS, instead of one call per visit.
 *   - A short timeout, so a slow API can never hold the page hostage. When a
 *     call fails the caller simply gets no data and the browser loads it the
 *     normal way (exactly how the home page worked before).
 *
 * Never import this from a client component.
 */
import "server-only";

import {
  toCategory,
  toProduct,
  toStore,
  type Paged,
  type ProductQuery,
  type SellerQuery,
} from "@/lib/api/marketplace";
import type { Category, Product, Store } from "@/types";

/** How long one API answer is reused. Matches the page's own revalidate. */
export const MARKETPLACE_REVALIDATE_SECONDS = 60;

/** Cache tag for everything below, so it can be cleared on demand later. */
export const MARKETPLACE_TAG = "marketplace";

const FETCH_TIMEOUT_MS = 5_000;

const API_BASE_URL = `${(
  process.env.API_INTERNAL_URL ?? "http://localhost:8080"
).replace(/\/+$/, "")}/api/v1`;

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: {
      revalidate: MARKETPLACE_REVALIDATE_SECONDS,
      tags: [MARKETPLACE_TAG],
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Marketplace API answered ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchMarketplaceProductsServer(
  query: ProductQuery,
): Promise<Paged<Product>> {
  const res = await getJson<{
    products?: Parameters<typeof toProduct>[0][];
    page?: number;
    limit?: number;
    total?: number;
  }>(`/marketplace/products${qs({ ...query })}`);
  const items = (res.products ?? []).map(toProduct);
  return {
    items,
    page: res.page ?? query.page ?? 1,
    limit: res.limit ?? query.limit ?? items.length,
    total: res.total ?? items.length,
  };
}

export async function fetchMarketplaceSellersServer(
  query: SellerQuery,
): Promise<Paged<Store>> {
  const res = await getJson<{
    sellers?: Parameters<typeof toStore>[0][];
    page?: number;
    limit?: number;
    total?: number;
  }>(`/marketplace/sellers${qs({ ...query })}`);
  const items = (res.sellers ?? []).map(toStore);
  return {
    items,
    page: res.page ?? query.page ?? 1,
    limit: res.limit ?? query.limit ?? items.length,
    total: res.total ?? items.length,
  };
}

export async function fetchMarketplaceCategoriesServer(): Promise<Category[]> {
  const res = await getJson<{
    categories?: Parameters<typeof toCategory>[0][];
  }>("/marketplace/categories");
  return (res.categories ?? []).map(toCategory);
}
