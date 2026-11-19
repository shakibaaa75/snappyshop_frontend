/**
 * Data layer for shipping orders through a seller's connected couriers.
 *
 * The Go API creates the parcel with the courier, using the seller's stored
 * credentials, and moves the order to "shipped". The browser only sends the
 * order ID(s) and the chosen connection ID. The API derives the seller from
 * the auth cookie and must reject any order or connection that seller does
 * not own, and any order that already has a shipment.
 */
import { apiFetch } from "@/lib/api/http";

export interface Shipment {
  id: string;
  orderId: string;
  connectionId?: string;
  provider: string;
  providerName: string;
  trackingCode: string;
  trackingUrl?: string;
  createdAt: string;
  /** Set when the parcel was booked but the order status could not be updated. */
  warning?: string;
}

export interface ShipResult {
  orderId: string;
  ok: boolean;
  shipment?: Shipment;
  /** Safe message from the courier or API when ok is false. */
  error?: string;
}

/** Order statuses a seller can ship from. Pending orders must be confirmed first. */
export const SHIPPABLE_STATUSES: readonly string[] = ["confirmed"];

export function canShip(order: {
  status: string;
  shipment?: Shipment | null;
}): boolean {
  return SHIPPABLE_STATUSES.includes(order.status) && !order.shipment;
}

/**
 * Keeps one bulk request inside the server's 30s write timeout.
 * Must match shipping.MaxBulk in the Go backend.
 */
export const MAX_BULK_SHIP = 15;

/** Query key shared by the orders list and the order detail page. */
export const SHIPMENTS_KEY = ["seller", "shipments"] as const;

export const sellerShipping = {
  /** GET /seller/shipments — recent booked parcels, merged onto order rows. */
  async list(): Promise<Shipment[]> {
    const res = await apiFetch<{ shipments: Shipment[] | null }>(
      "/seller/shipments",
    );
    return res.shipments ?? [];
  },

  /** POST /seller/orders/:id/ship */
  async ship(orderId: string, connectionId: string): Promise<Shipment> {
    const res = await apiFetch<{ shipment: Shipment }>(
      `/seller/orders/${encodeURIComponent(orderId)}/ship`,
      { method: "POST", body: { connectionId } },
    );
    return res.shipment;
  },

  /** POST /seller/orders/ship — one result per order; partial success is normal. */
  async shipMany(
    orderIds: string[],
    connectionId: string,
  ): Promise<ShipResult[]> {
    const res = await apiFetch<{ results: ShipResult[] | null }>(
      "/seller/orders/ship",
      { method: "POST", body: { orderIds, connectionId } },
    );
    return res.results ?? [];
  },
};