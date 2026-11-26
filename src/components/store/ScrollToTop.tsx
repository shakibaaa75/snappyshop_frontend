"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// In-app navigation memory. These live for the life of the page, so they
// reset on a full reload, which is what we want.
let currentPath: string | null = null;
let previousPath: string | null = null;

/** The store page the shopper was on before this one, if they came from one. */
export function getPreviousPath(): string | null {
  return previousPath;
}

/** Always start a store page at the top, unless the URL has a #hash. */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (currentPath !== pathname) {
      previousPath = currentPath;
      currentPath = pathname;
    }
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
