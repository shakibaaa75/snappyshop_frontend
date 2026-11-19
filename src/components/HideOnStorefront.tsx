"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Wraps the marketplace header/footer in the (public) layout.
 * On /store/<slug> routes it renders nothing, so the seller's own
 * storefront chrome (rendered by LiveStorePreview) is all that shows.
 *
 * It also toggles body[data-storefront] so any global styles can be hidden.
 */
export function HideOnStorefront({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onStorefront = pathname.startsWith("/store/");

  useEffect(() => {
    document.body.toggleAttribute("data-storefront", onStorefront);
    return () => {
      document.body.removeAttribute("data-storefront");
    };
  }, [onStorefront]);

  if (onStorefront) return null;
  return <>{children}</>;
}
