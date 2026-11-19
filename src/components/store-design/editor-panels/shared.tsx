"use client";

import { cn } from "@/lib/utils";
import { type ShopNameControls } from "./types";

export function shopNameHint(shop?: ShopNameControls): string {
  if (!shop) return "";
  if (shop.remaining <= 0) {
    return "You've used your one shop name change, so the name is now permanent.";
  }
  if (!shop.canChange && shop.nextChangeAt) {
    const d = new Date(shop.nextChangeAt);
    if (!Number.isNaN(d.getTime())) {
      return `You can change your shop name on ${d.toLocaleDateString(
        undefined,
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
      )}.`;
    }
  }
  return "You can change your shop name once. After that it's locked for 30 days, and your shop URL changes with it.";
}
export const Box = ({ className }: { className?: string }) => (
  <span className={cn("block rounded-sm bg-foreground/20", className)} />
);
