/**
 * The signed-in buyer's orders across all sellers, plus problem reports.
 *
 *   GET  /api/v1/buyer/orders?limit&before
 *   GET  /api/v1/buyer/orders/{id}
 *   POST /api/v1/buyer/orders/{id}/issues
 *   GET  /api/v1/buyer/issues
 *   POST /api/v1/buyer/issues/{id}/withdraw
 */
import { apiFetch } from "./http";

export type BuyerOrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type IssueType =
  | "not_received"
  | "wrong_item"
  | "damaged"
  | "missing_item"
  | "refund_request"
  | "other";

export type IssueStatus = "open" | "resolved" | "rejected" | "withdrawn";

export interface BuyerOrderLine {
  name: string;
  imageUrl: string;
  emoji: string;
  hue: number;
  variant: string;
  price: number;
  qty: number;
  subtotal: number;
}

export interface BuyerOrderSummary {
  id: string;
  number: string;
  status: BuyerOrderStatus;
  createdAt: string;
  total: number;
  itemCount: number;
  /** First 3 lines, for the list thumbnails. */
  preview: BuyerOrderLine[];
  seller: { name: string; slug: string };
  hasOpenIssue: boolean;
}

export interface BuyerOrderList {
  orders: BuyerOrderSummary[];
  /** Pass back as `before` to get the next page; null on the last page. */
  nextBefore: string | null;
  /** false = the account email is not verified, so no orders are shown. */
  emailVerified: boolean;
}

export interface TimelineStep {
  key: "placed" | "confirmed" | "shipped" | "delivered" | "cancelled";
  label: string;
  done: boolean;
  at: string | null;
}

export interface BuyerIssue {
  id: string;
  orderId: string;
  orderNumber: string;
  type: IssueType;
  message: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface BuyerOrderDetail extends BuyerOrderSummary {
  lines: BuyerOrderLine[];
  subtotal: number;
  delivery: number;
  discount?: number;
  /** "inside_dhaka" | "outside_dhaka"; empty on orders placed before Delivery Settings. */
  deliveryZone?: string;
  deliveryBase?: number;
  deliveryWaived?: boolean;
  paymentMethod: string;
  paid: boolean;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  timeline: TimelineStep[];
  /** Only present once the seller booked a courier parcel. */
  tracking: { courier: string; code: string; url: string } | null;
  issues: BuyerIssue[];
  /** Problem kinds that can be reported right now (empty while one is open). */
  reportTypes: IssueType[];
}

export const buyerOrdersApi = {
  list: (before?: string, limit = 20): Promise<BuyerOrderList> => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (before) q.set("before", before);
    return apiFetch(`/buyer/orders?${q.toString()}`);
  },

  get: async (id: string): Promise<BuyerOrderDetail> => {
    const res = await apiFetch<{ order: BuyerOrderDetail }>(
      `/buyer/orders/${encodeURIComponent(id)}`,
    );
    return res.order;
  },

  reportIssue: async (
    orderId: string,
    input: { type: IssueType; message: string },
  ): Promise<BuyerIssue> => {
    const res = await apiFetch<{ issue: BuyerIssue }>(
      `/buyer/orders/${encodeURIComponent(orderId)}/issues`,
      { method: "POST", body: input },
    );
    return res.issue;
  },

  issues: async (): Promise<BuyerIssue[]> => {
    const res = await apiFetch<{ issues: BuyerIssue[] }>("/buyer/issues");
    return res.issues;
  },

  withdrawIssue: async (id: string): Promise<void> => {
    await apiFetch(`/buyer/issues/${encodeURIComponent(id)}/withdraw`, {
      method: "POST",
    });
  },
};
