/**
 * Data layer for the store design editor.
 *
 * Talks to the Go API for store design, published designs, and the seller's
 * products. Images are uploaded to Cloudflare R2.
 *
 * No mock data anywhere: a failed request throws, and an empty store stays empty.
 */
import { apiFetch, ApiError } from "@/lib/api/http";
import { resizeAndUpload, type UploadKind } from "@/lib/api/uploads";
import {
  normalizeDesign,
  type Category,
  type Product,
  type StoreDesign,
} from "./types";

/* ------------------------------------------------------------------ */
/* Store address (slug) change metadata                                */
/* ------------------------------------------------------------------ */

export interface SlugChangeInfo {
  canChangeSlug: boolean;
  nextSlugChangeAt?: string | null;
  currentSlug?: string;
  /** Shop name rules: one change after registration, then a 13-day lock. */
  currentName?: string;
  canChangeName: boolean;
  nameChangesRemaining: number;
  nextNameChangeAt?: string | null;
  nameChangeDisclaimer?: string;
}

type BackendDraftResponse = {
  status?: string;
  design?: Record<string, unknown> | null;
  canChangeSlug?: boolean;
  nextSlugChangeAt?: string | null;
  currentSlug?: string;
  currentName?: string;
  canChangeName?: boolean;
  nameChangesRemaining?: number;
  nextNameChangeAt?: string | null;
  nameChangeDisclaimer?: string;
};

function slugInfoFrom(res: BackendDraftResponse | null | undefined): SlugChangeInfo {
  return {
    canChangeSlug: res?.canChangeSlug !== false,
    nextSlugChangeAt: res?.nextSlugChangeAt ?? null,
    currentSlug: res?.currentSlug || undefined,
    currentName: res?.currentName || undefined,
    canChangeName: res?.canChangeName !== false,
    nameChangesRemaining: res?.nameChangesRemaining ?? 1,
    nextNameChangeAt: res?.nextNameChangeAt ?? null,
    nameChangeDisclaimer: res?.nameChangeDisclaimer || undefined,
  };
}

export function isSlugCooldownError(err: unknown): err is ApiError {
  return (
    err instanceof ApiError &&
    (err.code === "SLUG_CHANGE_COOLDOWN" ||
      (err.status === 403 &&
        typeof err.message === "string" &&
        /store address again/i.test(err.message)))
  );
}

export function slugCooldownMessage(
  err?: unknown,
  info?: SlugChangeInfo,
): string {
  if (err && isSlugCooldownError(err)) {
    return String(err.fields?.storeSlug || err.message);
  }
  if (info?.nextSlugChangeAt) {
    const d = new Date(info.nextSlugChangeAt);
    if (!Number.isNaN(d.getTime())) {
      return `You can change your store address again on ${d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }
  }
  return "You can’t change your store address yet. Please try again later.";
}

/* ------------------------------------------------------------------ */
/* Seller-authenticated (draft + publish + address)                    */
/* ------------------------------------------------------------------ */

/** GET /seller/store-design — returns null if the seller has no draft yet. */
export async function loadDraft(): Promise<StoreDesign | null> {
  const { design } = await loadDraftWithMeta();
  return design;
}

/** GET /seller/store-design including slug-change cooldown metadata. */
export async function loadDraftWithMeta(): Promise<{
  design: StoreDesign | null;
  slugInfo: SlugChangeInfo;
}> {
  try {
    const res = await apiFetch<BackendDraftResponse>("/seller/store-design", {
      skipRefresh: false,
    });
    return {
      design: res.design ? normalizeDesign(res.design) : null,
      slugInfo: slugInfoFrom(res),
    };
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return {
        design: null,
        slugInfo: { canChangeSlug: true, canChangeName: true, nameChangesRemaining: 1 },
      };
    }
    throw err;
  }
}

/** PUT /seller/store-design */
export async function saveDraft(design: StoreDesign): Promise<SlugChangeInfo> {
  const res = await apiFetch<BackendDraftResponse>("/seller/store-design", {
    method: "PUT",
    body: { design },
  });
  return slugInfoFrom(res);
}

/** POST /seller/store-design/publish */
export async function publishDesign(design: StoreDesign): Promise<SlugChangeInfo> {
  const res = await apiFetch<BackendDraftResponse>("/seller/store-design/publish", {
    method: "POST",
    body: { design },
  });
  return slugInfoFrom(res);
}

/**
 * PUT /seller/store-address — change only the public store address.
 * Previous address becomes permanently invalid (404).
 */
export async function changeStoreAddress(storeSlug: string): Promise<SlugChangeInfo> {
  const res = await apiFetch<BackendDraftResponse>("/seller/store-address", {
    method: "PUT",
    body: { storeSlug: storeSlug.trim().toLowerCase() },
  });
  return slugInfoFrom(res);
}

/** Fallback disclaimer; the server's own text is used when it sent one. */
export const NAME_CHANGE_DISCLAIMER =
  "You can change your shop name only once, and after changing it you will not be able to change it again for 13 days. Your shop URL will change immediately and the old URL will stop working (404).";

/** Web address a shop name turns into (mirrors the server's rule). */
export function shopUrlSlug(name: string): string {
  const out = name
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return out;
}

/**
 * PUT /seller/store-name — rename the shop. The server rebuilds the shop URL
 * from the new name at once and retires the old URL (404). `acknowledgeLock`
 * must be true: the seller confirmed the 13-day disclaimer.
 */
export async function changeShopName(input: {
  storeName: string;
  storeSlug?: string;
  acknowledgeLock: boolean;
}): Promise<SlugChangeInfo> {
  const res = await apiFetch<BackendDraftResponse>("/seller/store-name", {
    method: "PUT",
    body: {
      storeName: input.storeName.trim(),
      ...(input.storeSlug ? { storeSlug: input.storeSlug.trim().toLowerCase() } : {}),
      acknowledgeLock: input.acknowledgeLock,
    },
  });
  return slugInfoFrom(res);
}

/** Readable text for a failed rename. */
export function shopNameErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return String(
      err.fields?.storeName || err.fields?.storeSlug || err.message,
    );
  }
  return "Could not change the shop name. Please try again.";
}

/* ------------------------------------------------------------------ */
/* Backend shapes + mapping                                            */
/* ------------------------------------------------------------------ */

export interface PublicStore {
  design: StoreDesign;
  products: Product[];
  categories: Category[];
}

// Shape returned by the Go API for a product.
interface BackendProduct {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  mainImageUrl?: string;
  imageUrls?: string[];
  emoji?: string;
  hue?: number;
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
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  rating?: number;
  reviews?: number;
  sold?: number;
  createdAt: string;
}

// Shape returned by the Go API for a category.
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

function toPublicCategory(c: BackendCategory): Category {
  return { id: c.id, name: c.name, imageUrl: c.imageUrl ?? null };
}

/** Accepts either `{ products: [...] }` or a bare array. */
function unwrapProducts(
  res: { products?: BackendProduct[] } | BackendProduct[],
): BackendProduct[] {
  return Array.isArray(res) ? res : (res.products ?? []);
}

/** Accepts either `{ categories: [...] }` or a bare array. */
function unwrapCategories(
  res: { categories?: BackendCategory[] } | BackendCategory[],
): BackendCategory[] {
  return Array.isArray(res) ? res : (res.categories ?? []);
}

/** Build categories from product rows when no categories endpoint works. */
function categoriesFromProducts(rows: BackendProduct[]): Category[] {
  const seen = new Map<string, Category>();
  for (const p of rows) {
    if (p.categoryId && !seen.has(p.categoryId)) {
      seen.set(p.categoryId, {
        id: p.categoryId,
        name: p.categoryName || "Category",
        imageUrl: null,
      });
    }
  }
  return [...seen.values()];
}

const isNotFound = (err: unknown) =>
  err instanceof ApiError && (err.status === 404 || err.status === 405);

/* ------------------------------------------------------------------ */
/* Public storefront                                                   */
/* ------------------------------------------------------------------ */

/** GET /store/:slug — public. Throws ApiError(404) if not published. */
export async function fetchPublicStore(slug: string): Promise<PublicStore> {
  const s = encodeURIComponent(slug);

  // Fire all three requests at once. The categories call is optional: if it
  // fails we build names from the products, so its rejection must not fail
  // the whole load.
  const [res, prods, catsResult] = await Promise.all([
    apiFetch<{ design: Record<string, unknown> }>(`/store/${s}`, {
      skipRefresh: true,
    }),
    apiFetch<{ products: BackendProduct[] }>(`/store/${s}/products`, {
      skipRefresh: true,
    }),
    apiFetch<{ categories: BackendCategory[] } | BackendCategory[]>(
      `/store/${s}/categories`,
      { skipRefresh: true },
    ).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
  ]);

  // The address that just resolved is the current one. Never trust a copy of
  // the address stored inside the design payload for building links.
  const design = { ...normalizeDesign(res.design), storeSlug: slug.trim().toLowerCase() };
  const rawProducts = prods.products ?? [];
  const products = rawProducts.map(toPublicProduct);
  const categories = catsResult.ok
    ? unwrapCategories(catsResult.value).map(toPublicCategory)
    : categoriesFromProducts(rawProducts);

  return { design, products, categories };
}

/* ------------------------------------------------------------------ */
/* Catalogue for the editor (real data, no mock)                       */
/* ------------------------------------------------------------------ */

/**
 * The seller's own products, for the editor preview and the pickers.
 *
 * Tries GET /seller/products first. If that route doesn't exist and a store
 * slug is given, falls back to the public GET /store/:slug/products.
 * Pass the slug from the editor URL (e.g. "sha").
 */
async function fetchRawProducts(slug?: string): Promise<BackendProduct[]> {
  try {
    const res = await apiFetch<
      { products: BackendProduct[] } | BackendProduct[]
    >("/seller/products");
    return unwrapProducts(res);
  } catch (err) {
    if (!slug || !isNotFound(err)) throw err;
    const res = await apiFetch<{ products: BackendProduct[] }>(
      `/store/${encodeURIComponent(slug)}/products`,
      { skipRefresh: true },
    );
    return unwrapProducts(res);
  }
}

export async function fetchProducts(slug?: string): Promise<Product[]> {
  const rows = await fetchRawProducts(slug);
  return rows.map(toPublicProduct);
}

/**
 * The seller's categories. Tries GET /seller/categories, then the public
 * categories route, and finally builds categories from the products.
 */
export async function fetchCategories(slug?: string): Promise<Category[]> {
  try {
    const res = await apiFetch<
      { categories: BackendCategory[] } | BackendCategory[]
    >("/seller/categories");
    return unwrapCategories(res).map(toPublicCategory);
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }

  if (slug) {
    try {
      const res = await apiFetch<
        { categories: BackendCategory[] } | BackendCategory[]
      >(`/store/${encodeURIComponent(slug)}/categories`, {
        skipRefresh: true,
      });
      return unwrapCategories(res).map(toPublicCategory);
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
  }

  return categoriesFromProducts(await fetchRawProducts(slug));
}

/* ------------------------------------------------------------------ */
/* Image upload — Cloudflare R2                                        */
/* ------------------------------------------------------------------ */

/**
 * Resize in the browser, upload to R2 and return the public URL (it used to
 * return a base64 data URL). Pass `kind` so the file lands in the right
 * folder: "seller_cover" (default), "seller_profile" or "homepage".
 */
export function uploadImage(
  file: File,
  maxSize = 1600,
  quality = 0.8,
  kind: UploadKind = "seller_cover",
): Promise<string> {
  return resizeAndUpload(file, kind, { maxSize, quality });
}