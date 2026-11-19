"use client";

/**
 * Marketplace-wide view of every seller's cart.
 *
 * Storage is unchanged: each seller still has its own list under
 * `shopbd-cart:<slug>` (that is what the storefront CartProvider reads and
 * writes), so a seller's themed cart and checkout keep working as they are.
 * This file only adds helpers to read ALL of them, add to one from the home
 * page, and subscribe to changes so the header badge and the /cart page stay
 * in sync with every other part of the app.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CART_CHANGE_EVENT,
  CART_KEY_PREFIX,
  lineKey,
  type CartLine,
} from "@/lib/store-design/cart";

export interface SellerCart {
  slug: string;
  name: string;
  lines: CartLine[];
  count: number;
  subtotal: number;
}

const cartKey = (slug: string) => `${CART_KEY_PREFIX}${slug}`;

function parse(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter(
      (l): l is CartLine =>
        l &&
        typeof l.productId === "string" &&
        typeof l.price === "number" &&
        Number.isFinite(l.price) &&
        typeof l.qty === "number" &&
        l.qty > 0,
    );
  } catch {
    return [];
  }
}

export function readStoreCart(slug: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    return parse(window.localStorage.getItem(cartKey(slug)));
  } catch {
    return [];
  }
}

function writeStoreCart(slug: string, lines: CartLine[]) {
  try {
    if (lines.length === 0) window.localStorage.removeItem(cartKey(slug));
    else window.localStorage.setItem(cartKey(slug), JSON.stringify(lines));
    window.dispatchEvent(new Event(CART_CHANGE_EVENT));
  } catch {
    /* storage full or blocked: the cart simply won't persist */
  }
}

/** "deshi-fashion" -> "Deshi Fashion" (used until a real shop name is known). */
export const prettySlug = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/** What the home-page Add button needs to know about a product. */
export interface AddableProduct {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  storeSlug: string;
  storeName: string;
}

/** Adds one unit of a product (no variant) to its seller's cart. */
export function addToSellerCart(p: AddableProduct, qty = 1) {
  const lines = readStoreCart(p.storeSlug);
  const i = lines.findIndex((l) => lineKey(l) === p.id);
  if (i >= 0) {
    lines[i] = { ...lines[i], qty: lines[i].qty + qty };
  } else {
    lines.push({
      productId: p.id,
      name: p.title,
      price: p.price,
      comparePrice: p.compareAtPrice,
      emoji: "🛍️",
      hue: 160,
      qty,
      imageUrl: p.image || undefined,
      storeName: p.storeName,
    });
  }
  writeStoreCart(p.storeSlug, lines);
}

export function setSellerLineQty(slug: string, key: string, qty: number) {
  const lines = readStoreCart(slug);
  const next =
    qty <= 0
      ? lines.filter((l) => lineKey(l) !== key)
      : lines.map((l) => (lineKey(l) === key ? { ...l, qty } : l));
  writeStoreCart(slug, next);
}

export function removeSellerLine(slug: string, key: string) {
  writeStoreCart(
    slug,
    readStoreCart(slug).filter((l) => lineKey(l) !== key),
  );
}

export function clearSellerCart(slug: string) {
  writeStoreCart(slug, []);
}

/** Replaces a seller's lines (used after refreshing prices and stock). */
export function replaceSellerCart(slug: string, lines: CartLine[]) {
  writeStoreCart(slug, lines);
}

/* ---- subscription ------------------------------------------------------ */

let cachedSnap: string | null = null;

/** One string that changes whenever any seller cart changes (cached between events). */
function snapshot(): string {
  if (typeof window === "undefined") return "";
  if (cachedSnap !== null) return cachedSnap;
  try {
    const parts: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(CART_KEY_PREFIX)) {
        parts.push(`${k}=${window.localStorage.getItem(k)}`);
      }
    }
    cachedSnap = parts.sort().join("\n");
    return cachedSnap;
  } catch {
    return "";
  }
}

function subscribe(cb: () => void) {
  // Drop the cache first, then notify; the first subscriber to re-read
  // rebuilds it once for everyone.
  const handler = () => {
    cachedSnap = null;
    cb();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(CART_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CART_CHANGE_EVENT, handler);
  };
}

function parseSnapshot(snap: string): SellerCart[] {
  if (!snap) return [];
  const out: SellerCart[] = [];
  for (const row of snap.split("\n")) {
    const eq = row.indexOf("=");
    if (eq < 0) continue;
    const slug = row.slice(CART_KEY_PREFIX.length, eq);
    const lines = parse(row.slice(eq + 1));
    if (lines.length === 0) continue;
    let count = 0;
    let subtotal = 0;
    for (const l of lines) {
      count += l.qty;
      subtotal += l.price * l.qty;
    }
    const name = lines.find((l) => l.storeName)?.storeName || prettySlug(slug);
    out.push({ slug, name, lines, count, subtotal });
  }
  return out;
}

/**
 * Every seller's cart, live. `ready` is false until the browser has hydrated,
 * so pages can show a skeleton instead of a wrong "empty cart" flash.
 */
export function useAllCarts() {
  const snap = useSyncExternalStore(subscribe, snapshot, () => "");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const carts = useMemo(() => parseSnapshot(snap), [snap]);
  const count = useMemo(() => carts.reduce((n, c) => n + c.count, 0), [carts]);
  const subtotal = useMemo(
    () => carts.reduce((n, c) => n + c.subtotal, 0),
    [carts],
  );
  return { carts, count, subtotal, ready };
}

/** Units of one product across the cart (for "In cart" on cards). */
export function useCartQty(slug: string, productId: string): number {
  const { carts } = useAllCarts();
  const c = carts.find((x) => x.slug === slug);
  return (
    c?.lines
      .filter((l) => l.productId === productId)
      .reduce((n, l) => n + l.qty, 0) ?? 0
  );
}
