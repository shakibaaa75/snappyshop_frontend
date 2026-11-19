"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Chip, Info, Price, Wish } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, SH_CSS, SH_HOVER, SH_REST, surface } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 16. Rail: vertical action rail on the photo                         */
/* ------------------------------------------------------------------ */

export function RailCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  const hasRail = d.showWishlist || c.canAdd;
  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col p-2",
        LIFT,
        SH_REST,
        SH_HOVER,
      )}
      style={surface({ borderRadius: 22 })}
    >
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={16}
        />
        <Chip
          soldOut={c.soldOut}
          onSale={c.onSale}
          off={c.off}
          showStock={d.showStockStatus}
          showSale={d.showSaleBadge}
        />
        {hasRail && (
          <div
            className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1.5 rounded-full p-1"
            style={{
              background: "var(--s-surface)",
              border: "1px solid var(--s-border)",
              boxShadow: SH_CSS,
            }}
          >
            {d.showWishlist && (
              <Wish
                slug={d.storeSlug}
                id={p.id}
                interactive={ctx.interactive}
                tone="light"
              />
            )}
            <AddBtn p={p} c={c} className="h-9 w-9 rounded-full" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-3.5">
        <Info p={p} c={c} ctx={ctx} nameClass="text-[15px]" />
        <div className="mt-auto pt-3">
          <Price d={d} p={p} c={c} />
        </div>
      </div>
    </article>
  );
}
