"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, SH_HOVER, SH_REST, surface, SZ_PILL } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 17. Atelier: matted gallery frame                                   */
/* ------------------------------------------------------------------ */

export function AtelierCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn(
        "@container group relative flex h-full min-w-0 flex-col p-2.5",
        LIFT,
        SH_REST,
        SH_HOVER,
      )}
      style={surface({ borderRadius: 22 })}
    >
      <div
        className="relative p-3"
        style={{
          background: "var(--s-bg)",
          border: "1px solid var(--s-highlight, var(--s-border))",
          borderRadius: 14,
        }}
      >
        <div className="relative">
          <Art
            p={p}
            c={c}
            ctx={ctx}
            aspect={aspectCss[d.imageAspectRatio]}
            radius={6}
          />
          <Badges
            p={p}
            c={c}
            ctx={ctx}
            tone="light"
            heartClass="absolute right-2 top-2"
            chipClass="left-2 top-2"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-2 pb-1 pt-3.5">
        <span
          aria-hidden
          className="mb-2 block h-[3px] w-7 rounded-full"
          style={{ background: "var(--s-highlight, transparent)" }}
        />
        <Info p={p} c={c} ctx={ctx} nameClass="text-[15px]" />
        <div
          className="mt-3 flex items-center justify-between gap-2 border-t pt-3"
          style={{ borderColor: "var(--s-border)" }}
        >
          <Price d={d} p={p} c={c} />
          <AddBtn
            p={p}
            c={c}
            kind="outline"
            label="Add"
            className={cn(SZ_PILL, "h-9")}
          />
        </div>
      </div>
    </article>
  );
}
