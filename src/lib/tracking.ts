/**
 * One place to record store events. Each function does two things:
 *
 *   1. sends the event to the store's own analytics (the seller's dashboard)
 *   2. sends the matching standard event to the seller's Meta / TikTok pixel,
 *      ONLY if the visitor allows it (see lib/consent.ts)
 *
 * Call these from the storefront instead of calling pixelTrack or
 * trackAnalyticsEvent directly. All of them are safe to call at any time:
 * they never throw and never block the page.
 */
import { trackAnalyticsEvent } from "@/lib/api/analytics";
import { getVisitorId, shouldCountEvent } from "@/lib/api/analytics-visitor";
import { pixelTrack, pixelTrackCustom } from "@/lib/meta-pixel";
import { ttqTrack } from "@/lib/tiktok-pixel";
import { trackingRuntime } from "@/lib/consent";
import { getTrafficSource } from "@/lib/traffic-source";

export const STORE_CURRENCY = "BDT";

export interface TrackedProduct {
  id: string;
  name: string;
  price?: number;
  categoryName?: string;
}

export interface TrackedOrder {
  id: string;
  total: number;
  lines: Array<{ productId: string; name: string; qty: number; price: number }>;
}

/** Fire-and-forget: a failed tracking call must never show an error to a buyer. */
function send(input: Parameters<typeof trackAnalyticsEvent>[0]) {
  trackAnalyticsEvent(input).catch(() => {});
}

function contentParams(p: TrackedProduct, qty = 1) {
  const value = (p.price ?? 0) * qty;
  return {
    meta: {
      content_ids: [p.id],
      content_name: p.name,
      content_type: "product",
      content_category: p.categoryName,
      value,
      currency: STORE_CURRENCY,
    },
    tiktok: {
      content_id: p.id,
      content_name: p.name,
      content_type: "product",
      content_category: p.categoryName,
      quantity: qty,
      value,
      currency: STORE_CURRENCY,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Store visit                                                         */
/* ------------------------------------------------------------------ */

let visitSentFor: string | null = null;

/** Once per page load / tab per store. (The pixels send their own PageView.) */
export function trackStoreVisit(storeSlug: string) {
  if (visitSentFor === storeSlug) return;
  visitSentFor = storeSlug;
  send({ storeSlug, kind: "traffic" });
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export function trackProductView(storeSlug: string, product: TrackedProduct) {
  if (shouldCountEvent("viewed", storeSlug, product.id)) {
    send({ storeSlug, kind: "product_view", productId: product.id });
  }
  if (trackingRuntime.allowed) {
    const c = contentParams(product);
    pixelTrack("ViewContent", c.meta);
    ttqTrack("ViewContent", c.tiktok);
  }
}

/** The visitor clicked a product card / link to open it. */
export function trackProductClick(storeSlug: string, product: TrackedProduct) {
  if (shouldCountEvent("clicked", storeSlug, product.id)) {
    send({ storeSlug, kind: "product_click", productId: product.id });
  }
  if (trackingRuntime.allowed) {
    const c = contentParams(product);
    pixelTrackCustom("ProductClick", c.meta);
    ttqTrack("ClickButton", c.tiktok);
  }
}

export function trackAddToCart(storeSlug: string, product: TrackedProduct, qty = 1) {
  if (shouldCountEvent("carted", storeSlug, product.id)) {
    send({ storeSlug, kind: "add_to_cart", productId: product.id });
  }
  if (trackingRuntime.allowed) {
    const c = contentParams(product, qty);
    pixelTrack("AddToCart", c.meta);
    ttqTrack("AddToCart", c.tiktok);
  }
}

export function trackSearch(storeSlug: string, term: string) {
  const t = term.trim();
  if (t) send({ storeSlug, kind: "search", term: t });
}

/* ------------------------------------------------------------------ */
/* Checkout and purchase                                               */
/* ------------------------------------------------------------------ */

/** The buyer opened the checkout page. Pixels only (no dashboard event). */
export function trackInitiateCheckout(
  items: Array<{ productId: string; qty: number; price: number }>,
  total: number,
) {
  if (!trackingRuntime.allowed) return;
  pixelTrack("InitiateCheckout", {
    content_ids: items.map((i) => i.productId),
    content_type: "product",
    num_items: items.reduce((s, i) => s + i.qty, 0),
    value: total,
    currency: STORE_CURRENCY,
  });
  ttqTrack("InitiateCheckout", {
    contents: items.map((i) => ({
      content_id: i.productId,
      content_type: "product",
      quantity: i.qty,
      price: i.price,
    })),
    value: total,
    currency: STORE_CURRENCY,
  });
}

/**
 * Extra fields to put in the "place order" request body. The API uses them to
 * record the purchase against the right traffic source. The buyer's name,
 * phone and address are never sent to analytics or to the pixels.
 */
export function attributionForOrder(): { source: string; visitorId: string } {
  return { source: getTrafficSource(), visitorId: getVisitorId() };
}

const PURCHASE_KEY = "sbd_purchased:";
const purchasedInMemory = new Set<string>();

/**
 * Call once the order was created (on the confirmation page). The dashboard's
 * purchase is already recorded by the API when the order is placed, so this
 * only sends the pixel events. The order ID is used as the event ID so a
 * refresh, or a server-side Conversions API later, doesn't count it twice.
 */
export function trackPurchase(order: TrackedOrder) {
  if (!trackingRuntime.allowed) return;
  if (purchasedInMemory.has(order.id)) return;
  purchasedInMemory.add(order.id);
  try {
    if (sessionStorage.getItem(PURCHASE_KEY + order.id)) return; // page refresh
    sessionStorage.setItem(PURCHASE_KEY + order.id, "1");
  } catch {
    /* ignore */
  }

  const num = order.lines.reduce((s, l) => s + l.qty, 0);
  pixelTrack(
    "Purchase",
    {
      content_ids: order.lines.map((l) => l.productId),
      content_type: "product",
      num_items: num,
      value: order.total,
      currency: STORE_CURRENCY,
    },
    order.id,
  );
  ttqTrack(
    "CompletePayment",
    {
      contents: order.lines.map((l) => ({
        content_id: l.productId,
        content_name: l.name,
        content_type: "product",
        quantity: l.qty,
        price: l.price,
      })),
      value: order.total,
      currency: STORE_CURRENCY,
    },
    order.id,
  );
}
