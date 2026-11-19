"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { LIFT, SH_CSS, SH_HOVER, SH_REST, surface, SZ_BLOCK } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 21. Frost: light panel overlapping the photo                        */
/* ------------------------------------------------------------------ */

export function FrostCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn(
        "@container group relative flex h-full min-w-0 flex-col p-2",
        LIFT,
        SH_REST,
        SH_HOVER,
      )}
      style={surface({ borderRadius: 26 })}
    >
      <div className="relative">
        <Art p={p} c={c} ctx={ctx} aspect="4 / 5" radius={20} />
        <Badges p={p} c={c} ctx={ctx} />
      </div>
      <div
        className="relative z-10 -mt-12 mx-2 mb-1 flex flex-1 flex-col p-3.5"
        style={{
          background: "color-mix(in srgb, var(--s-surface) 94%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--s-border)",
          borderTop: "3px solid var(--s-highlight, var(--s-border))",
          borderRadius: 18,
          boxShadow: SH_CSS,
        }}
      >
        <div className="flex flex-col gap-2 @[230px]:flex-row @[230px]:items-start @[230px]:justify-between @[230px]:gap-3">
          <div className="min-w-0 flex-1">
            <Info p={p} c={c} ctx={ctx} />
          </div>
          <Price d={d} p={p} c={c} className="text-base" />
        </div>
        {c.canAdd && (
          <div className="mt-auto pt-3">
            <AddBtn p={p} c={c} label="Add to cart" className={SZ_BLOCK} />
          </div>
        )}
      </div>
    </article>
  );
}
