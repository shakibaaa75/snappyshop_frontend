"use client";

import { marketplaceProductHref } from "@/lib/query/marketplace-links";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { ArrowRight, ShoppingBag, Store } from "lucide-react";
import { CartItem } from "@/components/features/CartItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import {
  clearSellerCart,
  removeSellerLine,
  replaceSellerCart,
  setSellerLineQty,
  useAllCarts,
  type SellerCart,
} from "@/lib/cart/marketplace-cart";
import { liveFor } from "@/lib/cart/live";
import { fetchPublicStore, type PublicStore } from "@/lib/store-design/api";
import { lineKey, type CartLine } from "@/lib/store-design/cart";

type Notice = { text: string; tone: "info" | "warn" | "error" };

export default function CartClient() {
  const { carts, count, subtotal, ready } = useAllCarts();

  // Fresh prices and stock for every seller in the cart. The query key is the
  // same one the storefront uses, so the data is shared and cached.
  const results = useQueries({
    queries: carts.map((c) => ({
      queryKey: ["public-store", c.slug],
      queryFn: () => fetchPublicStore(c.slug),
      staleTime: 30_000,
      retry: 1,
    })),
  });
  const storeBySlug = useMemo(() => {
    const m = new Map<string, PublicStore | undefined>();
    carts.forEach((c, i) => m.set(c.slug, results[i]?.data));
    return m;
  }, [carts, results]);

  // Apply what the seller says now: new price, and never more than the stock.
  // Runs only when the data or lines really changed, so it cannot loop.
  const [notices, setNotices] = useState<Record<string, Notice>>({});
  const applied = useRef<Record<string, string>>({});
  useEffect(() => {
    for (const cart of carts) {
      const store = storeBySlug.get(cart.slug);
      if (!store) continue;
      const sig = JSON.stringify(cart.lines) + store.products.length;
      if (applied.current[cart.slug] === sig) continue;

      const next: CartLine[] = [];
      const found: Record<string, Notice> = {};
      for (const line of cart.lines) {
        const live = liveFor(store, line);
        const k = `${cart.slug}/${lineKey(line)}`;
        if (!live || live.gone) {
          next.push(line);
          continue;
        }
        let l = line;
        if (live.price !== line.price) {
          found[k] = {
            text: `Price updated: ${formatPrice(line.price)} → ${formatPrice(live.price)}`,
            tone: "info",
          };
          l = { ...l, price: live.price, comparePrice: undefined };
        }
        if (live.stock > 0 && l.qty > live.stock) {
          found[k] = {
            text: `Only ${live.stock} left. Quantity lowered.`,
            tone: "warn",
          };
          l = { ...l, qty: live.stock };
        }
        next.push(l);
      }
      const nextSig = JSON.stringify(next) + store.products.length;
      applied.current[cart.slug] = nextSig;
      if (JSON.stringify(next) !== JSON.stringify(cart.lines)) {
        replaceSellerCart(cart.slug, next);
      }
      if (Object.keys(found).length) setNotices((n) => ({ ...n, ...found }));
    }
  }, [carts, storeBySlug]);

  if (!ready) return <CartSkeleton />;

  // Anything the sellers can no longer sell blocks "Checkout all".
  const anyBlocked = carts.some((c) =>
    c.lines.some((l) => {
      const live = liveFor(storeBySlug.get(c.slug), l);
      return !!live && (live.gone || live.stock === 0);
    }),
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-primary">
        <ShoppingBag className="h-6 w-6" /> Shopping Cart
        {count > 0 && (
          <span className="text-base font-medium text-muted-foreground">
            ({count} {count === 1 ? "item" : "items"})
          </span>
        )}
      </h1>

      {carts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed py-20 text-center text-muted-foreground">
          <p>Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-2 inline-block text-accent hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            Each seller ships on their own, so you check out once per seller.
          </p>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {carts.map((cart, i) => (
                <SellerGroup
                  key={cart.slug}
                  cart={cart}
                  store={storeBySlug.get(cart.slug)}
                  loading={results[i]?.isLoading ?? false}
                  notices={notices}
                />
              ))}
            </div>

            <div>
              <Card className="sticky top-24 border-muted">
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {carts.map((c) => (
                    <div key={c.slug} className="flex justify-between gap-3">
                      <span className="truncate text-muted-foreground">
                        {c.name}
                      </span>
                      <span className="shrink-0 font-medium">
                        {formatPrice(c.subtotal)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-3 text-base font-bold">
                    <span>Items total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Each seller sets its own delivery charge, shown at checkout
                    once you choose your district (Inside Dhaka or Outside
                    Dhaka).
                  </p>
                  {carts.length > 1 &&
                    (anyBlocked ? (
                      <Button className="w-full rounded-full" disabled>
                        Remove unavailable items
                      </Button>
                    ) : (
                      <Link href="/checkout" className="block">
                        <Button
                          variant="accent"
                          className="w-full rounded-full"
                        >
                          Checkout all · {formatPrice(subtotal)}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SellerGroup({
  cart,
  store,
  loading,
  notices,
}: {
  cart: SellerCart;
  store: PublicStore | undefined;
  loading: boolean;
  notices: Record<string, Notice>;
}) {
  const name = store?.design.storeName || cart.name;
  const storeHref = `/store/${cart.slug}`;

  // Anything the seller can no longer sell blocks checkout until removed.
  const blocked = cart.lines.some((l) => {
    const live = liveFor(store, l);
    return !!live && (live.gone || live.stock === 0);
  });

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
        <Link
          href={storeHref}
          className="flex min-w-0 items-center gap-2 font-semibold hover:underline"
        >
          <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{name}</span>
        </Link>
        <button
          type="button"
          onClick={() => clearSellerCart(cart.slug)}
          className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
        >
          Clear
        </button>
      </header>

      <div className="px-4">
        {cart.lines.map((line) => {
          const k = lineKey(line);
          const live = liveFor(store, line);
          let notice: Notice | undefined = notices[`${cart.slug}/${k}`];
          let maxQty: number | undefined;
          if (live?.gone) {
            notice = {
              text: "No longer available. Remove it to continue.",
              tone: "error",
            };
          } else if (live && live.stock === 0) {
            notice = {
              text: "Out of stock. Remove it to continue.",
              tone: "error",
            };
          } else if (live && live.stock > 0) {
            maxQty = live.stock;
          }
          return (
            <CartItem
              key={k}
              line={line}
              href={marketplaceProductHref(cart.slug, line.productId)}
              notice={notice}
              maxQty={maxQty}
              onQty={(q) => setSellerLineQty(cart.slug, k, q)}
              onRemove={() => removeSellerLine(cart.slug, k)}
            />
          );
        })}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Subtotal </span>
          <span className="font-bold">{formatPrice(cart.subtotal)}</span>
        </div>
        {blocked || loading ? (
          <Button className="rounded-full" disabled>
            {loading ? "Checking stock…" : "Remove unavailable items"}
          </Button>
        ) : (
          <Link href={`${storeHref}/checkout`}>
            <Button variant="accent" className="rounded-full">
              Checkout with {name} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </footer>
    </section>
  );
}

function CartSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <Skeleton className="mb-8 h-8 w-56" />
      <div className="grid gap-8 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
