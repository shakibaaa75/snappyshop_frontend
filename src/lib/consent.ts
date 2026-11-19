/**
 * Visitor consent + the tracking "runtime" for ONE storefront.
 *
 * What consent controls:
 *   - Meta / TikTok pixels (ad cookies, data sent to the ad platforms)
 *   - the persistent device ID in localStorage (used to count repeat visitors)
 * What it does NOT control: the store's own basic, anonymous counts. Those send
 * no device ID and no cookie; the server only keeps a one-way hash that changes
 * every day, so nobody can be followed across days.
 *
 * Rules, in order:
 *   1. A browser privacy signal (Global Privacy Control or Do Not Track) always
 *      means "no" - no pixels, no device ID, no banner.
 *   2. If the seller left "Ask visitors for consent" ON (the default), the
 *      visitor must press Accept first.
 *   3. If the seller turned it OFF, tracking is allowed (the seller takes that
 *      responsibility for their market), except for rule 1.
 */

export type ConsentChoice = "granted" | "denied" | "unset";

const PREFIX = "sbd_consent:";
const listeners = new Set<() => void>();

function key(storeSlug: string) {
  // One choice per store: accepting on shop A says nothing about shop B.
  return `${PREFIX}${storeSlug}`;
}

/** True when the browser asks sites not to track (GPC or Do Not Track). */
export function hasPrivacySignal(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    globalPrivacyControl?: boolean;
    msDoNotTrack?: string;
  };
  const w = window as Window & { doNotTrack?: string };
  return (
    nav.globalPrivacyControl === true ||
    nav.doNotTrack === "1" ||
    nav.msDoNotTrack === "1" ||
    w.doNotTrack === "1"
  );
}

export function getConsent(storeSlug: string): ConsentChoice {
  try {
    const v = localStorage.getItem(key(storeSlug));
    return v === "granted" || v === "denied" ? v : "unset";
  } catch {
    return "unset"; // storage blocked: behave as "not answered"
  }
}

export function setConsent(storeSlug: string, choice: "granted" | "denied" | "unset") {
  try {
    if (choice === "unset") localStorage.removeItem(key(storeSlug));
    else localStorage.setItem(key(storeSlug), choice);
  } catch {
    /* ignore: the in-memory runtime below still updates */
  }
  runtime.choice = choice;
  recompute();
  listeners.forEach((l) => l());
}

export function subscribeConsent(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/* ------------------------------------------------------------------ */
/* Runtime for the store currently on screen                           */
/* ------------------------------------------------------------------ */

export interface StoreTrackingConfig {
  metaPixelId: string;
  tiktokPixelId: string;
  requireConsent: boolean;
}

interface Runtime {
  slug: string | null;
  config: StoreTrackingConfig | null;
  choice: ConsentChoice;
  /** Pixels + device ID may be used right now. */
  allowed: boolean;
}

const runtime: Runtime = { slug: null, config: null, choice: "unset", allowed: false };

function recompute() {
  const cfg = runtime.config;
  if (!cfg || hasPrivacySignal()) {
    runtime.allowed = false;
    return;
  }
  runtime.allowed = cfg.requireConsent ? runtime.choice === "granted" : true;
}

/** Called by <TrackingProvider> once the store's config is loaded. */
export function configureTracking(slug: string, config: StoreTrackingConfig | null) {
  runtime.slug = slug;
  runtime.config = config;
  runtime.choice = getConsent(slug);
  recompute();
  listeners.forEach((l) => l());
}

export function resetTracking() {
  runtime.slug = null;
  runtime.config = null;
  runtime.choice = "unset";
  runtime.allowed = false;
}

export const trackingRuntime = {
  get slug() {
    return runtime.slug;
  },
  get config() {
    return runtime.config;
  },
  get choice() {
    return runtime.choice;
  },
  /** Pixels and the device ID are allowed right now. */
  get allowed() {
    return runtime.allowed;
  },
};
