"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { isValidTikTokPixelId, setActiveTikTokPixel, ttqPage } from "@/lib/tiktok-pixel";

/**
 * Loads the seller's TikTok pixel. Render it only when the visitor allows ad
 * tracking (<TrackingProvider> does this for you).
 */
export function TikTokPixel({ pixelId }: { pixelId?: string | null }) {
  const pathname = usePathname();
  const first = useRef(true);
  const valid = isValidTikTokPixelId(pixelId);

  useEffect(() => {
    if (!valid) return;
    setActiveTikTokPixel(pixelId);
    return () => setActiveTikTokPixel(null);
  }, [valid, pixelId]);

  // The script sends the first page view; this covers client-side navigation.
  useEffect(() => {
    if (!valid) return;
    if (first.current) {
      first.current = false;
      return;
    }
    ttqPage();
  }, [pathname, valid]);

  if (!valid) return null;

  return (
    <Script id={`tiktok-pixel-${pixelId}`} strategy="afterInteractive">
      {`
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${pixelId}');
  ttq.instance('${pixelId}').page();
}(window, document, 'ttq');
      `}
    </Script>
  );
}
