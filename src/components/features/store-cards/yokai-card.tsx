"use client";

import { formatPrice } from "@/lib/store-design/utilts";
import { AddBtn, Art, Wish } from "./parts";
import { L, useCardData } from "./shared-logic";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* Yokai: square grey tile, NEW tag, name and price left-aligned       */
/* ------------------------------------------------------------------ */

const NEW_DAYS = 30;
export function YokaiCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);
  const fresh =
    !!p.createdAt &&
    Date.now() - Date.parse(p.createdAt) < NEW_DAYS * 24 * 60 * 60 * 1000;
  const tag =
    c.soldOut && d.showStockStatus
      ? "Sold out"
      : c.onSale && d.showSaleBadge
        ? "Sale"
        : p.badge || (fresh ? "NEW" : null);
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
          aspect="1 / 1"
          radius={0}
          bg="var(--s-surface)"
        />
        {tag && (
          <span
            className="pointer-events-none absolute left-2 top-2 z-10 px-2 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em]"
            style={
              tag === "Sold out"
                ? { background: "rgba(17,17,20,.85)", color: "#fff" }
                : tag === "Sale"
                  ? {
                      background: "var(--s-sale, #c8321e)",
                      color: "var(--s-on-sale, #fff)",
                    }
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
          <div className="absolute bottom-2 right-2 z-10">
            <AddBtn
              p={p}
              c={c}
              kind="primary"
              icon="plus"
              className="h-9 w-9 rounded-none"
            />
          </div>
        )}
      </div>
      <L on={ctx.interactive} href={c.href} className="mt-3 block min-w-0">
        <p
          className="line-clamp-2 text-xs font-medium uppercase leading-snug tracking-[0.04em]"
          style={{ color: "var(--s-title, var(--s-text))" }}
        >
          {p.name}
        </p>
        <p className="mt-1.5 text-xs tabular-nums">
          <span
            style={{
              color: c.onSale ? "var(--s-sale, #c8321e)" : "var(--s-text)",
            }}
          >
            {formatPrice(p.price)}
          </span>
          {d.showComparePrice && c.onSale && (
            <span
              className="ml-2 line-through opacity-60"
              style={{ color: "var(--s-muted)" }}
            >
              {formatPrice(p.comparePrice as number)}
            </span>
          )}
        </p>
      </L>
    </article>
  );
}
