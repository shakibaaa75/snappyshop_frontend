/**
 * The marketplace queries the home page runs, in ONE place.
 *
 * The server (app/(public)/page.tsx) prefetches exactly these queries and the
 * browser sections (HomeSections.tsx) run exactly these queries. React Query
 * matches them by key, so the data fetched on the server is used as-is and
 * nothing is requested again after the page loads. If you change a value here,
 * both sides change together; never copy these numbers into a component.
 *
 * No "use client" and no server-only code: both sides import this file.
 */
import type { ProductQuery, ProductSort } from "@/lib/api/marketplace";

/** Deals above this percent are hidden (likely fake "compare at" prices). */
export const MAX_DEAL_DISCOUNT = 40;

/** Products per "Load more" page in Recommended for you. */
export const RECOMMENDED_PAGE = 30;

/** Products shown in each home product row. */
export const HOME_ROW_LIMIT = 12;

/** Featured sellers shown on the home page. */
export const FEATURED_SELLERS_LIMIT = 6;

/** `sort` is required here (the Top Selling row always has one). */
export const TOP_SELLING_QUERY: ProductQuery & { sort: ProductSort } = {
  sort: "top_selling",
  limit: HOME_ROW_LIMIT,
};

export const BIG_DEALS_QUERY: ProductQuery = {
  sort: "newest",
  // Fetch more than we show: the discount filter can drop many items.
  limit: 40,
  minDiscount: 1,
  maxDiscount: MAX_DEAL_DISCOUNT,
};

/** First page of "Recommended for you" (the default, no category chosen). */
export const RECOMMENDED_QUERY: Omit<ProductQuery, "page"> = {
  sort: "relevance",
  limit: RECOMMENDED_PAGE,
};