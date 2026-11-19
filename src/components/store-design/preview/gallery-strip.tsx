"use client";

import { type GalleryItem } from "@/lib/store-design/types";
import { type ReactNode, useRef } from "react";
import { useGalleryAutoScroll } from "./gallery-autoscroll";

/* ------------------------------------------------------------------ */
/* Image gallery (premium)                                             */
/* ------------------------------------------------------------------ */

/**
 * Scroll-strip layout: drifts sideways on its own, smoothly and endlessly.
 *
 * - Moves by elapsed time (px per second), so speed is the same on 60Hz and
 *   120Hz screens and never stutters when a frame is dropped.
 * - The photos are repeated once, and the position wraps by exactly one set
 *   width, so the loop has no visible jump.
 * - Pauses while the pointer is over it, while it is touched, scrolled with
 *   the wheel or focused, then eases back after a short pause.
 * - Only runs while on screen, and not at all for people who prefer reduced
 *   motion (they get a normal swipeable strip). The repeat is only added
 *   when the photos are wider than the strip.
 */

export function GalleryStrip({
  items,
  renderCell,
  auto,
  speed = 28,
}: {
  items: GalleryItem[];
  renderCell: (g: GalleryItem, i: number, clone: boolean) => ReactNode;
  auto: boolean;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGalleryAutoScroll(
    ref,
    auto && items.length > 1,
    speed,
    String(items.length),
  );
  return (
    <div
      ref={ref}
      className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-proximity"
    >
      {items.map((g, i) => renderCell(g, i, false))}
    </div>
  );
}
