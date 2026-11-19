"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Chip, FOOT, Info, Price, Wish } from "./parts";
import { useCardData } from "./shared-logic";
import { LIFT, SH_HOVER, SH_REST, surface } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 5. Compact: horizontal row                                          */
/* ------------------------------------------------------------------ */

export function CompactCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <div className="@container min-w-0">
      <article
        className={cn(
          "group relative flex min-w-0 flex-col gap-3 p-2 @[240px]:flex-row",
          LIFT,
          SH_REST,
          SH_HOVER,
        )}
        style={surface({ borderRadius: 18 })}
      >
        <div className="relative w-full shrink-0 @[240px]:w-2/5">
          <Art p={p} c={c} ctx={ctx} aspect="1 / 1" radius={12} />
          <Chip
            soldOut={c.soldOut}
            onSale={c.onSale}
            off={c.off}
            showStock={d.showStockStatus}
            showSale={d.showSaleBadge}
            position="left-1.5 top-1.5"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
          <Info p={p} c={c} ctx={ctx} />
          <div className={FOOT}>
            <Price d={d} p={p} c={c} />
            <div className="flex items-center gap-1.5">
              {d.showWishlist && (
                <Wish
                  slug={d.storeSlug}
                  id={p.id}
                  interactive={ctx.interactive}
                  tone="light"
                />
              )}
              <AddBtn
                p={p}
                c={c}
                icon="plus"
                className="h-9 w-9 rounded-full"
              />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
