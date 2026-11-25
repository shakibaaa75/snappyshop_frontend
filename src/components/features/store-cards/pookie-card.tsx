"use client";

import { type CSSProperties } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/store-design/utilts";
import {
  toggleWishlistItem,
  useWishlisted,
} from "@/lib/store-design/use-wishlist";
import { Art, WideActions } from "./parts";
import { L, useCardData } from "./shared-logic";
import { EASE, FOCUS } from "./tokens";
import { type CardProps } from "./types";
import { POOKIE_CARD_BG } from "./pookie-card-config";

/* ------------------------------------------------------------------ */
/* Pookie: image background, photo, sale badge, round heart, price  */
/* swatches, price and a wide add button. No panel of its own.        */
/*                                                                     */
/* Background images are set in ./pookie-card-config.ts                */
/* ------------------------------------------------------------------ */

/** White outline around dark text, drawn behind the letters so they keep their weight. */
const OUTLINE: CSSProperties = {
  WebkitTextStroke: "4px #fff",
  paintOrder: "stroke fill",
};

function PookieWish({
  slug,
  id,
  interactive,
}: {
  slug: string;
  id: string;
  interactive: boolean;
}) {
  const saved = useWishlisted(slug, id, interactive);
  const base = cn(
    `absolute right-[var(--pk-in)] top-[var(--pk-in)] z-10 grid h-9 w-9 place-items-center rounded-full @[230px]:h-11 @[230px]:w-11 transition-transform duration-200 ${EASE} hover:scale-105 active:scale-90`,
    FOCUS,
  );
  const style = {
    background: "var(--s-primary)",
    color: "var(--s-on-primary, #fff)",
    boxShadow: "0 0 0 3px rgba(255,255,255,.55)",
  };
  const icon = (
    <Heart
      className="h-4 w-4 @[230px]:h-5 @[230px]:w-5"
      fill={saved ? "currentColor" : "none"}
    />
  );
  if (!interactive) {
    return (
      <span className={base} style={style}>
        {icon}
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlistItem(slug, id);
      }}
      className={base}
      style={style}
    >
      {icon}
    </button>
  );
}

export function PookieCard({ p, ctx }: CardProps) {
  const { d } = ctx;
  const c = useCardData(p, ctx);

  const showSale =
    c.onSale && d.showSaleBadge && !(c.soldOut && d.showStockStatus);
  const showSoldOut = c.soldOut && d.showStockStatus;

  // No image until POOKIE_CARD_BG is set: just a plain soft pink.
  const cardBg = {
    backgroundColor: "color-mix(in srgb, var(--s-secondary) 30%, #fff)",
    ...(POOKIE_CARD_BG && {
      backgroundImage: `url(${JSON.stringify(POOKIE_CARD_BG)})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }),
  };

  return (
    <article
      className="@container group relative flex h-full min-w-0 flex-col overflow-hidden [--pk-in:12px] @[230px]:[--pk-in:16px]"
      style={{
        ...cardBg,
        borderRadius: 30,
        border: "3px solid rgba(255,255,255,.7)",
        boxShadow:
          "0 14px 30px -16px color-mix(in srgb, var(--s-primary) 55%, transparent)",
        color: "var(--s-text)",
      }}
    >
      {/* Photo */}
      <div className="relative">
        <Art
          p={p}
          c={c}
          ctx={ctx}
          aspect="1 / 1"
          radius={0}
          bg="transparent"
          className="p-[var(--pk-in)] [&_img]:rounded-2xl [&_img]:object-contain [&_img]:drop-shadow-[0_10px_14px_rgba(90,16,48,.35)]"
        />

        {showSale && (
          <span
            className="pointer-events-none absolute left-[var(--pk-in)] top-[var(--pk-in)] z-10 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold leading-none @[230px]:text-sm"
            style={{
              background: "var(--s-sale, var(--s-primary))",
              color: "var(--s-on-sale, #fff)",
            }}
          >
            -{c.off}%
          </span>
        )}
        {showSoldOut && (
          <span
            className="pointer-events-none absolute left-[var(--pk-in)] top-[var(--pk-in)] z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
            style={{ background: "rgba(17,17,20,.82)", color: "#fff" }}
          >
            Sold out
          </span>
        )}
        {d.showWishlist && (
          <PookieWish
            slug={d.storeSlug}
            id={p.id}
            interactive={ctx.interactive}
          />
        )}
      </div>

      {/* Info panel (no background: the card image shows through) */}
      <div className="relative flex flex-1 flex-col px-[var(--pk-in)] pb-[var(--pk-in)] pt-0.5">
        <L on={ctx.interactive} href={c.href} className="block min-w-0">
          <p
            className="-mx-0.5 line-clamp-1 px-0.5 py-0.5 text-[15px] font-bold leading-snug tracking-tight @[230px]:text-xl"
            style={{ color: "var(--s-primary)", ...OUTLINE }}
          >
            {p.name}
          </p>
          <p
            className="line-clamp-1 text-xs @[230px]:text-sm"
            style={{
              color: "color-mix(in srgb, var(--s-secondary) 85%, #fff)",
            }}
          >
            {c.sub}
          </p>
        </L>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5 @[230px]:pt-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <span
              className="block text-lg font-extrabold leading-none tracking-tight tabular-nums @[230px]:text-2xl"
              style={{ color: "var(--s-primary)", ...OUTLINE }}
            >
              {formatPrice(p.price)}
            </span>
            {d.showComparePrice && c.onSale && (
              <span
                className="block whitespace-nowrap text-[11px] leading-none tabular-nums line-through @[230px]:text-sm"
                style={{ color: "var(--s-primary)", ...OUTLINE }}
              >
                {formatPrice(p.comparePrice as number)}
              </span>
            )}
          </div>
        </div>

        {c.canAdd && (
          <WideActions
            p={p}
            c={c}
            className="mt-2.5 @[230px]:mt-3"
            btnClass={`inline-flex h-9 items-center justify-center gap-2 rounded-full text-[13px] font-bold transition-transform duration-200 ${EASE} hover:scale-[1.02] active:scale-95 @[230px]:h-11 @[230px]:text-[15px]`}
            iconClass="h-4 w-4 @[230px]:h-5 @[230px]:w-5"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--s-primary) 80%, #fff), var(--s-primary))",
              color: "var(--s-on-primary, #fff)",
              border: "2px solid rgba(255,255,255,.7)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.35), 0 8px 16px -8px var(--s-primary)",
            }}
            altStyle={{
              background: "rgba(255,255,255,.88)",
              color: "var(--s-primary)",
              border: "2px solid var(--s-primary)",
            }}
          />
        )}
      </div>
    </article>
  );
}
