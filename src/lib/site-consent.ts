/**
 * Site-wide cookie choice for the main ShopBD website (marketplace, accounts,
 * seller dashboard). Seller stores (/store/...) keep their own per-store choice
 * in lib/consent.ts, because each seller decides which ad pixels they use.
 *
 * Accept  -> optional cookies (analytics / advertising / marketing) may be used.
 * Reject  -> only essential cookies (sign-in, cart, security) are used.
 *
 * A browser privacy signal (Global Privacy Control / Do Not Track) counts as
 * "Reject" and the popup is not shown, matching lib/consent.ts.
 *
 * To gate a new optional tool (e.g. Google Analytics), load it only when
 * `hasSiteConsent()` is true and re-check on `subscribeSiteConsent`.
 */
import { hasPrivacySignal } from "@/lib/consent";

export type SiteConsent = "granted" | "denied" | "unset";

const KEY = "sbd_site_consent";
const EVENT = "sbd:site-consent";
/** Ask again after 12 months. */
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export function getSiteConsent(): SiteConsent {
  if (typeof window === "undefined") return "unset";
  if (hasPrivacySignal()) return "denied";
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return "unset";
    const { c, t } = JSON.parse(raw) as { c?: string; t?: number };
    if (typeof t !== "number" || Date.now() - t > MAX_AGE_MS) return "unset";
    return c === "granted" || c === "denied" ? c : "unset";
  } catch {
    return "unset"; // storage blocked or corrupted: behave as "not answered"
  }
}

export function hasSiteConsent(): boolean {
  return getSiteConsent() === "granted";
}

export function setSiteConsent(choice: SiteConsent) {
  try {
    if (choice === "unset") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ c: choice, t: Date.now() }));
  } catch {
    /* ignore: listeners below still update the UI for this visit */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeSiteConsent(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb); // other tabs
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}