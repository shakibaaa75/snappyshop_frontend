import { trackingRuntime } from "@/lib/consent";

const KEY = "sbd_vid";
const VIEW_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Persistent per-device token, only when the visitor allows it (see
 * lib/consent.ts). Returns "" when not allowed or when storage is blocked.
 * An empty ID is fine: the API then counts the visit anonymously, with a
 * one-way hash that changes every day.
 */
export function getVisitorId(): string {
  if (!trackingRuntime.allowed) return "";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return ""; // storage blocked, the backend falls back to IP + user agent
  }
}

// Without consent we don't write to localStorage; remember in memory instead.
const memory = new Map<string, number>();

/** True if this device has not counted this event for this product inside the window. */
export function shouldCountEvent(
  kind: "viewed" | "carted" | "clicked",
  storeSlug: string,
  productId: string,
): boolean {
  const key = `sbd_${kind}:${storeSlug}:${productId}`;
  const now = Date.now();

  if (!trackingRuntime.allowed) {
    const last = memory.get(key) ?? 0;
    if (last && now - last < VIEW_WINDOW_MS) return false;
    memory.set(key, now);
    return true;
  }

  try {
    const last = Number(localStorage.getItem(key) || 0);
    if (last && now - last < VIEW_WINDOW_MS) return false;
    localStorage.setItem(key, String(now));
    return true;
  } catch {
    return true;
  }
}

export const shouldCountView = (storeSlug: string, productId: string) =>
  shouldCountEvent("viewed", storeSlug, productId);
