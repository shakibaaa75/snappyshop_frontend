/**
 * Works out where a visitor came from. The API turns whatever we send into a
 * fixed set of sources (facebook, tiktok, google, direct, ...), so here we only
 * pass along the best raw hint.
 *
 * The first source seen in a browser tab is kept for that tab, so a visitor who
 * arrives from Facebook and then clicks around the store is still credited to
 * Facebook when they buy (not "direct").
 */

const SESSION_KEY = "sbd_src";
let memorySource: string | null = null;

/** Ad-click IDs that reveal the platform even when the referrer is stripped. */
const CLICK_ID_SOURCES: Array<[param: string, source: string]> = [
  ["fbclid", "facebook"],
  ["ttclid", "tiktok"],
  ["gclid", "google"],
  ["gbraid", "google"],
  ["wbraid", "google"],
  ["igshid", "instagram"],
];

function fromLocation(): string | null {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source")?.trim();
  if (utm) return utm.slice(0, 64);
  for (const [p, src] of CLICK_ID_SOURCES) if (params.has(p)) return src;
  return null;
}

function fromReferrer(): string | null {
  if (!document.referrer) return null;
  try {
    const host = new URL(document.referrer).hostname;
    if (!host || host === window.location.hostname) return null; // internal navigation
    return host;
  } catch {
    return null;
  }
}

/** Pure helper (easy to test): pick the first available hint. */
export function pickSource(utmOrClickId: string | null, referrerHost: string | null): string {
  return utmOrClickId || referrerHost || "direct";
}

export function getTrafficSource(): string {
  if (typeof window === "undefined") return "direct";
  const fresh = pickSource(fromLocation(), fromReferrer());

  if (memorySource === null) {
    try {
      memorySource = sessionStorage.getItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
  // A new external hint wins; plain internal navigation keeps the first source.
  if (fresh !== "direct" || memorySource === null) {
    memorySource = fresh;
    try {
      sessionStorage.setItem(SESSION_KEY, fresh);
    } catch {
      /* ignore */
    }
  }
  return memorySource;
}
