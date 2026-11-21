import { authApi } from "./auth";
import { apiFetch, ApiError } from "@/lib/api/http";

export type OrderStatus =
  "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type DeliveryZoneId = "inside_dhaka" | "outside_dhaka";

export type PaymentMethod = "bkash" | "nagad" | "rocket" | "cod" | "card";

export interface OrderLine {
  productId: string;
  name: string;
  imageUrl?: string;
  emoji?: string;
  hue?: number;
  variantId?: string;
  variant?: string;
  price: number;
  qty: number;
  subtotal: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  number: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingArea?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  paid: boolean;
  subtotal: number;
  delivery: number;
  /** Order-level amount taken off the total. total = subtotal + delivery - discount. */
  discount?: number;
  /** "inside_dhaka" | "outside_dhaka". Empty on orders placed before Delivery Settings. */
  deliveryZone?: DeliveryZoneId | "";
  /** Delivery charge before a free-delivery waiver. */
  deliveryBase?: number;
  /** True when "free delivery over X" brought the charge to 0. */
  deliveryWaived?: boolean;
  total: number;
  lines: OrderLine[];
  status: OrderStatus;
  events: OrderStatusEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  orderCount: number;
  paidOrderCount: number;
  revenue: number;
  pendingCount: number;
  confirmedCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  avgOrderValue: number;
  unitsSold: number;
}

export interface OrderFilterInput {
  status?: OrderStatus | "all";
  limit?: number;
}

/* ------------------------------------------------------------------ */
/* Seller-authenticated endpoints                                      */
/* ------------------------------------------------------------------ */

export const sellerOrders = {
  list: (filter: OrderFilterInput = {}) => {
    const params = new URLSearchParams();
    if (filter.status && filter.status !== "all") {
      params.set("status", filter.status);
    }
    if (filter.limit) params.set("limit", String(filter.limit));
    const qs = params.toString();
    return apiFetch<{ orders: Order[] }>(
      `/seller/orders${qs ? `?${qs}` : ""}`,
    ).then((r) => r.orders);
  },

  get: (id: string) =>
    apiFetch<{ order: Order }>(`/seller/orders/${id}`).then((r) => r.order),

  updateStatus: (id: string, status: OrderStatus, note = "") =>
    apiFetch<{ order: Order }>(`/seller/orders/${id}`, {
      method: "PATCH",
      body: { status, note },
    }).then((r) => r.order),

  markPaid: (id: string, paid: boolean) =>
    apiFetch<{ order: Order }>(`/seller/orders/${id}/paid`, {
      method: "PATCH",
      body: { paid },
    }).then((r) => r.order),

  stats: (since?: string) => {
    const qs = since ? `?since=${encodeURIComponent(since)}` : "";
    return apiFetch<{ stats: OrderStats }>(`/seller/stats${qs}`).then(
      (r) => r.stats,
    );
  },
};

/* ------------------------------------------------------------------ */
/* Public storefront endpoint — used by the checkout page              */
/* ------------------------------------------------------------------ */

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingArea: string;
  notes: string;
  paymentMethod: PaymentMethod;
  /** The client sends only productId + qty; the server recomputes prices. */
  lines: { productId: string; qty: number; variantId?: string }[];
}

/** The price of a cart for one district, from POST /store/{slug}/delivery-quote. */
export interface DeliveryQuote {
  deliveryZone: DeliveryZoneId;
  subtotal: number;
  delivery: number;
  deliveryBase: number;
  freeDeliveryApplied: boolean;
  discount: number;
  total: number;
}

export const publicOrders = {
  /** The server returns the full order, so receipts can show the breakdown. */
  create: async (slug: string, input: CreateOrderInput) => {
    // Refresh an expired buyer session before the checkout route accepts guest orders.
    await authApi.me().catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    });
    return apiFetch<{ order: Order }>(
      `/store/${encodeURIComponent(slug)}/orders`,
      {
        method: "POST",
        body: input,
      },
    ).then((r) => r.order);
  },

  /** Prices a cart for a district with the exact rules `create` uses. */
  quote: (
    slug: string,
    input: {
      shippingCity: string;
      lines: { productId: string; qty: number; variantId?: string }[];
    },
    signal?: AbortSignal,
  ) =>
    apiFetch<DeliveryQuote>(
      `/store/${encodeURIComponent(slug)}/delivery-quote`,
      {
        method: "POST",
        body: input,
        skipRefresh: true,
        signal,
      },
    ),
};

/* ------------------------------------------------------------------ */
/* Presentation helpers                                                */
/* ------------------------------------------------------------------ */

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLOR: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  confirmed: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  shipped: {
    bg: "bg-violet-100",
    text: "text-violet-800",
    dot: "bg-violet-500",
  },
  delivered: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-red-500",
  },
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  cod: "Cash on delivery",
  card: "Card",
};

/** Only delivered + paid orders count as a verified sale. */
export function isVerifiedSale(order: Order): boolean {
  if (order.status !== "delivered") return false;
  if (order.paymentMethod === "cod") return true;
  return order.paid;
}

export function formatBDT(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}
