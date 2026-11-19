"use client";

import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, FOOT, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, SH_HOVER, SH_REST, surface } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 11. Ticket: perforated divider                                      */
/* ------------------------------------------------------------------ */

export function TicketCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  const notch: CSSProperties = {
    background: "var(--s-bg)",
    border: "1px solid var(--s-border)",
  };
  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col overflow-hidden p-2",
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
          radius={14}
        />
        <Badges p={p} c={c} ctx={ctx} tone="light" />
      </div>
      <div className="relative my-3">
        <div
          className="mx-4 border-t border-dashed"
          style={{ borderColor: "var(--s-border)" }}
        />
        <span
          aria-hidden
          className="absolute -left-4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
          style={notch}
        />
        <span
          aria-hidden
          className="absolute -right-4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
          style={notch}
        />
      </div>
      <div className="flex flex-1 flex-col px-2 pb-1.5">
        <Info p={p} c={c} ctx={ctx} />
        <div className={FOOT}>
          <Price d={d} p={p} c={c} />
          <AddBtn p={p} c={c} />
        </div>
      </div>
    </article>
  );
}
