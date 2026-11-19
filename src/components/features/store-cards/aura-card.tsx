"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { LIFT } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 19. Aura: full-bleed photo, floating light info bar                 */
/* ------------------------------------------------------------------ */

export function AuraCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn("group relative isolate min-w-0 overflow-hidden", LIFT)}
      style={{
        aspectRatio: "4 / 5",
        borderRadius: 26,
        background: "var(--s-surface)",
        boxShadow:
          "0 2px 4px rgba(16,16,24,.06), 0 14px 26px -12px color-mix(in srgb, var(--s-primary) 45%, rgba(16,16,24,.4))",
      }}
    >
      <Art
        p={p}
        c={c}
        ctx={ctx}
        aspect="auto"
        radius={0}
        className="absolute inset-0 h-full w-full"
      />
      <Badges p={p} c={c} ctx={ctx} />
      <div
        className="absolute inset-x-2 bottom-2 p-3"
        style={{
          background: "color-mix(in srgb, var(--s-surface) 94%, transparent)",
          border: "1px solid var(--s-border)",
          borderRadius: 18,
          color: "var(--s-text)",
        }}
      >
        <Info p={p} c={c} ctx={ctx} />
        <div className="mt-3 flex items-center justify-between gap-2">
          <Price d={d} p={p} c={c} />
          <AddBtn p={p} c={c} />
        </div>
      </div>
    </article>
  );
}
