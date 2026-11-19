"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { LIFT, SH_HOVER, SH_REST } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 2. Glass: full-bleed photo, frosted info panel                      */
/* ------------------------------------------------------------------ */

export function GlassCard({ p, ctx }: CardProps) {
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
      <Badges p={p} c={c} ctx={ctx} />
      <div
        className="absolute inset-x-2 bottom-2 p-3"
        style={{
          background:
            "color-mix(in srgb, var(--s-dark, #0e0e12) 62%, transparent)",
          backdropFilter: "blur(16px) saturate(150%)",
          WebkitBackdropFilter: "blur(16px) saturate(150%)",
          border: "1px solid rgba(255,255,255,.14)",
          borderTop: "2px solid var(--s-highlight, rgba(255,255,255,.14))",
          borderRadius: 18,
          color: "#fff",
        }}
      >
        <Info p={p} c={c} ctx={ctx} tone="dark" />
        <div className="mt-3 flex items-center justify-between gap-2">
          <Price d={d} p={p} c={c} tone="dark" />
          <AddBtn p={p} c={c} kind="light" />
        </div>
      </div>
    </article>
  );
}
