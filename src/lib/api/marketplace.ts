/**
 * Marketplace-wide (all sellers) public API client.
 *
 * REQUIRED BACKEND ENDPOINTS (not present in the frontend code base before
 * this change; see CHANGES.md for the full contract):
 *
 *   GET /marketplace/products   ?sort&q&category&page&limit&minReviews&minDiscount&maxDiscount
 *   GET /marketplace/sellers    ?sort&category&page&limit
 *   GET /marketplace/categories
 *
 * minDiscount / maxDiscount (whole percents) and the sellers `category`
 * filter are OPTIONAL for the backend: if it ignores them, the home page
 * still works because deals are also filtered in the browser.
 *
 * Nothing here fabricates data: if an endpoint is missing or fails, the
 * ApiError is thrown to the UI, which shows an error state with retry.
 */
import { apiFetch } from "@/lib/api/http";
import { formatCount } from "@/lib/format";
import type { Category, Product, Store } from "@/types";

export type ProductSort =
  | "relevance"
  | "top_selling"
  | "best_rated"
  | "newest"
  | "price_asc"
  | "price_desc";

export const PRODUCT_SORTS: { value: ProductSort; label: string }[] = [
  { value: "relevance", label: "Most relevant" },
  { value: "top_selling", label: "Top selling" },
  { value: "best_rated", label: "Best rated" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

/** Minimum number of reviews before a product can rank as "best rated". */
export const BEST_RATED_MIN_REVIEWS = 3;

export interface ProductQuery {
  sort?: ProductSort;
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
  minReviews?: number;
  /** Only products discounted by at least this many percent. */
  minDiscount?: number;
  /** Only products discounted by at most this many percent. */
  maxDiscount?: number;
}

export interface SellerQuery {
  sellingCategory?: string;
  sort?: "popular";
  category?: string;
  page?: number;
  limit?: number;
}

export interface Paged<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

/* ---- wire shapes (what the Go API is expected to return) --------------- */

interface WireSeller {
  sellingCategory?: string;
  id?: string;
  slug?: string;
  name?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  productCount?: number;
  completedOrders?: number;
  followers?: number;
}

interface WireProduct {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  comparePrice?: number;
  stock?: number;
  hasVariants?: boolean;
  mainImageUrl?: string;
  imageUrls?: string[];
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  rating?: number;
  reviews?: number;
  sold?: number;
  createdAt?: string;
  seller?: WireSeller;
}

interface WireCategory {
  id?: string;
  slug?: string;
  name?: string;
  emoji?: string;
  imageUrl?: string;
}

/* ---- mapping ------------------------------------------------------------ */

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

function contractError(what: string): Error {
  return new Error(
    `The marketplace API returned ${what}. This is a backend contract problem (see CHANGES.md).`,
  );
}

export function toStore(s: WireSeller | undefined): Store {
  if (!s || !str(s.id) || !str(s.slug) || !str(s.name)) {
    throw contractError("an item without seller id, slug and name");
  }
  const reviewCount = num(s.reviewCount);
  const rating = num(s.rating);
  return {
    id: s.id as string,
    slug: s.slug as string,
    name: s.name as string,
    logo: str(s.logoUrl),
    category: str(s.sellingCategory) || undefined,
    banner: str(s.bannerUrl) || undefined,
    description: str(s.description) || undefined,
    isVerified: s.isVerified === true,
    productCount: typeof s.productCount === "number" ? s.productCount : undefined,
    completedOrders:
      typeof s.completedOrders === "number" ? s.completedOrders : undefined,
    rating: rating > 0 && reviewCount > 0 ? rating : undefined,
    reviewCount: reviewCount > 0 ? reviewCount : undefined,
    followers:
      typeof s.followers === "number" && s.followers > 0
        ? formatCount(s.followers)
        : undefined,
  };
}

export function toProduct(p: WireProduct): Product {
  if (!str(p.id) || !str(p.name)) {
    throw contractError("a product without id and name");
  }
  const store = toStore(p.seller); // throws if the seller link is missing
  const category: Category = {
    id: str(p.categoryId),
    slug: str(p.categorySlug) || str(p.categoryId),
    name: str(p.categoryName),
    icon: "",
  };
  return {
    id: p.id as string,
    slug: str(p.slug),
    title: p.name as string,
    price: num(p.price),
    compareAtPrice: p.comparePrice ? p.comparePrice : undefined,
    images: [
      ...new Set(
        [str(p.mainImageUrl), ...(p.imageUrls ?? []).map(str)].filter(Boolean),
      ),
    ],
    store,
    category,
    rating: num(p.rating),
    reviewCount: num(p.reviews),
    sold: num(p.sold),
    description: str(p.description) || undefined,
    inStock: num(p.stock) > 0,
    hasVariants: p.hasVariants === true,
  };
}

export function toCategory(c: WireCategory): Category {
  if (!str(c.slug) || !str(c.name)) {
    throw contractError("a category without slug and name");
  }
  return {
    id: str(c.id) || (c.slug as string),
    slug: c.slug as string,
    name: c.name as string,
    icon: str(c.emoji),
    image: str(c.imageUrl) || undefined,
  };
}

/* ---- requests ----------------------------------------------------------- */

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const PUBLIC = { skipRefresh: true } as const;

export async function fetchMarketplaceProducts(
  query: ProductQuery,
  signal?: AbortSignal,
): Promise<Paged<Product>> {
  const res = await apiFetch<{
    products: WireProduct[];
    page?: number;
    limit?: number;
    total?: number;
  }>(`/marketplace/products${qs({ ...query })}`, { ...PUBLIC, signal });
  const items = (res.products ?? []).map(toProduct);
  return {
    items,
    page: res.page ?? query.page ?? 1,
    limit: res.limit ?? query.limit ?? items.length,
    total: res.total ?? items.length,
  };
}

export async function fetchMarketplaceSellers(
  query: SellerQuery,
  signal?: AbortSignal,
): Promise<Paged<Store>> {
  const res = await apiFetch<{
    sellers: WireSeller[];
    page?: number;
    limit?: number;
    total?: number;
  }>(`/marketplace/sellers${qs({ ...query })}`, { ...PUBLIC, signal });
  const items = (res.sellers ?? []).map(toStore);
  return {
    items,
    page: res.page ?? query.page ?? 1,
    limit: res.limit ?? query.limit ?? items.length,
    total: res.total ?? items.length,
  };
}

/** No parent: the Main Types. With a Main Type ID: its categories that have products. */
export async function fetchMarketplaceCategories(
  signal?: AbortSignal,
  parent?: string,
): Promise<Category[]> {
  const res = await apiFetch<{ categories: WireCategory[] }>(
    `/marketplace/categories${parent ? `?parent=${encodeURIComponent(parent)}` : ""}`,
    { ...PUBLIC, signal },
  );
  return (res.categories ?? []).map(toCategory);
}