"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { LIFT, SH_CSS } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 18. Arch: arched window photo, centered text                        */
/* ------------------------------------------------------------------ */

export function ArchCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col items-center text-center",
        LIFT,
      )}
      style={{ color: "var(--s-text)" }}
    >
      <div
        className="relative w-full p-1.5"
        style={{
          borderRadius: "999px 999px 26px 26px",
          border: "1px solid var(--s-border)",
          background: "var(--s-surface)",
          boxShadow: SH_CSS,
        }}
      >
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect="3 / 4"
          radius="999px 999px 20px 20px"
          className="w-full"
        />
        <Badges
          p={p}
          c={c}
          ctx={ctx}
          tone="light"
          heartClass="absolute right-5 top-16"
          chipClass="left-1/2 -translate-x-1/2 bottom-4"
        />
      </div>
      <div className="mt-4 w-full min-w-0 px-2">
        <Info p={p} c={c} ctx={ctx} center nameClass="text-[15px]" />
      </div>
      <div className="mt-auto flex w-full items-center justify-center gap-3 pt-3">
        <Price d={d} p={p} c={c} />
        <AddBtn p={p} c={c} icon="plus" className="h-9 w-9 rounded-full" />
      </div>
    </article>
  );
}
