"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, FOOT, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, SH_HOVER, SH_REST, surface, SZ_PILL } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 1. Light: the standard storefront card                              */
/* ------------------------------------------------------------------ */

export function LightCard({ p, ctx }: CardProps) {
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
      style={surface({ borderRadius: 20 })}
    >
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={14}
        />
        <Badges p={p} c={c} ctx={ctx} tone="light" />
      </div>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
        <Info p={p} c={c} ctx={ctx} nameClass="text-[15px]" />
        <div className={FOOT}>
          <Price d={d} p={p} c={c} />
          <AddBtn p={p} c={c} label="Add" className={SZ_PILL} />
        </div>
      </div>
    </article>
  );
}
