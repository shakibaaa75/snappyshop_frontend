"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, SH_HOVER, SH_REST, surface } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 8. Orb: round add button docked on the photo corner                 */
/* ------------------------------------------------------------------ */

export function OrbCard({ p, ctx }: CardProps) {
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
        <Badges p={p} c={c} ctx={ctx} tone="light" />
        {c.canAdd && (
          <div
            className="absolute -bottom-5 right-3 z-10 rounded-full"
            style={{
              boxShadow:
                "0 0 0 4px var(--s-surface), 0 0 0 7px var(--s-highlight, transparent)",
            }}
          >
            <AddBtn
              p={p}
              c={c}
              icon="plus"
              kind="accent"
              className="h-11 w-11 rounded-full"
            />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-6">
        <Info p={p} c={c} ctx={ctx} nameClass="text-[15px]" />
        <div className="mt-auto pt-3">
          <Price d={d} p={p} c={c} />
        </div>
      </div>
    </article>
  );
}
