/**
 * Data layer for delivery charges.
 *
 * The seller is identified by the auth cookie on the Go API; no seller ID is
 * ever sent from the browser. Amounts are BDT.
 *
 *   GET /seller/delivery-settings          seller's settings
 *   PUT /seller/delivery-settings          save (replaces the whole thing)
 *   GET /store/{slug}/delivery-settings    public charges for a storefront
 */
import { apiFetch } from "@/lib/api/http";

export interface DeliveryCharges {
  /** Dhaka district only. */
  insideDhaka: number;
  /** Every other district, including the rest of Dhaka Division. */
  outsideDhaka: number;
}

export interface DeliverySettings {
  /** Applies to every product without a custom charge. */
  global: DeliveryCharges;
  /** productId -> custom charges. A product listed here ignores `global`. */
  products: Record<string, DeliveryCharges>;
  /** The store's "free delivery over X" from Shop options (0 = off). Read-only. */
  freeDeliveryThreshold: number;
  /**
   * False until the seller saves for the first time. Until then `global`
   * shows what customers pay today (the old flat rule).
   */
  configured: boolean;
}

/** What the API reads when saving. */
export type DeliverySettingsInput = Pick<DeliverySettings, "global" | "products">;

function normalize(raw: Partial<DeliverySettings> | null | undefined): DeliverySettings {
  return {
    global: {
      insideDhaka: raw?.global?.insideDhaka ?? 0,
      outsideDhaka: raw?.global?.outsideDhaka ?? 0,
    },
    products: raw?.products ?? {},
    freeDeliveryThreshold: raw?.freeDeliveryThreshold ?? 0,
    configured: raw?.configured ?? false,
  };
}

export const sellerDelivery = {
  async get(): Promise<DeliverySettings> {
    return normalize(await apiFetch<DeliverySettings>("/seller/delivery-settings"));
  },

  async save(input: DeliverySettingsInput): Promise<DeliverySettings> {
    return normalize(
      await apiFetch<DeliverySettings>("/seller/delivery-settings", {
        method: "PUT",
        body: input,
      }),
    );
  },
};

export const publicDelivery = {
  /** Used by the product page, cart and checkout (Part 4). */
  async get(slug: string, signal?: AbortSignal): Promise<DeliverySettings> {
    return normalize(
      await apiFetch<DeliverySettings>(
        `/store/${encodeURIComponent(slug)}/delivery-settings`,
        { skipRefresh: true, signal },
      ),
    );
  },
};
