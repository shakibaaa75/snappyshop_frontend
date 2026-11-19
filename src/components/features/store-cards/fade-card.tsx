"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, FOOT, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { LIFT, SH_DEEP } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 9. Fade: dark card, photo dissolves into the surface                */
/* ------------------------------------------------------------------ */

export function FadeCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  const mask = "linear-gradient(to bottom, #000 60%, transparent)";
  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col overflow-hidden",
        LIFT,
      )}
      style={{
        background: "var(--s-dark, #121316)",
        color: "#fff",
        borderRadius: 24,
        boxShadow: SH_DEEP,
      }}
    >
      <div
        className="relative"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        <Art p={p} c={c} ctx={ctx} aspect="4 / 5" radius={0} />
        <Badges p={p} c={c} ctx={ctx} />
      </div>
      <div className="relative z-10 -mt-12 flex flex-1 flex-col px-4 pb-4">
        <Info p={p} c={c} ctx={ctx} tone="dark" nameClass="text-[15px]" />
        <div className={FOOT}>
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
