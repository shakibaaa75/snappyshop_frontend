"use client";

import { type Product } from "@/lib/store-design/types";
import { type ReactNode, useMemo } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { formatPrice } from "@/lib/store-design/utilts";
import { ProductArt } from "../productArt";
import { lineKey, useCart } from "@/lib/store-design/cart";
import { useRouter } from "next/navigation";
import {
  variantOptions,
  type VariantProduct,
} from "@/lib/store-design/variants";
import { Link, PaymentBadges } from "./blocks";
import { PANEL } from "./dashboard-shell";
import { useRecentlyViewed } from "./recently-viewed";
import { CTA_BG, muted } from "./tokens";
import { type Ctx } from "./types";

type RailRow = {
  id: string;
  name: string;
  price: number;
  qty: number;
  art: Product;
};
function RailPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="p-4" style={PANEL}>
      <h2 className="mb-3 text-base font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
export function RightRail({ ctx }: { ctx: Ctx }) {
  const { d, interactive, products } = ctx;
  const cart = useCart();
  const router = useRouter();
  const base = `/store/${d.storeSlug}`;
  const recent = useRecentlyViewed(d.storeSlug, products, interactive);

  const rows = useMemo<RailRow[]>(() => {
    if (!interactive) {
      return products.slice(0, 2).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        qty: 1,
        art: p,
      }));
    }
    return cart.lines.map((l) => ({
      id: lineKey(l),
      name: l.variantLabel ? `${l.name} · ${l.variantLabel}` : l.name,
      price: l.price,
      qty: l.qty,
      art: {
        id: l.productId,
        name: l.name,
        categoryId: "",
        price: l.price,
        emoji: l.emoji,
        hue: l.hue,
        rating: 0,
        reviews: 0,
        sold: 0,
        stock: 99,
        createdAt: "",
        imageUrl: l.imageUrl,
      } as Product,
    }));
  }, [interactive, products, cart.lines]);

  const count = interactive ? cart.count : rows.reduce((n, r) => n + r.qty, 0);
  const subtotal = interactive
    ? cart.subtotal
    : rows.reduce((n, r) => n + r.price * r.qty, 0);
  const threshold = d.freeDeliveryThreshold ?? 0;
  const delivery = threshold > 0 && subtotal < threshold ? 60 : 0;
  const total = subtotal + delivery;
  const remaining = threshold > 0 ? Math.max(0, threshold - subtotal) : 0;

  const inCart = new Set(rows.map((r) => r.id));
  const suggestions = products
    .filter((p) => !inCart.has(p.id) && p.stock !== 0)
    .slice(0, 2);
  const recentShown = interactive ? recent : products.slice(0, 4);

  const stepBtn = "flex h-7 w-7 items-center justify-center rounded-full";

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <RailPanel title={`My cart (${count})`}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <ShoppingBag className="h-9 w-9 opacity-30" />
            <p className="text-sm font-medium">Your cart is empty</p>
            <p className="text-xs" style={muted}>
              Add something you like and it shows up here.
            </p>
          </div>
        ) : (
          <>
            <ul className="no-scrollbar max-h-[380px] space-y-3 overflow-y-auto">
              {rows.map((r) => (
                <li key={r.id} className="flex gap-3">
                  <Link
                    on={interactive}
                    href={`${base}/products/${r.id}`}
                    className="block h-16 w-16 shrink-0 overflow-hidden rounded-2xl"
                    style={{ background: "var(--s-surface)" }}
                  >
                    <ProductArt
                      product={r.art}
                      emojiClassName="text-2xl"
                      width={128}
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-snug">
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-sm font-bold">
                      {formatPrice(r.price)}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div
                        className="flex h-8 items-center rounded-full px-0.5"
                        style={{ background: "var(--s-surface)" }}
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            interactive && cart.updateQty(r.id, r.qty - 1)
                          }
                          className={stepBtn}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-6 text-center text-xs font-semibold">
                          {r.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            interactive && cart.updateQty(r.id, r.qty + 1)
                          }
                          className={stepBtn}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${r.name}`}
                        onClick={() => interactive && cart.removeItem(r.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full opacity-50 transition-opacity hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {remaining > 0 && (
              <p
                className="mt-4 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-xs"
                style={{ background: "var(--s-surface)" }}
              >
                <Truck className="h-4 w-4 shrink-0" />
                Add {formatPrice(remaining)} more for free delivery
              </p>
            )}

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt style={muted}>Subtotal</dt>
                <dd className="font-semibold">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={muted}>Shipping</dt>
                <dd className="font-semibold">
                  {delivery === 0 ? "Free" : formatPrice(delivery)}
                </dd>
              </div>
              <div
                className="flex justify-between border-t pt-3 text-base"
                style={{ borderColor: "var(--s-border)" }}
              >
                <dt className="font-semibold">Total</dt>
                <dd className="font-bold">{formatPrice(total)}</dd>
              </div>
            </dl>

            <Link
              on={interactive}
              href={`${base}/checkout`}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-transform active:scale-[0.98]"
              style={{ background: CTA_BG, color: "var(--s-on-primary)" }}
            >
              Checkout ({count})
              <ArrowRight className="h-4 w-4" />
            </Link>

            {d.showPaymentBadges && d.paymentMethods.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[11px]" style={muted}>
                  We accept
                </p>
                <PaymentBadges methods={d.paymentMethods} />
              </div>
            )}
          </>
        )}
      </RailPanel>

      {suggestions.length > 0 && (
        <RailPanel title="You might also like">
          <ul className="space-y-2.5">
            {suggestions.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl p-2"
                style={{ background: "var(--s-surface)" }}
              >
                <Link
                  on={interactive}
                  href={`${base}/products/${p.id}`}
                  className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                  style={{ background: "var(--s-bg)" }}
                >
                  <ProductArt
                    product={p}
                    emojiClassName="text-xl"
                    width={112}
                  />
                </Link>
                <Link
                  on={interactive}
                  href={`${base}/products/${p.id}`}
                  className="block min-w-0 flex-1"
                >
                  <p className="line-clamp-1 text-[13px] font-semibold">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-sm font-bold">
                    {formatPrice(p.price)}
                  </p>
                </Link>
                <button
                  type="button"
                  aria-label={`Add ${p.name} to cart`}
                  disabled={d.vacationMode}
                  onClick={() => {
                    if (!interactive) return;
                    if (variantOptions(p as VariantProduct).length > 0) {
                      router.push(`/store/${d.storeSlug}/products/${p.id}`);
                      return;
                    }
                    cart.addItem(p, 1);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform active:scale-90 disabled:opacity-50"
                  style={{ background: CTA_BG, color: "var(--s-on-primary)" }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </RailPanel>
      )}

      {recentShown.length > 0 && (
        <RailPanel title="Recently viewed">
          <div className="grid grid-cols-4 gap-2">
            {recentShown.map((p) => (
              <Link
                key={p.id}
                on={interactive}
                href={`${base}/products/${p.id}`}
                title={p.name}
                className="block aspect-square overflow-hidden rounded-2xl"
                style={{ background: "var(--s-surface)" }}
              >
                <ProductArt product={p} emojiClassName="text-xl" width={120} />
              </Link>
            ))}
          </div>
        </RailPanel>
      )}
    </aside>
  );
}
