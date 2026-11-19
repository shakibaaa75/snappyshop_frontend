import type { ProductSort } from "@/lib/api/marketplace";

/**
 * Pure helpers for the marketplace homepage category navigation.
 *
 * Platform category IDs (from the existing taxonomy) are two-level:
 *   "fashion"          a Main Type
 *   "fashion.hoodie"   a Category inside that Main Type
 *
 * The homepage keeps ONE query value, `?category=`, which holds either a Main
 * Type ID or a full Category ID. That is the same convention the backend
 * product filter and /products already use, so old links keep working.
 * `sort` and `page` live in the URL too, so pagination survives reloads,
 * back/forward and shared links.
 */

/** Main Type ID of any platform ID ("fashion.hoodie" -> "fashion"). */
export const mainIdOf = (id: string) => id.split(".")[0] ?? "";

/** true for "fashion.hoodie", false for "fashion" and for custom "c-xyz" ids. */
export const isCategoryId = (id: string) => id.includes(".");

export interface HomeNavState {
  /** Main Type ID or Category ID. Empty = the normal home page. */
  category?: string;
  sort?: ProductSort;
  page?: number;
}

/** Home page URL for a navigation state. Defaults are left out of the URL. */
export function homeHref({ category, sort, page }: HomeNavState): string {
  const sp = new URLSearchParams();
  if (category) sp.set("category", category);
  if (category && sort && sort !== "relevance") sp.set("sort", sort);
  if (category && page && page > 1) sp.set("page", String(page));
  const s = sp.toString();
  return s ? `/?${s}` : "/";
}

/** Window of page numbers with gaps: 1 … 4 5 [6] 7 8 … 20. */
export function pageWindow(page: number, pages: number): (number | "gap")[] {
  const keep = new Set<number>([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => keep.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => keep.add(n));
  const nums = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}
