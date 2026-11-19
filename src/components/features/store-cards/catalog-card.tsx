"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/store-design/utilts";
import { AddBtn, Art, Badges } from "./parts";
import { L, useCardData } from "./shared-logic";
import { aspectCss, STAR } from "./tokens";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* Catalog: flat gray tile, small category label, name, price, stars   */
/* ------------------------------------------------------------------ */

export function CatalogCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  const filled = Math.max(0, Math.min(5, Math.round(p.rating)));
  const showStars = d.showRatings && p.reviews > 0;
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
          radius={0}
          bg="var(--s-surface)"
        />
        <Badges
          p={p}
          c={c}
          ctx={ctx}
          tone="light"
          heartClass="absolute right-2 top-2 h-8 w-8"
          chipClass="left-2 top-2"
        />
        {c.canAdd && (
          /* Slides up on hover; always visible where there is no hover. */
          <div
            className={cn(
              "absolute inset-x-2 bottom-2 z-10 transition-[opacity,transform] duration-200",
              "[@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0",
              "[@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100",
              "focus-within:translate-y-0 focus-within:opacity-100",
            )}
          >
            <AddBtn
              p={p}
              c={c}
              kind="primary"
              icon="bag"
              label="Add to cart"
              className="h-9 w-full text-xs font-semibold"
            />
          </div>
        )}
      </div>
      <L on={ctx.interactive} href={c.href} className="mt-3 block min-w-0">
        <p
          className="truncate text-[10px] font-medium uppercase leading-none tracking-[0.08em]"
          style={{ color: "var(--s-muted)" }}
        >
          {c.sub}
        </p>
        <p
          className="mt-1.5 line-clamp-2 text-[13px] leading-snug"
          style={{ color: "var(--s-title, var(--s-text))" }}
        >
          {p.name}
        </p>
        <p
          className="mt-1 text-xs tabular-nums"
          style={{ color: "var(--s-muted)" }}
        >
          {formatPrice(p.price)}
          {d.showComparePrice && c.onSale && (
            <span className="ml-2 line-through opacity-70">
              {formatPrice(p.comparePrice as number)}
            </span>
          )}
        </p>
        {showStars && (
          <span
            className="mt-1.5 flex items-center gap-0.5"
            role="img"
            aria-label={`Rated ${p.rating.toFixed(1)} out of 5`}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className="h-3 w-3"
                style={{ ...STAR, opacity: i < filled ? 1 : 0.25 }}
                fill="currentColor"
                aria-hidden
              />
            ))}
          </span>
        )}
      </L>
    </article>
  );
}
