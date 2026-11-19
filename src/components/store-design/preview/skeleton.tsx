"use client";

import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { aspectCss } from "./tokens";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

export function Shimmer({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn("block animate-pulse rounded-xl", className)}
      style={{ background: "var(--s-surface)", ...style }}
    />
  );
}
function ProductGridSkeleton({ ctx, count = 8 }: { ctx: Ctx; count?: number }) {
  const cols = ctx.mobile
    ? Math.min(2, ctx.d.productsPerRow)
    : ctx.d.productsPerRow;
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: ctx.mobile ? 10 : 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex min-w-0 flex-col">
          <Shimmer
            className="w-full rounded-[28px]"
            style={{ aspectRatio: aspectCss[ctx.d.imageAspectRatio] }}
          />
          <div className="mt-3 flex justify-between px-2">
            <Shimmer className="h-3.5 w-1/3" />
            <Shimmer className="h-3.5 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
export function StoreSkeleton({ ctx }: { ctx: Ctx }) {
  return (
    <main
      className={cn(
        "flex min-w-0 flex-col",
        ctx.mobile ? "gap-8 pb-2 pt-6" : "gap-12 pt-4",
      )}
    >
      <Shimmer
        className={cn("h-12 w-full rounded-full", ctx.mobile && "mx-4 w-auto")}
      />
      <div className="space-y-4">
        <Shimmer className="h-6 w-40" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} className="h-20 w-[60px] shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Shimmer className="h-6 w-32" />
        <ProductGridSkeleton ctx={ctx} />
      </div>
    </main>
  );
}
