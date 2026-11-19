"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, FOOT, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, SH_CSS, surface } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 13. Popout: photo lifts above the card edge                         */
/* ------------------------------------------------------------------ */

export function PopoutCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <div className="h-full pt-6">
      <article
        className={cn(
          "group relative flex h-full min-w-0 flex-col px-2.5 pb-2.5",
          LIFT,
        )}
        style={surface({ borderRadius: 22 })}
      >
        <div
          className="relative -mt-6"
          style={{
            borderRadius: 16,
            boxShadow: `${SH_CSS}, 0 0 0 3px var(--s-highlight, transparent)`,
          }}
        >
          <Art
            p={p}
            c={c}
            ctx={ctx}
            aspect={aspectCss[d.imageAspectRatio]}
            radius={16}
          />
          <Badges p={p} c={c} ctx={ctx} tone="light" />
        </div>
        <div className="flex flex-1 flex-col px-1 pt-3.5">
          <Info p={p} c={c} ctx={ctx} nameClass="text-[15px]" />
          <div className={FOOT}>
            <Price d={d} p={p} c={c} />
            <AddBtn p={p} c={c} icon="plus" />
          </div>
        </div>
      </article>
    </div>
  );
}
