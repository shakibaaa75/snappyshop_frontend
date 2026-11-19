"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, surface, SZ_BLOCK } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 6. Spotlight: raised card, full-width primary button                */
/* ------------------------------------------------------------------ */

export function SpotlightCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn("group relative flex h-full min-w-0 flex-col p-2.5", LIFT)}
      style={surface({
        borderRadius: 22,
        boxShadow:
          "0 2px 4px rgba(16,16,24,.06), 0 16px 28px -12px rgba(16,16,24,.22)",
      })}
    >
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={16}
        />
        <Badges p={p} c={c} ctx={ctx} tone="light" />
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3.5">
        <Info p={p} c={c} ctx={ctx} nameClass="text-base" />
        <div className="mt-auto pt-3">
          <Price d={d} p={p} c={c} className="text-xl" />
          {c.canAdd && (
            <div className="mt-3">
              <AddBtn p={p} c={c} label="Add to cart" className={SZ_BLOCK} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
