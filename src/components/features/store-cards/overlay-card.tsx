"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { LIFT, SH_HOVER, SH_REST } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 3. Overlay: full-bleed photo, text on a dark fade                   */
/* ------------------------------------------------------------------ */

export function OverlayCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn(
        "group relative isolate min-w-0 overflow-hidden",
        LIFT,
        SH_REST,
        SH_HOVER,
      )}
      style={{
        aspectRatio: "4 / 5",
        borderRadius: 24,
        background: "var(--s-surface)",
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
      <Badges p={p} c={c} ctx={ctx} />
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <Info p={p} c={c} ctx={ctx} tone="dark" nameClass="text-[15px]" />
        <div className="mt-3 flex items-center justify-between gap-2">
          <Price
            d={d}
            p={p}
            c={c}
            tone="dark"
            accent="var(--s-highlight, #fff)"
          />
          <AddBtn p={p} c={c} kind="light" />
        </div>
      </div>
    </article>
  );
}
