"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  configureTracking,
  getConsent,
  hasPrivacySignal,
  resetTracking,
  subscribeConsent,
  trackingRuntime,
  type StoreTrackingConfig,
} from "@/lib/consent";
import { fetchPublicTracking } from "@/lib/api/analytics";
import { pixelRevokeConsent } from "@/lib/meta-pixel";
import { ttqRevokeConsent } from "@/lib/tiktok-pixel";
import { trackStoreVisit } from "@/lib/tracking";
import { MetaPixel } from "./meta-pixel";
import { TikTokPixel } from "./tiktok-pixel";
import { ConsentBanner } from "./consent-banner";

declare global {
  interface Window {
    /** Which store's pixels were loaded in this tab (see the guard below). */
    __sbdPixelStore?: string;
  }
}

/**
 * Wrap ONE store's pages with this (for example in app/store/[slug]/layout.tsx):
 *
 *   <TrackingProvider storeSlug={slug}>{children}</TrackingProvider>
 *
 * It loads that store's own tracking settings, shows the consent banner when
 * the seller asked for one, loads the Meta / TikTok pixels only when allowed,
 * and records the store visit. Nothing here is shared between stores.
 */
export function TrackingProvider({
  storeSlug,
  children,
}: {
  storeSlug: string;
  children: ReactNode;
}) {
  const [config, setConfig] = useState<StoreTrackingConfig | null>(null);
  const [privacySignal, setPrivacySignal] = useState(false);

  // Re-render when the visitor presses Accept / Decline.
  const choice = useSyncExternalStore(
    subscribeConsent,
    () => getConsent(storeSlug),
    () => "unset" as const,
  );

  // 1. Load this store's settings. On any error: no pixels, and consent required.
  useEffect(() => {
    let cancelled = false;

    // Another store's pixel may still be loaded in this tab (client-side move
    // between stores). Its automatic events must not follow the visitor into
    // this store, so start over with a clean page.
    if (window.__sbdPixelStore && window.__sbdPixelStore !== storeSlug) {
      window.location.reload();
      return;
    }

    setPrivacySignal(hasPrivacySignal());
    fetchPublicTracking(storeSlug)
      .then((s) => {
        if (cancelled) return;
        setConfig({
          metaPixelId: s.metaPixelId || "",
          tiktokPixelId: s.tiktokPixelId || "",
          requireConsent: s.requireConsent !== false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setConfig({ metaPixelId: "", tiktokPixelId: "", requireConsent: true });
      });
    return () => {
      cancelled = true;
      resetTracking();
    };
  }, [storeSlug]);

  // 2. Keep the runtime (read by lib/tracking.ts) in sync with config + consent.
  useEffect(() => {
    if (config) configureTracking(storeSlug, config);
  }, [storeSlug, config, choice]);

  const allowed =
    !!config && !privacySignal && (config.requireConsent ? choice === "granted" : true);

  // 3. One anonymous visit event per page load, once the settings are known.
  useEffect(() => {
    if (config) trackStoreVisit(storeSlug);
  }, [storeSlug, config]);

  // 4. Remember which store owns the loaded pixels; tell them if consent is withdrawn.
  const hasPixels = !!config && (!!config.metaPixelId || !!config.tiktokPixelId);
  useEffect(() => {
    if (allowed && hasPixels) window.__sbdPixelStore = storeSlug;
  }, [allowed, hasPixels, storeSlug]);
  useEffect(() => {
    if (!allowed && window.__sbdPixelStore === storeSlug) {
      pixelRevokeConsent();
      ttqRevokeConsent();
    }
  }, [allowed, storeSlug]);

  const showBanner = !!config && config.requireConsent && !privacySignal && choice === "unset";

  return (
    <>
      {children}
      {allowed && config?.metaPixelId ? <MetaPixel pixelId={config.metaPixelId} /> : null}
      {allowed && config?.tiktokPixelId ? <TikTokPixel pixelId={config.tiktokPixelId} /> : null}
      {showBanner ? <ConsentBanner storeSlug={storeSlug} /> : null}
    </>
  );
}

// Re-exported so callers can read the live state without importing lib/consent.
export { trackingRuntime };
