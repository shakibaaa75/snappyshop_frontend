import { apiFetch } from "@/lib/api/http";
import { resizeAndUpload, type UploadKind } from "@/lib/api/uploads";

export type VariantImageMode = "shared" | "per-variant";

export interface ProductOptionValue {
  id: string;
  label: string;
  colorHex?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  values: ProductOptionValue[];
}

export interface ProductCombination {
  id: string;
  valueIds: Record<string, string>;
  stock: number;
  imageUrls: string[];
  price?: number;
  sku?: string;
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  description: string;

  /** Seller's own storefront categories. The first one is the primary. */
  categoryId: string;
  categoryName: string;
  /** Optional: products saved before multi-category don't have these. */
  categoryIds?: string[];
  categoryNames?: string[];

  /** Platform-wide category, set by the backend after matching. */
  mainId?: string;
  subId?: string;
  /** Product type text the seller typed, kept by the backend for editing. */
  customSubCategory?: string;

  price: number;
  comparePrice?: number;
  stock: number;
  sku?: string;
  mainImageUrl?: string;
  imageUrls: string[];
  emoji: string;
  hue: number;
  options: ProductOption[];
  combinations: ProductCombination[];
  attributes: ProductAttribute[];
  variantImageMode: VariantImageMode;
  isNewArrival: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  tags: string[];
  isActive: boolean;
  rating: number;
  reviews: number;
  sold: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  slug: string;
  description: string;

  /** Seller's own storefront categories. The first one is the primary. */
  categoryId: string;
  categoryName: string;
  categoryIds: string[];
  categoryNames: string[];

  /** Main Type (one of the 10 fixed ones). Required by the server. */
  mainId: string;
  /** Product type: send an ID when picked, text when typed. */
  subCategoryId: string;
  customSubCategory: string;

  price: number;
  comparePrice: number;
  stock: number;
  sku: string;
  mainImageUrl: string;
  imageUrls: string[];
  emoji: string;
  hue: number;
  options: ProductOption[];
  combinations: ProductCombination[];
  attributes: ProductAttribute[];
  variantImageMode: VariantImageMode;
  isNewArrival: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  tags: string[];
  isActive: boolean;
}

export const sellerProducts = {
  list: () =>
    apiFetch<{ products: SellerProduct[] }>("/seller/products").then((r) =>
      r.products.map(normalizeProduct),
    ),

  create: (input: ProductInput) =>
    apiFetch<{ product: SellerProduct }>("/seller/products", {
      method: "POST",
      body: toBackendShape(input),
    }).then((r) => normalizeProduct(r.product)),

  update: (id: string, input: ProductInput) =>
    apiFetch<{ product: SellerProduct }>(`/seller/products/${id}`, {
      method: "PUT",
      body: toBackendShape(input),
    }).then((r) => normalizeProduct(r.product)),

  remove: (id: string) =>
    apiFetch<void>(`/seller/products/${id}`, { method: "DELETE" }),
};

function toBackendShape(input: ProductInput): ProductInput {
  return input;
}

function normalizeProduct(p: SellerProduct): SellerProduct {
  return {
    ...p,
    categoryName: p.categoryName ?? "",
    // Old products only have one category. Treat it as a list of one.
    categoryIds: Array.isArray(p.categoryIds)
      ? p.categoryIds
      : p.categoryId
        ? [p.categoryId]
        : [],
    categoryNames: Array.isArray(p.categoryNames)
      ? p.categoryNames
      : p.categoryName
        ? [p.categoryName]
        : [],
    mainId: p.mainId ?? "",
    subId: p.subId ?? "",
    customSubCategory: p.customSubCategory ?? "",
    options: Array.isArray(p.options)
      ? p.options.map((o) => ({
          ...o,
          values: Array.isArray(o.values) ? o.values : [],
        }))
      : [],
    combinations: Array.isArray(p.combinations)
      ? p.combinations.map((c) => ({
          ...c,
          valueIds: c.valueIds ?? {},
          imageUrls: Array.isArray(c.imageUrls) ? c.imageUrls : [],
        }))
      : [],
    attributes: Array.isArray(p.attributes) ? p.attributes : [],
    imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    variantImageMode:
      p.variantImageMode === "per-variant" ? "per-variant" : "shared",
  };
}

export function slugifyProduct(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ------------------------------------------------------------------ */
/* Image upload — Cloudflare R2 (via the backend's presigned link)     */
/* ------------------------------------------------------------------ */

/**
 * Resize an image in the browser, upload it to R2 and return its public
 * HTTPS URL. Defaults to a product image; pass another kind for other uses
 * (for example "category").
 */
export function uploadImageFile(
  file: File,
  kind: UploadKind = "product",
): Promise<string> {
  return resizeAndUpload(file, kind, { maxSize: 1600, quality: 0.85 });
}