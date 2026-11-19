"use client";

import { pixelTrack } from "@/lib/meta-pixel";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { trackAnalyticsEvent } from "@/lib/api/analytics";
import { shouldCountEvent } from "@/lib/api/analytics-visitor";
import type { Product } from "./types";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  comparePrice?: number;
  emoji: string;
  hue: number;
  qty: number;
  imageUrl?: string;
  /** Set when the buyer picked a size/colour. Checkout sends it to the API. */
  variantId?: string;
  variantLabel?: string;
  sku?: string;
  /** Shown on the marketplace cart page (grouped by seller). */
  storeName?: string;
}

/**
 * One cart line = product + (optional) variant. Two sizes of the same shirt
 * are two lines. Lines without a variant keep the plain product id, so old
 * saved carts and old callers keep working.
 */
export const lineKey = (l: { productId: string; variantId?: string }) =>
  l.variantId ? `${l.productId}::${l.variantId}` : l.productId;

/** Details of the picked variant, passed to addItem. */
export interface CartVariantInput {
  id: string;
  label: string;
  price: number;
  sku?: string;
  imageUrl?: string;
}

export interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
}

interface CartCtx extends CartState {
  addItem: (p: Product, qty?: number, variant?: CartVariantInput) => void;
  /** `key` comes from lineKey(line). A plain product id still works for lines without a variant. */
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  setLines: (lines: CartLine[]) => void;
  clear: () => void;
  ready: boolean;
}

const CartContext = createContext<CartCtx | null>(null);

export const CART_KEY_PREFIX = "shopbd-cart:";
/** Fired in the same tab after any cart write (the "storage" event only fires in OTHER tabs). */
export const CART_CHANGE_EVENT = "shopbd-cart-change";

const key = (slug: string) => `${CART_KEY_PREFIX}${slug}`;

function readStorage(slug: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sanitize(parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(slug: string, lines: CartLine[]): string {
  const raw = JSON.stringify(lines);
  if (typeof window === "undefined") return raw;
  try {
    if (lines.length === 0) window.localStorage.removeItem(key(slug));
    else window.localStorage.setItem(key(slug), raw);
    window.dispatchEvent(new Event(CART_CHANGE_EVENT));
  } catch {
    /* ignore quota errors */
  }
  return raw;
}

/** Keeps only well-formed lines, so a corrupted or old cart can never crash the page. */
function sanitize(lines: CartLine[]): CartLine[] {
  return lines.filter(
    (l) =>
      l &&
      typeof l.productId === "string" &&
      typeof l.price === "number" &&
      Number.isFinite(l.price) &&
      typeof l.qty === "number" &&
      l.qty > 0,
  );
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [lines, setLinesState] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // The last JSON this provider wrote or read. It stops the write ->
  // change-event -> re-read -> write loop.
  const lastRaw = useRef<string>("[]");

  useEffect(() => {
    const initial = readStorage(slug);
    lastRaw.current = JSON.stringify(initial);
    setLinesState(initial);
    setReady(true);
  }, [slug]);

  useEffect(() => {
    if (!ready) return;
    const raw = JSON.stringify(lines);
    if (raw === lastRaw.current) return;
    lastRaw.current = writeStorage(slug, lines);
  }, [slug, lines, ready]);

  // Pick up changes made elsewhere: another tab ("storage") or another
  // component in this tab, such as the Add button on the marketplace home page.
  useEffect(() => {
    const sync = () => {
      const next = readStorage(slug);
      const raw = JSON.stringify(next);
      if (raw === lastRaw.current) return;
      lastRaw.current = raw;
      setLinesState(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === key(slug)) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CART_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CART_CHANGE_EVENT, sync);
    };
  }, [slug]);

  const setLines = useCallback((next: CartLine[]) => {
    setLinesState(next);
  }, []);

  const addItem = useCallback(
    (p: Product, qty = 1, variant?: CartVariantInput) => {
      // Analytics: count one add_to_cart per device / product / 6 hours.
      // Kept outside the state updater so StrictMode can't double-fire it.
      if (shouldCountEvent("carted", slug, p.id)) {
        trackAnalyticsEvent({
          storeSlug: slug,
          kind: "add_to_cart",
          productId: p.id,
        }).catch(() => {
          /* analytics must never break the cart */
        });
      }

      // Meta Pixel: fire on every real add-to-cart, outside the
      // de-duplication guard above. The pixel itself is a no-op when
      // it hasn't been initialised for this store, so no guard needed.
      pixelTrack("AddToCart", {
        content_ids: [p.id],
        content_type: "product",
        content_name: p.name,
        value: (variant?.price ?? p.price) * qty,
        currency: "BDT",
      });

      const newKey = lineKey({ productId: p.id, variantId: variant?.id });
      setLinesState((prev) => {
        const i = prev.findIndex((l) => lineKey(l) === newKey);
        if (i >= 0) {
          const copy = [...prev];
          copy[i] = { ...copy[i], qty: copy[i].qty + qty };
          return copy;
        }
        return [
          ...prev,
          {
            productId: p.id,
            name: p.name,
            // The variant's own price and picture win over the product's.
            price: variant?.price ?? p.price,
            comparePrice: variant ? undefined : p.comparePrice,
            emoji: p.emoji,
            hue: p.hue,
            qty,
            imageUrl: variant?.imageUrl || p.imageUrl,
            variantId: variant?.id,
            variantLabel: variant?.label,
            sku: variant?.sku,
          },
        ];
      });
    },
    [slug],
  );

  const removeItem = useCallback((k: string) => {
    setLinesState((prev) => prev.filter((l) => lineKey(l) !== k));
  }, []);

  const updateQty = useCallback((k: string, qty: number) => {
    setLinesState((prev) => {
      if (qty <= 0) return prev.filter((l) => lineKey(l) !== k);
      return prev.map((l) => (lineKey(l) === k ? { ...l, qty } : l));
    });
  }, []);

  const clear = useCallback(() => {
    setLinesState([]);
  }, []);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const l of lines) {
      c += l.qty;
      s += l.price * l.qty;
    }
    return { count: c, subtotal: s };
  }, [lines]);

  // Memoized: without this every render of the provider created a new object,
  // re-rendering every component that calls useCart() (cards, header, dock).
  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count,
      subtotal,
      addItem,
      removeItem,
      updateQty,
      setLines,
      clear,
      ready,
    }),
    [
      lines,
      count,
      subtotal,
      addItem,
      removeItem,
      updateQty,
      setLines,
      clear,
      ready,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

const CART_FALLBACK: CartCtx = {
  lines: [],
  count: 0,
  subtotal: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  setLines: () => {},
  clear: () => {},
  ready: false,
};

export function useCart(): CartCtx {
  return useContext(CartContext) ?? CART_FALLBACK;
}

/** True when a <CartProvider> is already mounted above this component. */
export function useHasCartProvider(): boolean {
  return useContext(CartContext) !== null;
}

export function useCartStrict(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartStrict must be used inside a <CartProvider>");
  }
  return ctx;
}
