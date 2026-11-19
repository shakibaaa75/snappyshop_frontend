"use client";

import { setConsent } from "@/lib/consent";

/** Asks the visitor before ad pixels and the device ID are used. */
export function ConsentBanner({ storeSlug }: { storeSlug: string }) {
  return (
    <div
      role="dialog"
      aria-label="Privacy choices"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 shadow-lg backdrop-blur sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md sm:rounded-2xl sm:border"
    >
      <p className="text-sm font-medium">Can we use tracking to improve your experience?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        This store would like to use advertising cookies (such as Meta and TikTok) and remember
        your device to measure visits and show you relevant ads. If you decline, we still count
        visits without tracking you. You can change your mind anytime from
        &ldquo;Privacy choices&rdquo; at the bottom of the page.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setConsent(storeSlug, "granted")}
          className="flex-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => setConsent(storeSlug, "denied")}
          className="flex-1 rounded-full border px-4 py-2 text-sm font-medium"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

/** Put this in the storefront footer so visitors can change their choice. */
export function PrivacyChoicesButton({
  storeSlug,
  className,
}: {
  storeSlug: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className ?? "text-xs underline underline-offset-2"}
      onClick={() => setConsent(storeSlug, "unset")}
    >
      Privacy choices
    </button>
  );
}
