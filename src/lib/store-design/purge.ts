/** sessionStorage key used to hand the registration wizard's shop details to the setup page. */
export const ONBOARDING_STORE_KEY = "shopbd:onboarding-store";

/**
 * Removes browser-side data that was keyed by a retired store address
 * (cart, wishlist, consent, follow, recently viewed, last order).
 *
 * Only this browser can be cleaned here; other visitors' browsers are not
 * reachable. Their old links still return 404 from the server.
 */
export function purgeLocalStoreData(oldSlug: string): void {
  if (typeof window === "undefined" || !oldSlug) return;
  const suffix = `:${oldSlug}`;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && k.endsWith(suffix)) doomed.push(k);
      }
      doomed.forEach((k) => store.removeItem(k));
    } catch {
      // Storage can be blocked; nothing else to do.
    }
  }
}
