"use client";

import { Check, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/store-design/utilts";
import { Art, Badges } from "./parts";
import { L, useCardData } from "./shared-logic";
import { aspectCss, FOCUS } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* Gallery grid (premium): flat, edge-to-edge, hairline cells          */
/* ------------------------------------------------------------------ */

export function GridCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  return (
    <article
      className="@container group relative flex h-full min-w-0 flex-col"
      style={{ background: "var(--s-bg)", color: "var(--s-text)" }}
    >
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect={aspectCss[d.imageAspectRatio]}
          radius={0}
        />
        <Badges p={p} c={c} ctx={ctx} tone="light" />
      </div>
      <div className="flex items-end justify-between gap-3 px-3 pb-3 pt-3">
        <L on={ctx.interactive} href={c.href} className="block min-w-0 flex-1">
          <p
            className="line-clamp-2 text-[11px] font-bold uppercase leading-snug tracking-[0.02em]"
            style={{ color: "var(--s-title, var(--s-text))" }}
          >
            {p.name}
          </p>
          <p
            className="mt-1 text-[11px] tabular-nums"
            style={{ color: "var(--s-muted)" }}
          >
            {formatPrice(p.price)}
            {d.showComparePrice && c.onSale && (
              <span className="ml-2 line-through opacity-70">
                {formatPrice(p.comparePrice as number)}
              </span>
            )}
          </p>
        </L>
        {c.canAdd && (
          <div className="flex shrink-0 items-center">
            {(c.both
              ? (["cart", "buy"] as const)
              : ([c.buyNow ? "buy" : "cart"] as const)
            ).map((action) => {
              const buy = action === "buy";
              const done = !buy && c.added;
              const Icon = done ? Check : buy ? Zap : Plus;
              return (
                <button
                  key={action}
                  type="button"
                  onClick={buy ? c.buy : c.addToCart}
                  aria-label={
                    c.paused ? "Store paused" : buy ? c.ariaBuy : c.ariaCart
                  }
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center transition-opacity hover:opacity-60",
                    FOCUS,
                    c.paused && "opacity-50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
