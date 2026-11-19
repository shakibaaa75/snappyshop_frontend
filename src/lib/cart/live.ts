import type { PublicStore } from "@/lib/store-design/api";
import type { CartLine } from "@/lib/store-design/cart";

export interface Live {
  price: number;
  /** -1 = unlimited (the API's convention). */
  stock: number;
  gone: boolean;
}

/** What the seller currently charges / has in stock for one cart line. */
export function liveFor(
  store: PublicStore | undefined,
  line: CartLine,
): Live | null {
  if (!store) return null;
  const p = store.products.find((x) => x.id === line.productId);
  if (!p) return { price: line.price, stock: 0, gone: true };
  if (line.variantId) {
    const c = p.combinations?.find((x) => x.id === line.variantId);
    if (!c) return { price: line.price, stock: 0, gone: true };
    return {
      price: c.price && c.price > 0 ? c.price : p.price,
      stock: c.stock,
      gone: false,
    };
  }
  return { price: p.price, stock: p.stock, gone: false };
}

/** True when this line cannot be bought as it is (deleted, sold out, or more than in stock). */
export function isBlocked(live: Live | null, qty: number): boolean {
  if (!live) return false;
  if (live.gone || live.stock === 0) return true;
  return live.stock > 0 && qty > live.stock;
}
