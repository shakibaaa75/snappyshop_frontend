"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/http";
import { fetchPublicStore } from "@/lib/store-design/api";
import { lineKey, useCart } from "@/lib/store-design/cart";
import { useCartDeliveryRange } from "@/lib/delivery/use-delivery";
import { chargeText } from "@/lib/delivery/pricing";
import {
  formatPrice,
  loadFont,
  readableOn,
  themeVars,
} from "@/lib/store-design/utilts";
import { ProductArt } from "@/components/store-design/productArt";
import { getPreviousPath } from "@/components/store/ScrollToTop";
import type { Product, StoreDesign } from "@/lib/store-design/types";
import type { PublicStoreData } from "@/lib/store-design/server";

type CartLine = ReturnType<typeof useCart>["lines"][number];

const CartRow = memo(function CartRow({
  line,
  storeHref,
  onRemove,
  onQty,
}: {
  line: CartLine;
  storeHref: string;
  onRemove: (id: string) => void;
  onQty: (id: string, qty: number) => void;
}) {
  const artProduct = useMemo<Product>(
    () =>
      ({
        id: line.productId,
        name: line.name,
        categoryId: "",
        price: line.price,
        comparePrice: line.comparePrice,
        emoji: line.emoji,
        hue: line.hue,
        rating: 0,
        reviews: 0,
        sold: 0,
        stock: 99,
        createdAt: "",
        imageUrl: line.imageUrl,
      }) as Product,
    [line],
  );

  return (
    <div
      className="relative flex gap-3 rounded-[24px] p-3"
      style={{ background: "var(--s-surface)" }}
    >
      <Link
        href={`${storeHref}/products/${line.productId}`}
        className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[18px]"
        style={{ background: "var(--s-bg)" }}
      >
        <ProductArt
          product={artProduct}
          emojiClassName="text-3xl"
          width={160}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`${storeHref}/products/${line.productId}`}
            className="min-w-0"
          >
            <p className="line-clamp-2 text-sm font-semibold leading-snug">
              {line.name}
            </p>
            {line.variantLabel && (
              <p className="mt-0.5 text-xs" style={{ color: "var(--s-muted)" }}>
                {line.variantLabel}
              </p>
            )}
            <p className="mt-0.5 text-xs" style={{ color: "var(--s-muted)" }}>
              {formatPrice(line.price)} each
            </p>
          </Link>
          <button
            type="button"
            aria-label={`Remove ${line.name}`}
            onClick={() => onRemove(lineKey(line))}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition active:scale-90"
            style={{ color: "var(--s-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div
            className="flex h-9 items-center rounded-full px-0.5"
            style={{ background: "var(--s-bg)" }}
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => onQty(lineKey(line), line.qty - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-6 text-center text-sm font-semibold">
              {line.qty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => onQty(lineKey(line), line.qty + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-sm font-bold">
            {formatPrice(line.price * line.qty)}
          </span>
        </div>
      </div>
    </div>
  );
});

export default function CartClient({
  initialStore,
}: {
  initialStore: PublicStoreData;
}) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const cart = useCart();
  // Above the early returns below (rules of hooks).
  const range = useCartDeliveryRange(slug, cart.lines, cart.subtotal);

  const { data, error } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: () => fetchPublicStore(slug),
    initialData: initialStore,
    staleTime: 30_000,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Store unavailable</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this store.
        </p>
        <Button variant="outline" onClick={() => router.push(`/store/${slug}`)}>
          Back to store
        </Button>
      </div>
    );
  }

  const design = data.design as StoreDesign;

  loadFont(design.fontFamily);
  const accent = design.productAccentColor || "var(--s-text)";
  const accentOn = accent.startsWith("#") ? readableOn(accent) : "var(--s-bg)";
  const storeHref = `/store/${slug}`;

  // The district is chosen at checkout, so here we know the charge for each
  // zone. When both are the same the delivery is exact; otherwise it is shown
  // as a range and left out of the total until checkout.
  const { inside, outside } = range;
  const sameCharge = range.ready && inside.charge === outside.charge;
  const delivery = sameCharge ? inside.charge : 0;
  const total = cart.subtotal + delivery;
  const threshold = range.settings?.freeDeliveryThreshold ?? 0;
  const remainingForFree =
    threshold > 0 && (inside.base > 0 || outside.base > 0)
      ? Math.max(0, threshold - cart.subtotal)
      : 0;

  const checkoutBtn = (
    <Link
      href={`${storeHref}/checkout`}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold shadow-lg transition active:scale-[0.98] lg:shadow-none"
      style={{ background: accent, color: accentOn }}
    >
      Proceed to checkout · {formatPrice(total)}
    </Link>
  );

  return (
    <div
      style={themeVars(design)}
      className="storefront text-[15px] leading-normal"
    >
      <div
        className="min-h-screen"
        style={{ background: "var(--s-bg)", color: "var(--s-text)" }}
      >
        {design.announcementEnabled && design.announcementText && (
          <div
            className="px-4 py-2 text-center text-xs font-semibold"
            style={{
              background: "var(--s-primary)",
              color: "var(--s-on-primary)",
            }}
          >
            {design.announcementText}
          </div>
        )}

        <header
          className="sticky top-0 z-30 backdrop-blur"
          style={{
            background: "color-mix(in srgb, var(--s-bg) 90%, transparent)",
          }}
        >
          <div className="sf-container grid h-16 grid-cols-[44px_1fr_44px] items-center gap-2">
            <Link
              href={storeHref}
              // Go back to the page the shopper came from (Try the Look, a
              // product, a category...). Only fall back to the store home
              // when they arrived some other way, e.g. a direct link.
              onClick={(e) => {
                const prev = getPreviousPath();
                if (
                  prev &&
                  prev.startsWith(storeHref) &&
                  !/\/(cart|checkout)(\/|$)/.test(prev)
                ) {
                  e.preventDefault();
                  router.back();
                }
              }}
              aria-label="Back"
              className="flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90"
              style={{ background: "var(--s-surface)" }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-center text-base font-bold tracking-tight">
              My cart
              {cart.count > 0 && (
                <span
                  className="ml-1.5 text-sm font-normal"
                  style={{ color: "var(--s-muted)" }}
                >
                  ({cart.count})
                </span>
              )}
            </h1>
            <button
              type="button"
              aria-label="Clear cart"
              disabled={cart.lines.length === 0}
              onClick={() => {
                if (confirm("Remove all items from your cart?")) cart.clear();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-30"
              style={{ background: "var(--s-surface)" }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="sf-container py-4 pb-36 sm:py-8 lg:pb-10">
          {cart.lines.length === 0 ? (
            <EmptyCart
              storeHref={storeHref}
              accent={accent}
              accentOn={accentOn}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
              <div className="space-y-3">
                {cart.lines.map((line) => (
                  <CartRow
                    key={lineKey(line)}
                    line={line}
                    storeHref={storeHref}
                    onRemove={cart.removeItem}
                    onQty={cart.updateQty}
                  />
                ))}
              </div>

              <aside className="h-fit space-y-4 lg:sticky lg:top-24">
                {remainingForFree > 0 && (
                  <div
                    className="flex items-center gap-2.5 rounded-full px-4 py-3 text-xs font-medium"
                    style={{ background: "var(--s-surface)" }}
                  >
                    <Truck className="h-4 w-4 shrink-0" />
                    Add {formatPrice(remainingForFree)} more for free delivery
                  </div>
                )}

                <div
                  className="rounded-[28px] p-5"
                  style={{ background: "var(--s-surface)" }}
                >
                  <h2 className="mb-4 text-base font-bold tracking-tight">
                    Order summary
                  </h2>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <dt style={{ color: "var(--s-muted)" }}>Subtotal</dt>
                      <dd className="font-semibold">
                        {formatPrice(cart.subtotal)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt style={{ color: "var(--s-muted)" }}>Delivery</dt>
                      <dd className="font-semibold">
                        {!range.ready ? (
                          <span
                            className="text-xs font-normal"
                            style={{ color: "var(--s-muted)" }}
                          >
                            Set at checkout
                          </span>
                        ) : sameCharge ? (
                          chargeText(delivery, formatPrice)
                        ) : (
                          <span
                            className="text-xs font-normal"
                            style={{ color: "var(--s-muted)" }}
                          >
                            By district
                          </span>
                        )}
                      </dd>
                    </div>
                    {range.ready && !sameCharge && (
                      <>
                        <div
                          className="flex justify-between pl-3 text-xs"
                          style={{ color: "var(--s-muted)" }}
                        >
                          <dt>Inside Dhaka</dt>
                          <dd>{chargeText(inside.charge, formatPrice)}</dd>
                        </div>
                        <div
                          className="flex justify-between pl-3 text-xs"
                          style={{ color: "var(--s-muted)" }}
                        >
                          <dt>Outside Dhaka</dt>
                          <dd>{chargeText(outside.charge, formatPrice)}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                  <div
                    className="mt-4 flex justify-between border-t pt-4 text-base"
                    style={{ borderColor: "var(--s-border)" }}
                  >
                    <span className="font-semibold">
                      {range.ready && sameCharge
                        ? "Total"
                        : "Total before delivery"}
                    </span>
                    <span className="font-bold">{formatPrice(total)}</span>
                  </div>

                  <div className="mt-5 hidden lg:block">{checkoutBtn}</div>
                </div>
              </aside>
            </div>
          )}
        </main>

        {cart.lines.length > 0 && (
          <div
            className="fixed inset-x-0 bottom-0 z-40 px-4 pt-6 lg:hidden"
            style={{
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              backgroundImage:
                "linear-gradient(to top, var(--s-bg) 55%, transparent)",
            }}
          >
            {checkoutBtn}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCart({
  storeHref,
  accent,
  accentOn,
}: {
  storeHref: string;
  accent: string;
  accentOn: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-[32px] px-6 py-16 text-center"
      style={{ background: "var(--s-surface)" }}
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "var(--s-bg)" }}
      >
        <ShoppingBag className="h-7 w-7" style={{ color: "var(--s-muted)" }} />
      </span>
      <p className="text-lg font-semibold">Your cart is empty</p>
      <p className="max-w-sm text-sm" style={{ color: "var(--s-muted)" }}>
        Add products from the store and they&apos;ll show up here.
      </p>
      <Link
        href={storeHref}
        className="mt-2 flex h-12 items-center justify-center rounded-full px-8 text-sm font-semibold transition active:scale-95"
        style={{ background: accent, color: accentOn }}
      >
        Browse products
      </Link>
    </div>
  );
}
