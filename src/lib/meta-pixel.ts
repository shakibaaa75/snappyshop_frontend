declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Pixel IDs are digits only. Validating also stops script injection,
 *  because sellers type this value and it ends up inside a <script>. */
export function isValidPixelId(id?: string | null): id is string {
  return !!id && /^\d{8,20}$/.test(id);
}

// The pixel of the store on screen. Events are sent with "trackSingle", which
// targets only this pixel. Plain fbq("track") would go to EVERY pixel loaded on
// the page, which could leak one seller's events to another seller's pixel if a
// visitor moves between stores without a full page load.
let activeId: string | null = null;

export function setActiveMetaPixel(id: string | null) {
  activeId = id;
}

/** Safe wrapper: does nothing if the pixel isn't loaded (no ID, no consent, ad blocker). */
export function pixelTrack(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
) {
  if (!activeId || typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    if (eventId) window.fbq("trackSingle", activeId, event, params ?? {}, { eventID: eventId });
    else window.fbq("trackSingle", activeId, event, params ?? {});
  } catch {
    /* tracking must never break the store */
  }
}

/** For events Meta has no standard name for (for example a product click). */
export function pixelTrackCustom(event: string, params?: Record<string, unknown>) {
  if (!activeId || typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("trackSingleCustom", activeId, event, params ?? {});
  } catch {
    /* ignore */
  }
}

export function pixelRevokeConsent() {
  try {
    window.fbq?.("consent", "revoke");
  } catch {
    /* ignore */
  }
}
