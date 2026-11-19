"use client";

import { cn } from "@/lib/utils";
import { AddBtn, Art, Badges, Info, Price } from "./parts";
import { useCardData } from "./shared-logic";
import { aspectCss, surface, SZ_BLOCK } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 4. Outline: flat, bordered, full-width button                       */
/* ------------------------------------------------------------------ */

export function OutlineCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col p-3",
        `transition-colors duration-200`,
      )}
      style={surface({ borderRadius: 16 })}
    >
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={10}
        />
        <Badges p={p} c={c} ctx={ctx} tone="light" />
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <Info p={p} c={c} ctx={ctx} />
        <div className="mt-auto pt-3">
          <Price d={d} p={p} c={c} />
          {c.canAdd && (
            <div className="mt-3">
              <AddBtn
                p={p}
                c={c}
                kind="outline"
                label="Add to cart"
                className={SZ_BLOCK}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
