"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/store-design/utilts";
import { AddBtn, Art, Badges } from "./parts";
import { L, useCardData } from "./shared-logic";
import { aspectCss, BTN, LIFT, STAR } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* 14. Chipped: no card, price + rating chips on the photo             */
/* ------------------------------------------------------------------ */

export function ChippedCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className={cn("group relative flex h-full min-w-0 flex-col", LIFT)}
      style={{ color: "var(--s-text)" }}
    >
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={22}
        />
        <Badges p={p} c={c} ctx={ctx} />
        {d.showRatings && p.reviews > 0 && (
          <span
            className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
            style={{ background: "rgba(14,14,18,.7)", color: "#fff" }}
          >
            <Star className="h-3 w-3" style={STAR} fill="currentColor" />
            {p.rating.toFixed(1)}
          </span>
        )}
        <span
          className="absolute bottom-2.5 right-2.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums"
          style={BTN.primary}
        >
          {formatPrice(p.price)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 flex-1">
          <L
            on={ctx.interactive}
            href={c.href}
            className="block min-w-0 rounded-sm"
          >
            <p className="line-clamp-1 text-[15px] font-semibold leading-snug tracking-tight">
              {p.name}
            </p>
            <p
              className="mt-0.5 truncate text-xs"
              style={{ color: "var(--s-muted)" }}
            >
              {c.sub}
              {d.showComparePrice && c.onSale && (
                <span className="ml-2 tabular-nums line-through">
                  {formatPrice(p.comparePrice as number)}
                </span>
              )}
            </p>
          </L>
        </div>
        <AddBtn p={p} c={c} icon="plus" />
      </div>
    </article>
  );
}
