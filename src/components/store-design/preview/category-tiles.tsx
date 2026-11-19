"use client";

import {
  type Category,
  type CategoryOptions,
  type Product,
} from "@/lib/store-design/types";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import { Link } from "./blocks";
import { catImage, muted } from "./tokens";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Category section, image styles                                      */
/*                                                                     */
/* tiles / mosaic / banner / strip / list. Their look comes from       */
/* design.categoryOptions, which each template pre-fills and the       */
/* seller can change. The photo is the category's own image, or else   */
/* the first product photo in it, or else a letter on the surface.     */
/* ------------------------------------------------------------------ */

export const CAT_GAP = { tight: 4, normal: 12, loose: 22 } as const;
export const CAT_ASPECT = {
  square: "1 / 1",
  portrait: "4 / 5",
  landscape: "4 / 3",
  wide: "16 / 7",
} as const;
export const CAT_FADE = {
  none: "none",
  soft: "linear-gradient(to top, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 58%)",
  strong:
    "linear-gradient(to top, rgba(0,0,0,.78) 0%, rgba(0,0,0,.2) 75%, rgba(0,0,0,.12) 100%)",
} as const;
export function catPhoto(c: Category, products: Product[]): string | null {
  return (
    catImage(c) ??
    products.find((p) => p.categoryId === c.id && p.imageUrl)?.imageUrl ??
    null
  );
}
/** Corner radius in px for category photos. */
export function catRadius(
  ctx: Ctx,
  o: CategoryOptions,
  square: boolean,
): number | string {
  switch (o.radius) {
    case "none":
      return 0;
    case "sm":
      return 6;
    case "md":
      return 12;
    case "lg":
      return 20;
    case "full":
      return square ? "50%" : 9999;
    default:
      return ctx.d.buttonRadius === "full" ? 20 : Math.round(ctx.radius * 1.5);
  }
}
export function CatTile({
  c,
  ctx,
  o,
  aspect,
  fill,
  forceInside,
  labelSize = "md",
}: {
  c: Category;
  ctx: Ctx;
  o: CategoryOptions;
  /** CSS aspect-ratio. Ignored when `fill` stretches the tile to its cell. */
  aspect?: string;
  fill?: boolean;
  /** Mosaic and strip always put the name on the photo. */
  forceInside?: boolean;
  labelSize?: "sm" | "md" | "lg";
}) {
  const { d, products, interactive } = ctx;
  const photo = catPhoto(c, products);
  const n = products.filter((p) => p.categoryId === c.id).length;
  const placement = forceInside && o.label === "below" ? "inside" : o.label;
  const below = placement === "below";
  const center = placement === "center";
  const radius = catRadius(ctx, o, aspect === CAT_ASPECT.square);
  /* Text on a photo is white; on the letter fallback it follows the theme. */
  const onPhoto = !!photo;
  const ink = onPhoto ? "#ffffff" : "var(--s-text)";
  const nameSize =
    labelSize === "lg"
      ? "text-lg sm:text-xl"
      : labelSize === "sm"
        ? "text-xs sm:text-sm"
        : "text-sm sm:text-base";
  const caseClass = o.textCase === "upper" ? "uppercase tracking-[0.08em]" : "";
  const countText = o.showCount ? `${n} ${n === 1 ? "item" : "items"}` : "";

  const visual = (
    <div
      className={cn("relative overflow-hidden", fill && "h-full")}
      style={{
        aspectRatio: fill ? undefined : aspect,
        borderRadius: radius,
        background: "var(--s-surface)",
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img(photo, { width: 900 })}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]"
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center text-5xl font-semibold opacity-40"
          aria-hidden
        >
          {c.emoji || c.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      {!below && onPhoto && o.overlay !== "none" && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: CAT_FADE[o.overlay] }}
          aria-hidden
        />
      )}
      {!below && (
        <span
          className={cn(
            "absolute inset-0 flex p-3 sm:p-4",
            center
              ? "flex-col items-center justify-center gap-1 text-center"
              : "items-end justify-between gap-2",
          )}
          style={{
            color: ink,
            textShadow:
              onPhoto && o.overlay === "none"
                ? "0 1px 10px rgba(0,0,0,.5)"
                : undefined,
          }}
        >
          <span className="min-w-0">
            <span
              className={cn(
                "block truncate font-semibold leading-tight",
                nameSize,
                caseClass,
              )}
            >
              {c.name}
            </span>
            {countText && (
              <span className="mt-0.5 block text-[11px] opacity-80">
                {countText}
              </span>
            )}
          </span>
          {o.showArrow && !center && (
            <ArrowUpRight
              className="h-4 w-4 shrink-0 sm:h-5 sm:w-5"
              aria-hidden
            />
          )}
        </span>
      )}
    </div>
  );

  return (
    <Link
      on={interactive}
      href={`/store/${d.storeSlug}/products?category=${c.id}`}
      className={cn(
        "group block min-w-0",
        fill && "h-full",
        below && "flex flex-col",
      )}
      aria-label={c.name}
    >
      <div
        className={cn(fill && !below && "h-full", below && "min-h-0 flex-1")}
      >
        {visual}
      </div>
      {below && (
        <span
          className={cn(
            "mt-2.5 flex items-baseline gap-2",
            o.align === "center"
              ? "justify-center text-center"
              : "justify-between",
          )}
        >
          <span className="min-w-0">
            <span
              className={cn("block truncate text-sm font-semibold", caseClass)}
            >
              {c.name}
            </span>
            {countText && (
              <span className="block text-[11px]" style={muted}>
                {countText}
              </span>
            )}
          </span>
          {o.showArrow && o.align !== "center" && (
            <ArrowUpRight
              className="h-4 w-4 shrink-0"
              style={muted}
              aria-hidden
            />
          )}
        </span>
      )}
    </Link>
  );
}
