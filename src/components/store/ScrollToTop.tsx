"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Always start a store page at the top, unless the URL has a #hash. */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
