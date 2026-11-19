"use client";

import { useCartDeliveryRange } from "@/lib/delivery/use-delivery";
import { chargeText } from "@/lib/delivery/pricing";
import { type StoreDesign } from "@/lib/store-design/types";
import NextLink from "next/link";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { img } from "@/lib/images";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice, themeVars } from "@/lib/store-design/utilts";
import { lineKey, useCart } from "@/lib/store-design/cart";
import { CTA_BG, muted } from "./tokens";

/* ------------------------------------------------------------------ */
/* Cart drawer                                                         */
/* ------------------------------------------------------------------ */

export function CartSheet({
  open,
  onOpenChange,
  design,
  interactive,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  design: StoreDesign;
  interactive: boolean;
}) {
  const cart = useCart();
  const base = `/store/${design.storeSlug}`;
  // Same prices as the cart page. Until the store has published settings (or
  // while the editor previews an unpublished store) the row is simply hidden.
  const range = useCartDeliveryRange(
    design.storeSlug,
    cart.lines,
    cart.subtotal,
  );
  const sameCharge =
    range.ready && range.inside.charge === range.outside.charge;
  const delivery = sameCharge ? range.inside.charge : 0;
  const total = cart.subtotal + delivery;
  const ctaCls =
    "flex h-14 w-full items-center justify-center rounded-full text-base font-semibold transition-transform active:scale-[0.98]";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        style={{
          ...themeVars(design),
          background: "var(--s-bg)",
          color: "var(--s-text)",
          borderColor: "var(--s-border)",
        }}
      >
        <SheetHeader className="px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base font-bold">
            <ShoppingBag className="h-4 w-4" />
            My cart
            {cart.count > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: "var(--s-surface)" }}
              >
                {cart.count}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {!cart.ready ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin opacity-50" />
            </div>
          ) : cart.lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingBag className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs" style={muted}>
                Browse the store and add something you like.
              </p>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="mt-2 h-11 rounded-full px-6 text-sm font-semibold"
                style={{ background: CTA_BG, color: "var(--s-on-primary)" }}
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.lines.map((line) => (
                <li
                  key={lineKey(line)}
                  className="flex gap-3 rounded-[24px] p-3"
                  style={{ background: "var(--s-surface)" }}
                >
                  <span
                    className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] text-2xl"
                    style={{ background: "var(--s-bg)" }}
                  >
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img(line.imageUrl, { width: 144, height: 144 })}
                        alt=""
                        width={72}
                        height={72}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      line.emoji || "·"
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">
                        {line.name}
                      </p>
                      <button
                        type="button"
                        aria-label={`Remove ${line.name}`}
                        onClick={() => cart.removeItem(lineKey(line))}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-50 hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs" style={muted}>
                      {formatPrice(line.price)} each
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div
                        className="flex h-8 items-center rounded-full px-0.5"
                        style={{ background: "var(--s-bg)" }}
                      >
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() =>
                            cart.updateQty(lineKey(line), line.qty - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-6 text-center text-xs font-semibold">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() =>
                            cart.updateQty(lineKey(line), line.qty + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold">
                        {formatPrice(line.price * line.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.lines.length > 0 && (
          <div className="px-5 pb-5 pt-3">
            <div className="mb-1 flex justify-between text-sm">
              <span style={muted}>Subtotal</span>
              <span className="font-medium">{formatPrice(cart.subtotal)}</span>
            </div>
            {range.ready && (
              <div className="mb-3 flex justify-between text-xs" style={muted}>
                <span>Delivery</span>
                <span>
                  {sameCharge
                    ? chargeText(delivery, formatPrice)
                    : `${chargeText(
                        Math.min(range.inside.charge, range.outside.charge),
                        formatPrice,
                      )} – ${chargeText(
                        Math.max(range.inside.charge, range.outside.charge),
                        formatPrice,
                      )}`}
                </span>
              </div>
            )}
            <div className="mb-4 flex justify-between text-base font-bold">
              <span>{range.ready && !sameCharge ? "Total before delivery" : "Total"}</span>
              <span>{formatPrice(total)}</span>
            </div>
            {interactive ? (
              <NextLink
                href={`${base}/checkout`}
                prefetch
                onClick={() => onOpenChange(false)}
                className={ctaCls}
                style={{ background: CTA_BG, color: "var(--s-on-primary)" }}
              >
                Checkout
              </NextLink>
            ) : (
              <span
                className={ctaCls}
                style={{ background: CTA_BG, color: "var(--s-on-primary)" }}
              >
                Checkout
              </span>
            )}
            {interactive && (
              <NextLink
                href={`${base}/cart`}
                prefetch
                onClick={() => onOpenChange(false)}
                className="mt-2 flex h-10 w-full items-center justify-center text-sm font-medium"
                style={muted}
              >
                View full cart
              </NextLink>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
