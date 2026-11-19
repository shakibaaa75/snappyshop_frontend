"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, FOOT, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, GOLD, LIFT, SH_DEEP, SZ_PILL } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 20. Luxe: dark card with a fine highlight edge                      */
/* ------------------------------------------------------------------ */

export function LuxeCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn(
        "@container group relative flex h-full min-w-0 flex-col p-2.5",
        LIFT,
      )}
      style={{
        background: "var(--s-dark, #0e0e11)",
        color: "#fff",
        borderRadius: 22,
        border:
          "1px solid color-mix(in srgb, var(--s-highlight, #e9cf86) 45%, transparent)",
        boxShadow: `${SH_DEEP}, inset 0 0 0 2px var(--s-accent2, transparent)`,
      }}
    >
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={14}
        />
        <Badges p={p} c={c} ctx={ctx} />
      </div>
      <div className="flex flex-1 flex-col px-2 pb-1.5 pt-3.5">
        <Info p={p} c={c} ctx={ctx} tone="gold" nameClass="text-[15px]" />
        <div className={FOOT}>
          <Price
            d={d}
            p={p}
            c={c}
            tone="gold"
            className="text-xl"
            accent={GOLD}
          />
          <AddBtn p={p} c={c} kind="gold" label="Add" className={SZ_PILL} />
        </div>
      </div>
    </article>
  );
}
