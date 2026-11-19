import { apiFetch } from "@/lib/api/http";
import { getVisitorId } from "@/lib/api/analytics-visitor";
import { getTrafficSource } from "@/lib/traffic-source";

export type DailyViewRow = {
  date: string; // "YYYY-MM-DD"
  views: number;
  addToCart: number;
  // New. Optional so an older API that doesn't send them still type-checks.
  visits?: number;
  clicks?: number;
  purchases?: number;
};
export type ProductViewRow = { id: string; name: string; views: number };
export type ProductCartRow = {
  id: string;
  name: string;
  addToCart: number;
  views: number;
  rate: number; // added ÷ views, in %
};
export type TrendingRow = {
  id: string;
  name: string;
  views: number;
  orders: number;
  growth: number;
};
export type TrafficRow = { source: string; label: string; count: number };
export type KeywordRow = { term: string; count: number };
export type ComparisonRow = {
  id: string;
  name: string;
  views: number;
  addToCart: number;
  cartRate: number; // added ÷ views, in %
  orders: number;
  revenue: number;
  trending: boolean;
};
export type MonthlyRow = { month: string; orders: number; revenue: number };

/** Store funnel, last 30 days. */
export type FunnelStats = {
  visits: number; // store visits (one per visitor, per source, per day)
  visitors: number; // unique visitors
  productViews: number;
  productClicks: number;
  addToCart: number;
  purchases: number; // orders placed
  purchaseValue: number; // total of those orders
  conversionRate: number; // purchases ÷ visits, in %
  cartToPurchase: number; // purchases ÷ add to cart, in %
};

/** One traffic source with its own funnel, last 30 days. */
export type SourceStatRow = {
  source: string;
  label: string;
  visits: number;
  visitors: number;
  productViews: number;
  productClicks: number;
  addToCart: number;
  purchases: number;
  revenue: number; // value of orders placed from this source
  conversionRate: number; // purchases ÷ visits, in %
};

/* ---- Ad platforms (Meta, TikTok), last 30 days ---- */

export type PlatformId = "meta" | "tiktok";

export type PlatformTotals = {
  visits: number;
  views: number;
  clicks: number;
  addToCart: number;
  purchases: number; // orders placed
  purchaseValue: number;
  conversionRate: number; // purchases ÷ visits, in %
  cartToPurchase: number; // purchases ÷ add to cart, in %
};

/** One source inside a platform, e.g. Facebook and Instagram inside Meta. */
export type PlatformChannel = {
  source: string;
  label: string;
  visits: number;
  views: number;
  clicks: number;
  addToCart: number;
  purchases: number;
  revenue: number;
};

export type PlatformDay = {
  date: string; // "YYYY-MM-DD"
  visits: number;
  views: number;
  clicks: number;
  addToCart: number;
  purchases: number;
};

export type PlatformStats = {
  platform: PlatformId;
  label: string;
  totals: PlatformTotals;
  channels: PlatformChannel[];
  daily: PlatformDay[]; // oldest first
};

export type AnalyticsOverview = {
  overview: {
    views: number;
    addToCartRate: number;
    orders30: number;
    orderPerView: number; // orders ÷ product views, in %
    orderPerCart: number; // orders ÷ add to cart, in %
    monthly: MonthlyRow[];
    confirmRate: number;
    addToCartCount: number; // add-to-cart events, last 30 days
    confirmed30: number; // orders placed (not cancelled), last 30 days
  };
  dailyViews: DailyViewRow[]; // one item per day, oldest first
  productViews: ProductViewRow[];
  productCarts: ProductCartRow[];
  trendingProducts: TrendingRow[];
  trafficSources: TrafficRow[];
  searchKeywords: KeywordRow[];
  comparisons: ComparisonRow[];
  // New. Optional: an older API won't send them.
  funnel?: FunnelStats;
  sources?: SourceStatRow[];
  platforms?: PlatformStats[];
};

export type AnalyticsEventKind =
  | "product_view"
  | "product_click"
  | "add_to_cart"
  | "search"
  | "traffic";
// "purchase" is not here on purpose: the server records it when an order is placed.

export type TrackAnalyticsInput = {
  storeSlug: string;
  kind: AnalyticsEventKind;
  productId?: string;
  term?: string;
  source?: string;
};

/* ------------------------------------------------------------------ */
/* Seller: analytics + pixel settings                                  */
/* ------------------------------------------------------------------ */

export type TrackingSettings = {
  metaPixelId: string; // "" = off
  tiktokPixelId: string; // "" = off
  requireConsent: boolean; // ask visitors before using pixels / device ID
};

export const sellerAnalytics = {
  overview: () => apiFetch<AnalyticsOverview>("/seller/analytics/overview"),
};

export const sellerTracking = {
  get: () => apiFetch<TrackingSettings>("/seller/tracking-settings"),
  save: (settings: TrackingSettings) =>
    apiFetch<TrackingSettings>("/seller/tracking-settings", {
      method: "PUT",
      body: settings,
    }),
};

/* ------------------------------------------------------------------ */
/* Public storefront                                                   */
/* ------------------------------------------------------------------ */

/** GET /store/:slug/tracking: the pixels THIS store uses (public, no login). */
export function fetchPublicTracking(slug: string): Promise<TrackingSettings> {
  return apiFetch<TrackingSettings>(
    `/store/${encodeURIComponent(slug)}/tracking`,
    { skipRefresh: true },
  );
}

/**
 * Public track endpoint - pass a plain object (apiFetch JSON.stringifies it).
 * The traffic source is added automatically. The visitor ID is "" unless the
 * visitor consented, in which case the API counts them anonymously.
 */
export function trackAnalyticsEvent(input: TrackAnalyticsInput): Promise<void> {
  return apiFetch<void>("/analytics/events", {
    method: "POST",
    skipRefresh: true,
    body: {
      storeSlug: input.storeSlug,
      kind: input.kind,
      productId: input.productId,
      term: input.term,
      source: input.source ?? getTrafficSource(),
      visitorId: getVisitorId(),
    },
  });
}