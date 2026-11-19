import type { CSSProperties } from "react";
import {
  fontOptions,
  type ButtonRadius,
  type Category,
  type HomeSection,
  type Product,
  type SortOption,
  type StoreDesign,
} from "./types";

/* ------------------------------------------------------------------ */
/* Color                                                               */
/* ------------------------------------------------------------------ */

export function normalizeHex(input: string, fallback = "#000000"): string {
  let v = (input ?? "").trim();
  if (!v.startsWith("#")) v = `#${v}`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v = "#" + v.slice(1).split("").map((c) => c + c).join("");
  }
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : fallback;
}

function rgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** t = 0 returns a, t = 1 returns b */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const c = (x: number, y: number) =>
    Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick white or near-black text for a given background */
export function readableOn(bg: string): string {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#111111")
    ? "#ffffff"
    : "#111111";
}

/** CSS variables that theme the storefront preview (and the real storefront) */
export function themeVars(d: StoreDesign): CSSProperties {
  const primary = normalizeHex(d.primaryColor, "#064e3b");
  const secondary = normalizeHex(d.secondaryColor, "#10b981");
  const bg = normalizeHex(d.bgColor, "#ffffff");
  const text = normalizeHex(d.textColor, "#111827");
  const font = fontOptions.find((f) => f.id === d.fontFamily) ?? fontOptions[0];

  return {
    "--s-primary": primary,
    "--s-on-primary": readableOn(primary),
    "--s-secondary": secondary,
    "--s-on-secondary": readableOn(secondary),
    "--s-bg": bg,
    "--s-text": text,
    "--s-muted": mix(text, bg, 0.45),
    "--s-border": mix(bg, text, 0.12),
    "--s-surface": mix(bg, text, 0.045),
    "--s-soft": mix(bg, primary, 0.1),
    fontFamily: font.stack,
    backgroundColor: bg,
    color: text,
  } as CSSProperties;
}

export const radiusPx: Record<ButtonRadius, number> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */

export const formatPrice = (n: number) => `৳${n.toLocaleString("en-US")}`;

export const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");

export const initials = (name: string) =>
  (name || "S")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export function loadFont(fontId: string) {
  if (typeof document === "undefined") return;
  const font = fontOptions.find((f) => f.id === fontId);
  if (!font?.google) return;
  const id = `store-font-${font.id.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
  // Already rendered on the server by <StoreFontLink>: nothing to inject.
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/* ------------------------------------------------------------------ */
/* Which products / categories each section shows                      */
/* ------------------------------------------------------------------ */

const byNewest = (a: Product, b: Product) =>
  +new Date(b.createdAt) - +new Date(a.createdAt);
const bySold = (a: Product, b: Product) => b.sold - a.sold;
const byRating = (a: Product, b: Product) =>
  b.rating - a.rating || b.reviews - a.reviews;

const defined = <T,>(v: T | undefined | null): v is T => v != null;

export function sortProducts(list: Product[], sort: SortOption): Product[] {
  const copy = [...list];
  switch (sort) {
    case "popular":
      return copy.sort(bySold);
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    default:
      return copy.sort(byNewest);
  }
}

/** Featured / best sellers / new arrivals */
export function resolveSectionProducts(
  section: HomeSection,
  products: Product[],
): Product[] {
  if (section.source === "manual") {
    const map = new Map(products.map((p) => [p.id, p]));
    return section.productIds.map((id) => map.get(id)).filter(defined);
  }
  const sorter =
    section.id === "bestSellers"
      ? bySold
      : section.id === "newArrivals"
        ? byNewest
        : byRating;
  return [...products].sort(sorter).slice(0, Math.max(1, section.limit || 4));
}

export function resolveAllProducts(
  design: StoreDesign,
  products: Product[],
  limit: number,
): Product[] {
  const sorted = sortProducts(products, design.defaultSort);
  const pinned = design.pinnedProductIds
    .map((id) => sorted.find((p) => p.id === id))
    .filter(defined);
  const rest = sorted.filter((p) => !design.pinnedProductIds.includes(p.id));
  return [...pinned, ...rest].slice(0, Math.max(1, limit));
}

export function categorySales(products: Product[], categories: Category[]) {
  const totals = new Map<string, number>();
  products.forEach((p) =>
    totals.set(p.categoryId, (totals.get(p.categoryId) ?? 0) + p.sold),
  );
  return categories
    .map((category) => ({ category, sold: totals.get(category.id) ?? 0 }))
    .sort((a, b) => b.sold - a.sold);
}

export function resolveCategories(
  design: StoreDesign,
  products: Product[],
  categories: Category[],
): Category[] {
  if (design.categoriesSource === "manual") {
    const map = new Map(categories.map((c) => [c.id, c]));
    return design.categoryIds.map((id) => map.get(id)).filter(defined);
  }
  return categorySales(products, categories)
    .slice(0, Math.max(1, design.categoryLimit))
    .map((x) => x.category);
}

export function resolveSpotlight(
  design: StoreDesign,
  products: Product[],
  categories: Category[],
) {
  const id =
    design.spotlightCategoryId === "auto"
      ? categorySales(products, categories)[0]?.category.id
      : design.spotlightCategoryId;
  const category = categories.find((c) => c.id === id);
  if (!category) return null;
  return {
    category,
    isAuto: design.spotlightCategoryId === "auto",
    products: products.filter((p) => p.categoryId === id).sort(bySold),
  };
}
