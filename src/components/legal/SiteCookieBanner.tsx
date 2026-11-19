"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSiteConsent,
  setSiteConsent,
  subscribeSiteConsent,
  type SiteConsent,
} from "@/lib/site-consent";

/**
 * Bottom-of-page cookie popup for the whole ShopBD site.
 * Mounted once in app/layout.tsx. It is hidden on seller stores (/store/...),
 * which show their own banner for the seller's ad pixels.
 */
export function SiteCookieBanner() {
  const pathname = usePathname();
  // Server + first client render use "granted" (renders nothing) so there is no
  // hydration mismatch and no flash; the real value is read right after mount.
  const choice = useSyncExternalStore<SiteConsent>(
    subscribeSiteConsent,
    getSiteConsent,
    () => "granted",
  );

  if (choice !== "unset") return null;
  if (pathname.startsWith("/store/")) return null; // stores have their own banner

  const btn =
    "h-10 flex-1 rounded-full px-5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#FF6845] focus-visible:ring-offset-2 sm:flex-none";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-[#E6DDD0] bg-white p-4 shadow-2xl dark:border-border dark:bg-card sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <span
          aria-hidden
          className="hidden h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EAE2D7] text-[#17645F] dark:bg-muted dark:text-white sm:grid"
        >
          <Cookie className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-foreground">We value your privacy</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
            We use essential cookies to keep the site working (sign-in, cart, security). With your permission we also use optional cookies for analytics and advertising to improve ShopBD.{" "}
            <Link
              href="/cookie-policy"
              className="font-medium text-[#17645F] underline underline-offset-2 dark:text-white"
            >
              Read our Cookie Policy
            </Link>
          </p>
        </div>

        {/* Equal prominence for both choices */}
        <div className="flex gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={() => setSiteConsent("denied")}
            className={cn(
              btn,
              "border border-[#17645F] text-[#17645F] hover:bg-[#EAE2D7] dark:border-white/60 dark:text-white dark:hover:bg-muted",
            )}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setSiteConsent("granted")}
            className={cn(
              btn,
              "border border-transparent bg-[#17645F] text-white hover:bg-[#17645F]/90 dark:bg-[#D93A2B] dark:hover:bg-[#D93A2B]/90",
            )}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/** Footer link that re-opens the popup so visitors can change their mind. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => setSiteConsent("unset")}
      className={className ?? "hover:text-white"}
    >
      Cookie settings
    </button>
  );
}
