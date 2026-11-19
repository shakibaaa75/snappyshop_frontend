declare global {
  interface Window {
    ttq?: {
      instance?: (id: string) => TikTokInstance;
      [k: string]: unknown;
    };
    TiktokAnalyticsObject?: string;
  }
}

interface TikTokInstance {
  track?: (event: string, params?: Record<string, unknown>, options?: { event_id?: string }) => void;
  page?: () => void;
}

/** TikTok pixel IDs are upper-case letters and digits. Validating also stops
 *  script injection, because sellers type this value and it ends up in a <script>. */
export function isValidTikTokPixelId(id?: string | null): id is string {
  return !!id && /^[A-Z0-9]{10,32}$/.test(id);
}

// The pixel of the store on screen. Every call below targets THIS pixel only,
// so if another store's pixel was ever loaded in the same tab it gets nothing.
let activeId: string | null = null;

export function setActiveTikTokPixel(id: string | null) {
  activeId = id;
}

function instance(): TikTokInstance | null {
  if (!activeId || typeof window === "undefined") return null;
  try {
    return window.ttq?.instance?.(activeId) ?? null;
  } catch {
    return null;
  }
}

/** Safe wrapper: does nothing if the pixel isn't loaded (no ID, no consent, ad blocker). */
export function ttqTrack(event: string, params?: Record<string, unknown>, eventId?: string) {
  try {
    instance()?.track?.(event, params ?? {}, eventId ? { event_id: eventId } : undefined);
  } catch {
    /* tracking must never break the store */
  }
}

export function ttqPage() {
  try {
    instance()?.page?.();
  } catch {
    /* ignore */
  }
}

export function ttqRevokeConsent() {
  try {
    (window.ttq?.revokeConsent as (() => void) | undefined)?.();
  } catch {
    /* ignore */
  }
}
