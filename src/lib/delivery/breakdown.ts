/**
 * How an order's delivery (and discount) is written on receipts and order
 * pages. One place, so the thank-you page, the downloaded receipt, and the
 * seller and buyer order screens always say the same thing.
 *
 * Orders placed before Delivery Settings existed have no zone: they print a
 * plain "Delivery" row exactly as before.
 */

export interface OrderDeliveryFields {
  delivery: number;
  discount?: number;
  /** "inside_dhaka" | "outside_dhaka" | "" (old orders). */
  deliveryZone?: string;
  /** Charge before a free-delivery waiver. */
  deliveryBase?: number;
  deliveryWaived?: boolean;
}

export function zoneLabel(zone?: string): string {
  if (zone === "inside_dhaka") return "Inside Dhaka";
  if (zone === "outside_dhaka") return "Outside Dhaka";
  return "";
}

export interface DeliveryRow {
  /** "Delivery" or "Delivery (Inside Dhaka)". */
  label: string;
  /** "Free" or "৳60". */
  value: string;
  /** The charge that was waived, to show struck through. Only when waived. */
  was?: string;
}

export function deliveryRow(
  o: OrderDeliveryFields,
  format: (n: number) => string,
): DeliveryRow {
  const zone = zoneLabel(o.deliveryZone);
  const row: DeliveryRow = {
    label: zone ? `Delivery (${zone})` : "Delivery",
    value: o.delivery === 0 ? "Free" : format(o.delivery),
  };
  if (o.deliveryWaived && (o.deliveryBase ?? 0) > 0) {
    row.was = format(o.deliveryBase as number);
  }
  return row;
}

/** The discount row, or null when the order has no discount. */
export function discountRow(
  o: OrderDeliveryFields,
  format: (n: number) => string,
): { label: string; value: string } | null {
  const d = o.discount ?? 0;
  return d > 0 ? { label: "Discount", value: `−${format(d)}` } : null;
}

/** A row's value as plain text, for canvas receipts: "৳120 → Free". */
export function deliveryRowText(row: DeliveryRow): string {
  return row.was ? `${row.was} → ${row.value}` : row.value;
}
