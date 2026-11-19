import type {
  ProductAttribute,
  ProductCombination,
  ProductOption,
  VariantImageMode,
} from "@/lib/api/products";
import type { Product } from "@/lib/store-design/types";

/**
 * The public Product must carry these fields (see notes in the reply).
 * They are optional here so simple products without variants keep working.
 */
export type VariantProduct = Product & {
  options?: ProductOption[];
  combinations?: ProductCombination[];
  attributes?: ProductAttribute[];
  variantImageMode?: VariantImageMode;
  mainImageUrl?: string;
  imageUrls?: string[];
  imageUrl?: string;
  sku?: string;
};

/** optionId -> valueId */
export type Selection = Record<string, string>;
export type ValueState = "available" | "soldout" | "unavailable";

export const isColorName = (name: string) =>
  ["color", "colour"].includes(name.trim().toLowerCase());

/** Options shoppers can choose between. Empty when the product has no usable variants. */
export function variantOptions(p: VariantProduct): ProductOption[] {
  if (!p.combinations || p.combinations.length === 0) return [];
  return (p.options ?? []).filter((o) => o.name?.trim() && o.values?.length > 0);
}

const matches = (c: ProductCombination, opts: ProductOption[], sel: Selection) =>
  opts.every((o) => c.valueIds[o.id] === sel[o.id]);

export function findCombination(p: VariantProduct, sel: Selection): ProductCombination | null {
  const opts = variantOptions(p);
  if (opts.length === 0) return null;
  return (p.combinations ?? []).find((c) => matches(c, opts, sel)) ?? null;
}

/** Starts on the first variant that is in stock, so shoppers land on something buyable. */
export function initialSelection(p: VariantProduct): Selection {
  const opts = variantOptions(p);
  if (opts.length === 0) return {};
  const combos = p.combinations ?? [];
  const best = combos.find((c) => c.stock > 0 && opts.every((o) => c.valueIds[o.id])) ?? combos[0];
  if (best && opts.every((o) => best.valueIds[o.id])) {
    return Object.fromEntries(opts.map((o) => [o.id, best.valueIds[o.id]]));
  }
  return Object.fromEntries(opts.map((o) => [o.id, o.values[0].id]));
}

/** True when the selection still points at real options and values. */
export function isValidSelection(p: VariantProduct, sel: Selection): boolean {
  return variantOptions(p).every((o) => o.values.some((v) => v.id === sel[o.id]));
}

/**
 * Picks a value and keeps the other choices where possible. If that exact
 * combination doesn't exist, the closest existing one is used.
 */
export function selectValue(
  p: VariantProduct,
  sel: Selection,
  optionId: string,
  valueId: string,
): Selection {
  const opts = variantOptions(p);
  const candidates = (p.combinations ?? []).filter((c) => c.valueIds[optionId] === valueId);
  if (candidates.length === 0) return { ...sel, [optionId]: valueId };

  const score = (c: ProductCombination) =>
    opts.filter((o) => o.id !== optionId && c.valueIds[o.id] === sel[o.id]).length * 10 +
    (c.stock > 0 ? 1 : 0);
  const best = candidates.reduce((a, b) => (score(b) > score(a) ? b : a));
  return Object.fromEntries(opts.map((o) => [o.id, best.valueIds[o.id] ?? sel[o.id]]));
}

/** How a value looks if the shopper picked it now, keeping their other choices. */
export function valueState(
  p: VariantProduct,
  sel: Selection,
  optionId: string,
  valueId: string,
): ValueState {
  const c = findCombination(p, { ...sel, [optionId]: valueId });
  if (!c) return "unavailable";
  return c.stock > 0 ? "available" : "soldout";
}

export const comboLabel = (p: VariantProduct, c: ProductCombination | null): string =>
  !c
    ? ""
    : variantOptions(p)
        .map((o) => o.values.find((v) => v.id === c.valueIds[o.id])?.label)
        .filter(Boolean)
        .join(" / ");

export const effectivePrice = (p: VariantProduct, c: ProductCombination | null): number =>
  c?.price && c.price > 0 ? c.price : p.price;

/** Lowest price and whether prices differ, for "From ৳X" on product cards. */
export function priceFrom(p: VariantProduct): { min: number; varies: boolean } {
  const combos = variantOptions(p).length ? (p.combinations ?? []) : [];
  if (combos.length === 0) return { min: p.price, varies: false };
  const prices = combos.map((c) => (c.price && c.price > 0 ? c.price : p.price));
  const min = Math.min(...prices);
  return { min, varies: prices.some((x) => x !== min) };
}

/** The variant's own photos when set, otherwise the product gallery. */
export function productImages(p: VariantProduct, c: ProductCombination | null): string[] {
  const own =
    p.variantImageMode === "per-variant" && c
      ? (c.imageUrls ?? []).filter((u) => u?.trim())
      : [];
  if (own.length > 0) return own;
  const shared = [p.mainImageUrl, ...(p.imageUrls ?? []), p.imageUrl].filter(
    (u): u is string => !!u && u.trim().length > 0,
  );
  return [...new Set(shared)];
}

/**
 * Every photo of the product for the gallery: the main image first, then the
 * rest of the gallery, then any photo that only a variant has. No repeats.
 * Picking a variant does not change this list, it only jumps to a photo in it.
 */
export function allProductImages(p: VariantProduct): string[] {
  const own =
    p.variantImageMode === "per-variant"
      ? (p.combinations ?? []).flatMap((c) => c.imageUrls ?? [])
      : [];
  const urls = [...productImages(p, null), ...own].filter(
    (u): u is string => !!u && u.trim().length > 0,
  );
  return [...new Set(urls.map((u) => u.trim()))];
}

/** Position of a variant's first photo in `images`, or -1 when it has none. */
export function variantImageIndex(
  images: string[],
  c: ProductCombination | null,
): number {
  if (!c) return -1;
  const at = (c.imageUrls ?? [])
    .map((u) => u?.trim())
    .filter(Boolean)
    .map((u) => images.indexOf(u))
    .filter((i) => i >= 0);
  return at.length ? Math.min(...at) : -1;
}
