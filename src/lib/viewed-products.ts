"use client";

import { useSyncExternalStore } from "react";

/**
 * Marketplace-wide "Recently viewed" list: every seller, newest first.
 *
 * It lives only in this browser (localStorage). Nothing is sent to the server.
 * Each entry is a small snapshot (title, price, photo) so the home page can
 * show the row without asking the API again. A price can be a little out of
 * date until the visitor opens that product again, which refreshes it.
 *
 * This is not the same as components/store-design/preview/recently-viewed.ts,
 * which remembers product IDs inside ONE seller's own store.
 */

export interface ViewedProduct {
  id: string;
  /** Seller store slug. The product page is /products/<slug>/<id>. */
  slug: string;
  storeName: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
}

/** How many products are remembered. The home page shows a few; "See all" shows every one. */
export const MAX_VIEWED = 20;

// Underscores on purpose: purgeLocalStoreData() deletes keys that end in ":<store slug>".
const KEY = "shopbd_viewed_products";

const EMPTY: readonly ViewedProduct[] = Object.freeze([]);

const keyOf = (p: Pick<ViewedProduct, "slug" | "id">) => `${p.slug}/${p.id}`;

const isText = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "";
const isMoney = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Keeps only well-formed entries, so a damaged or old value can never break the page. */
function clean(v: unknown): ViewedProduct | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (!isText(o.id) || !isText(o.slug) || !isText(o.title) || !isMoney(o.price))
    return null;
  return {
    id: o.id,
    slug: o.slug,
    storeName: isText(o.storeName) ? o.storeName : o.slug,
    title: o.title,
    price: o.price,
    compareAtPrice:
      isMoney(o.compareAtPrice) && o.compareAtPrice > 0
        ? o.compareAtPrice
        : undefined,
    image: isText(o.image) ? o.image : undefined,
  };
}

/* ---- store (same pattern as use-wishlist.ts) ----------------------------- */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
const onStorage = (e: StorageEvent) => {
  if (e.key === null || e.key === KEY) emit(); // another tab changed it
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

// useSyncExternalStore needs the SAME array back until the data changes.
let cache: { raw: string | null; list: readonly ViewedProduct[] } | null = null;

/** The saved list, newest first. Empty on the server or when storage is blocked. */
export function getViewedProducts(): readonly ViewedProduct[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY; // server render, private mode or blocked storage
  }
  if (cache && cache.raw === raw) return cache.list;

  let list: readonly ViewedProduct[] = EMPTY;
  try {
    const data: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(data)) {
      const seen = new Set<string>();
      const out: ViewedProduct[] = [];
      for (const entry of data) {
        const item = clean(entry);
        if (!item || seen.has(keyOf(item))) continue;
        seen.add(keyOf(item));
        out.push(item);
        if (out.length === MAX_VIEWED) break;
      }
      if (out.length) list = out;
    }
  } catch {
    /* damaged value: treat as empty */
  }
  cache = { raw, list };
  return list;
}

function save(list: readonly ViewedProduct[]) {
  try {
    if (list.length) localStorage.setItem(KEY, JSON.stringify(list));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage full or blocked: the history just isn't kept */
  }
  emit();
}

/* ---- public API ---------------------------------------------------------- */

/** Call when a product page opens. Moves the product to the front (no duplicates). */
export function recordProductView(item: ViewedProduct) {
  const entry = clean(item);
  if (!entry) return;
  const rest = getViewedProducts().filter((p) => keyOf(p) !== keyOf(entry));
  save([entry, ...rest].slice(0, MAX_VIEWED));
}

export function clearViewedProducts() {
  save(EMPTY);
}

/** Drops every product of one store (used when a store's address is retired). */
export function forgetViewedStore(slug: string) {
  const list = getViewedProducts();
  const next = list.filter((p) => p.slug !== slug);
  if (next.length !== list.length) save(next);
}

export function useViewedProducts(): readonly ViewedProduct[] {
  return useSyncExternalStore(subscribe, getViewedProducts, () => EMPTY);
}