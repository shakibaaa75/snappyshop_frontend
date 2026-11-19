"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/store-design/utilts";
import { AddBtn, Art, Wish } from "./parts";
import { L, useCardData } from "./shared-logic";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* Drop: flat 4:5 photo, "Sale" tag, hover Add, centered name + price  */
/* ------------------------------------------------------------------ */

export function DropCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  const tag =
    c.soldOut && d.showStockStatus
      ? "Sold out"
      : c.onSale && d.showSaleBadge
        ? "Sale"
        : null;
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
          aspect="4 / 5"
          radius={0}
          bg="var(--s-surface)"
        />
        {tag && (
          <span
            className="pointer-events-none absolute left-2 top-2 z-10 px-2 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.1em]"
            style={
              tag === "Sold out"
                ? { background: "rgba(17,17,20,.85)", color: "#fff" }
                : { background: "var(--s-text)", color: "var(--s-bg)" }
            }
          >
            {tag}
          </span>
        )}
        {d.showWishlist && (
          <Wish
            slug={d.storeSlug}
            id={p.id}
            interactive={ctx.interactive}
            tone="light"
            className="absolute right-2 top-2 h-8 w-8 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
          />
        )}
        {c.canAdd && (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-10 transition-[opacity,transform] duration-200",
              "[@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0",
              "[@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100",
              "focus-within:translate-y-0 focus-within:opacity-100",
            )}
          >
            <AddBtn
              p={p}
              c={c}
              kind="light"
              icon="plus"
              label="Add"
              className="h-10 w-full rounded-none text-[11px] font-semibold uppercase tracking-[0.14em]"
            />
          </div>
        )}
      </div>
      <L
        on={ctx.interactive}
        href={c.href}
        className="mt-3 block min-w-0 text-center"
      >
        <p
          className="line-clamp-2 text-[13px] leading-snug"
          style={{ color: "var(--s-title, var(--s-text))" }}
        >
          {p.name}
        </p>
        <p className="mt-1 text-[13px] tabular-nums">
          {d.showComparePrice && c.onSale && (
            <span
              className="mr-2 line-through opacity-60"
              style={{ color: "var(--s-muted)" }}
            >
              {formatPrice(p.comparePrice as number)}
            </span>
          )}
          <span
            style={{
              color: c.onSale ? "var(--s-sale, #c8321e)" : "var(--s-text)",
            }}
          >
            {formatPrice(p.price)}
          </span>
        </p>
      </L>
    </article>
  );
}
