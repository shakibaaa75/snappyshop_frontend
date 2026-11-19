"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, FOOT, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, LIFT, SH_DEEP } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 10. Noir: dark card, inset photo, big price                         */
/* ------------------------------------------------------------------ */

export function NoirCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn("group relative flex h-full min-w-0 flex-col p-2", LIFT)}
      style={{
        background: "var(--s-dark, #17181a)",
        color: "#fff",
        borderRadius: 24,
        border: "1px solid var(--s-highlight, rgba(255,255,255,.08))",
        boxShadow: SH_DEEP,
      }}
    >
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={16}
        />
        <Badges p={p} c={c} ctx={ctx} />
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-3.5">
        <Info p={p} c={c} ctx={ctx} tone="dark" nameClass="text-[15px]" />
        <div className={FOOT}>
          <Price
            d={d}
            p={p}
            c={c}
            tone="dark"
            className="text-2xl"
            accent="var(--s-highlight, #fff)"
          />
          <AddBtn p={p} c={c} kind="light" className="h-11 w-11 rounded-full" />
        </div>
      </div>
    </article>
  );
}
