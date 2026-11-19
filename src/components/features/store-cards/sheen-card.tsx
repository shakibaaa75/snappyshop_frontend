"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, SH_HOVER, SH_REST, surface } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 22. Sheen: brand-tinted edge, light sweep on hover                  */
/* ------------------------------------------------------------------ */

export function SheenCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col p-2",
        LIFT,
        SH_REST,
        SH_HOVER,
      )}
      style={surface({
        borderRadius: 24,
        border:
          "1.5px solid color-mix(in srgb, var(--s-primary) 55%, var(--s-border))",
      })}
    >
      <div className="relative overflow-hidden" style={{ borderRadius: 17 }}>
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={17}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[420%] motion-reduce:hidden"
        />
        <Badges p={p} c={c} ctx={ctx} />
      </div>
      <div className="flex flex-1 items-end justify-between gap-3 px-2.5 pb-1.5 pt-3.5">
        <div className="min-w-0 flex-1">
          <Info p={p} c={c} ctx={ctx} nameClass="text-[15px]" />
          <div className="mt-3">
            <Price
              d={d}
              p={p}
              c={c}
              className="text-xl"
              accent="var(--s-primary)"
            />
          </div>
        </div>
        <AddBtn p={p} c={c} icon="plus" className="h-11 w-11 rounded-full" />
      </div>
    </article>
  );
}
