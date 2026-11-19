"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroStyleEditor } from "../HeroStyleEditor";
import { type PanelProps } from "./types";

/**
 * Design controls for the MAIN hero banner (collapsed by default).
 * Layout and style live in heroLayout / bannerTone so older stores and
 * templates keep working. Everything else goes in heroStyle. Extra banners
 * that don't set their own layout or style follow these.
 */
export function MainBannerDesign({
  design,
  update,
}: Pick<PanelProps, "design" | "update">) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center justify-between rounded-lg bg-muted/50 px-3 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Design this banner
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <HeroStyleEditor
          value={{
            ...design.heroStyle,
            layout: design.heroLayout,
            tone: design.bannerTone,
          }}
          onChange={(p) => {
            const { layout, tone, ...rest } = p;
            update({
              ...(layout ? { heroLayout: layout } : null),
              ...(tone ? { bannerTone: tone } : null),
              heroStyle: { ...design.heroStyle, ...rest },
            });
          }}
        />
      )}
    </div>
  );
}
