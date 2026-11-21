"use client";

import { useSyncExternalStore } from "react";

/**
 * One shared wishlist store for every product card.
 * Before: each card added 2 window listeners and re-read localStorage on mount.
 * Now: zero window listeners per card, one cached parse per store.
 */

const keyOf = (slug: string) => `wishlist:${slug}`;
const subs = new Set<() => void>();
const cache = new Map<string, { raw: string | null; ids: Set<string> }>();
let bound = false;

function emit() {
  subs.forEach((fn) => fn());
}

function subscribe(cb: () => void) {
  if (!bound && typeof window !== "undefined") {
    window.addEventListener("storage", emit); // other tabs
    bound = true;
  }
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

function read(slug: string): Set<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(keyOf(slug));
  } catch {
    /* private mode */
  }
  const hit = cache.get(slug);
  if (hit && hit.raw === raw) return hit.ids;

  let ids = new Set<string>();
  try {
    const list = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list)) ids = new Set(list.map(String));
  } catch {
    /* corrupt value */
  }
  cache.set(slug, { raw, ids });
  return ids;
}

export function useWishlisted(slug: string, id: string, enabled = true) {
  return useSyncExternalStore(
    subscribe,
    () => enabled && read(slug).has(id),
    () => false,
  );
}

export function toggleWishlistItem(slug: string, id: string) {
  const ids = new Set(read(slug));
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  try {
    localStorage.setItem(keyOf(slug), JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
  emit();
  // keep your wishlist page / header listeners working
  window.dispatchEvent(new CustomEvent("wishlist-change"));
}

/** The whole saved set for a store (used by the wishlist page). */
export function useSavedIds(slug: string): Set<string> {
  return useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => EMPTY,
  );
}
const EMPTY: Set<string> = new Set();

function savedStoreSnapshot(): string {
  try {
    const slugs: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("wishlist:")) continue;
      const slug = key.slice("wishlist:".length);
      if (slug && read(slug).size) slugs.push(slug);
    }
    return JSON.stringify(slugs.sort());
  } catch {
    return "[]";
  }
}

export function useSavedStores(): string[] {
  const snapshot = useSyncExternalStore(subscribe, savedStoreSnapshot, () => "[]");
  return JSON.parse(snapshot) as string[];
}
