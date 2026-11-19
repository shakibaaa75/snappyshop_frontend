import { type Product } from "@/lib/store-design/types";
import { useEffect, useMemo, useState } from "react";

/* Recently viewed: ProductClient calls trackRecentlyViewed on mount. */
const recentKey = (slug: string) => `shopbd-recent:${slug}`;
export function trackRecentlyViewed(slug: string, id: string) {
  try {
    const raw = window.localStorage.getItem(recentKey(slug));
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [id, ...list.filter((x) => x !== id)].slice(0, 8);
    window.localStorage.setItem(recentKey(slug), JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}
export function useRecentlyViewed(
  slug: string,
  products: Product[],
  enabled: boolean,
) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = window.localStorage.getItem(recentKey(slug));
      setIds(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setIds([]);
    }
  }, [slug, enabled]);
  return useMemo(
    () =>
      ids
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => !!p)
        .slice(0, 4),
    [ids, products],
  );
}
