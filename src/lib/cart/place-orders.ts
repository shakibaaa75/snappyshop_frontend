import { getApiErrorMessage } from "@/lib/api/form-errors";
import { publicOrders, type PaymentMethod } from "@/lib/api/orders";
import { clearSellerCart, type SellerCart } from "@/lib/cart/marketplace-cart";

export interface CheckoutForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingArea: string;
  notes: string;
}

export interface PlacedOrder {
  slug: string;
  storeName: string;
  id: string;
  number: string;
  subtotal: number;
  delivery: number;
  /** How delivery was priced, from the server's order. Empty on older saves. */
  discount?: number;
  deliveryZone?: string;
  deliveryBase?: number;
  deliveryWaived?: boolean;
  total: number;
}

export interface FailedOrder {
  slug: string;
  storeName: string;
  message: string;
}

export interface CheckoutOutcome {
  placed: PlacedOrder[];
  failed: FailedOrder[];
  payment: PaymentMethod;
  at: string;
}

export const LAST_CHECKOUT_KEY = "shopbd-last-checkout";

/**
 * Creates one order per seller, one after another (sequential keeps us inside
 * the API's per-IP order limit). A seller whose order is accepted is removed
 * from the cart right away, so a retry can never order it twice. A seller
 * whose order is refused stays in the cart with its message.
 */
export async function placeCombinedOrders(
  carts: SellerCart[],
  form: CheckoutForm,
  payment: PaymentMethod,
): Promise<CheckoutOutcome> {
  const placed: PlacedOrder[] = [];
  const failed: FailedOrder[] = [];

  for (const cart of carts) {
    try {
      const order = await publicOrders.create(cart.slug, {
        ...form,
        paymentMethod: payment,
        lines: cart.lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          ...(l.variantId ? { variantId: l.variantId } : {}),
        })),
      });
      placed.push({
        slug: cart.slug,
        storeName: cart.name,
        id: order.id,
        number: order.number,
        subtotal: order.subtotal,
        delivery: order.delivery,
        discount: order.discount ?? 0,
        deliveryZone: order.deliveryZone ?? "",
        deliveryBase: order.deliveryBase ?? 0,
        deliveryWaived: order.deliveryWaived ?? false,
        total: order.total,
      });
      clearSellerCart(cart.slug);
    } catch (err) {
      failed.push({
        slug: cart.slug,
        storeName: cart.name,
        message: getApiErrorMessage(
          err,
          "Could not place this order. Please try again.",
        ),
      });
    }
  }

  return { placed, failed, payment, at: new Date().toISOString() };
}
