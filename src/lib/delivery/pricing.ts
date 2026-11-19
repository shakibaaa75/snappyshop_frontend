/**
 * Delivery pricing for the storefront. Pure: no imports, no network.
 *
 * This is a line-for-line mirror of the Go rules in internal/delivery, used to
 * SHOW prices before an order exists (product page, cart, and checkout while
 * the quote loads). The server always recomputes the real charge when the order
 * is placed, so this file can never change what a customer is billed.
 *
 *  1. Zone: "Dhaka" the DISTRICT is inside Dhaka. Every other district
 *     (Gazipur, Narayanganj, Madaripur ...) is outside.
 *  2. Each product has a charge per zone: its own override, else the global.
 *  3. One order = one parcel = ONE charge: the highest among its products.
 *  4. "Free delivery over X": when the subtotal reaches X the charge is 0.
 */

export type DeliveryZone = "inside_dhaka" | "outside_dhaka";

export interface ZoneCharges {
  insideDhaka: number;
  outsideDhaka: number;
}

/** The public settings the storefront reads (see lib/api/delivery-settings). */
export interface PricingSettings {
  global: ZoneCharges;
  products: Record<string, ZoneCharges>;
  freeDeliveryThreshold: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Same matching as delivery.ZoneFor in Go. */
export function zoneFor(district: string): DeliveryZone {
  const d = district.trim().toLowerCase().split(/\s+/).join(" ");
  switch (d) {
    case "dhaka":
    case "dhaka district":
    case "dhaka zila":
    case "dhaka zilla":
    case "ঢাকা":
    case "ঢাকা জেলা":
      return "inside_dhaka";
    default:
      return "outside_dhaka";
  }
}

export function chargeIn(c: ZoneCharges, zone: DeliveryZone): number {
  return zone === "inside_dhaka" ? c.insideDhaka : c.outsideDhaka;
}

/** The charges that apply to one product: its override, else the global. */
export function chargesFor(
  s: PricingSettings | undefined,
  productId: string,
): ZoneCharges {
  if (!s) return { insideDhaka: 0, outsideDhaka: 0 };
  return s.products[productId] ?? s.global;
}

export interface DeliveryEstimate {
  zone: DeliveryZone;
  /** Charge before any free-delivery waiver (highest product charge). */
  base: number;
  /** What the customer pays. */
  charge: number;
  /** True when the free-delivery threshold removed a charge. */
  waived: boolean;
}

/** Mirrors delivery.Calculate in Go. */
export function estimateDelivery(
  s: PricingSettings | undefined,
  zone: DeliveryZone,
  productIds: string[],
  subtotal: number,
): DeliveryEstimate {
  let base = 0;
  for (const id of productIds) {
    const c = round2(chargeIn(chargesFor(s, id), zone));
    if (c > base) base = c;
  }
  const freeOver = s?.freeDeliveryThreshold ?? 0;
  if (freeOver > 0 && subtotal >= freeOver && base > 0) {
    return { zone, base, charge: 0, waived: true };
  }
  return { zone, base, charge: base, waived: false };
}

/** Both zones at once, for places that do not know the district yet. */
export function estimateBothZones(
  s: PricingSettings | undefined,
  productIds: string[],
  subtotal: number,
): { inside: DeliveryEstimate; outside: DeliveryEstimate } {
  return {
    inside: estimateDelivery(s, "inside_dhaka", productIds, subtotal),
    outside: estimateDelivery(s, "outside_dhaka", productIds, subtotal),
  };
}

/** "Free" for 0, otherwise "৳60". Takes the store's own formatter. */
export function chargeText(n: number, format: (n: number) => string): string {
  return n === 0 ? "Free" : format(n);
}
