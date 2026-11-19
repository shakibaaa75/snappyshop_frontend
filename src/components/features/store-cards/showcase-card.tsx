"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, FOOT, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, SH_HOVER, SH_REST, surface, SZ_PILL } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 7. Showcase: larger type, "Buy now" action                          */
/* ------------------------------------------------------------------ */

export function ShowcaseCard({ p, ctx }: CardProps) {
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
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={20}
        />
        <Badges p={p} c={c} ctx={ctx} tone="light" />
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-4">
        <Info p={p} c={c} ctx={ctx} nameClass="text-lg" />
        <div className={FOOT}>
          <Price d={d} p={p} c={c} className="text-xl" />
          <AddBtn
            p={p}
            c={c}
            icon="arrow"
            label="Buy now"
            className={SZ_PILL}
          />
        </div>
      </div>
    </article>
  );
}
