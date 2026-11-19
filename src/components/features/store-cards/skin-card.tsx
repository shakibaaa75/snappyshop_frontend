"use client";

import { AddBtn, Art, Badges, Price, Rating } from "./parts";
import { L, useCardData } from "./shared-logic";
import { aspectCss } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* Skin: borderless, soft tile on top, brand / name / price below      */
/* ------------------------------------------------------------------ */

export function SkinCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className="@container group relative flex h-full min-w-0 flex-col"
      style={{ color: "var(--s-text)" }}
    >
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={8}
          bg="color-mix(in srgb, var(--s-highlight, var(--s-primary)) 55%, var(--s-bg))"
        />
        <Badges
          p={p}
          c={c}
          ctx={ctx}
          tone="light"
          heartClass="absolute right-3 top-3"
          chipClass="left-3 top-3"
        />
        {c.canAdd && (
          <div className="absolute bottom-3 right-3 z-10">
            <AddBtn p={p} c={c} icon="plus" className="h-9 w-9 rounded-full" />
          </div>
        )}
      </div>
      <L
        on={ctx.interactive}
        href={c.href}
        className="mt-3 block min-w-0 px-0.5"
      >
        <p
          className="truncate text-[11px] leading-none"
          style={{ color: "var(--s-muted)" }}
        >
          {c.sub}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p
            className="line-clamp-1 text-[15px] font-medium leading-snug"
            style={{ color: "var(--s-title, var(--s-text))" }}
          >
            {p.name}
          </p>
          <Rating d={d} p={p} className="text-xs" />
        </div>
        <div className="mt-1.5">
          <Price d={d} p={p} c={c} className="text-sm font-medium" />
        </div>
      </L>
    </article>
  );
}
