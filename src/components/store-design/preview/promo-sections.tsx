"use client";

import { type HomeSection } from "@/lib/store-design/types";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveSpotlight } from "@/lib/store-design/utilts";
import { CategoryThumb } from "@/components/seller/CategoryThumb";
import { Block, Heading, Link, PButton, Placeholder } from "./blocks";
import { ProductGrid } from "./product-grid";
import { catImage, muted, tint } from "./tokens";
import { type Ctx } from "./types";

export function Spotlight({
  ctx,
  section,
}: {
  ctx: Ctx;
  section: HomeSection;
}) {
  const spot = resolveSpotlight(ctx.d, ctx.products, ctx.categories);
  const { mobile, interactive } = ctx;
  if (!spot) {
    return (
      <Block ctx={ctx}>
        <Placeholder>Choose a category to spotlight.</Placeholder>
      </Block>
    );
  }
  return (
    <Block ctx={ctx}>
      <div
        className={cn("rounded-[32px]", mobile ? "p-3" : "p-6")}
        style={{ background: "var(--s-surface)" }}
      >
        <div className="mb-4 flex items-center gap-4 px-1 pt-1">
          <CategoryThumb
            name={spot.category.name}
            imageUrl={catImage(spot.category)}
            className="h-14 w-14 rounded-[22px] bg-[color:var(--s-bg)] text-[color:var(--s-text)]"
            textClassName="text-2xl"
          />
          <div className="min-w-0 flex-1">
            {spot.isAuto && (
              <p className="text-xs font-semibold" style={muted}>
                Top selling category
              </p>
            )}
            <h2 className="text-xl font-bold tracking-tight">
              {section.title || spot.category.name}
            </h2>
          </div>
          {!mobile && (
            <PButton
              small
              interactive={interactive}
              href={`/store/${ctx.d.storeSlug}/products?category=${spot.category.id}`}
            >
              View {spot.category.name}
            </PButton>
          )}
        </div>
        <ProductGrid
          products={spot.products.slice(0, Math.max(1, section.limit))}
          ctx={ctx}
        />
      </div>
    </Block>
  );
}
export function Promo({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, interactive, mobile } = ctx;
  const banners = d.promoBanners;
  if (banners.length === 0) {
    return interactive ? null : (
      <Block ctx={ctx} sf="promo">
        <Placeholder>Add a promo banner to show offers.</Placeholder>
      </Block>
    );
  }
  return (
    <Block ctx={ctx} sf="promo">
      {section.title && (
        <Heading title={section.title} action={null} on={interactive} />
      )}
      <div
        className={cn(
          mobile
            ? "no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 [-webkit-overflow-scrolling:touch]"
            : "grid grid-cols-3 gap-3",
        )}
      >
        {banners.map((b) => (
          <Link
            key={b.id}
            on={interactive && !!b.url}
            href={b.url || "/"}
            className={cn(
              "relative flex flex-col justify-between overflow-hidden rounded-[24px] p-5 transition-transform active:scale-[0.98]",
              mobile ? "h-40 w-[78%] shrink-0 snap-start" : "min-h-[150px]",
            )}
            style={{ background: tint(b.color, 16), color: "var(--s-text)" }}
          >
            <span className="relative block space-y-1">
              <span className="block text-base font-bold leading-tight">
                {b.title}
              </span>
              <span className="line-clamp-2 block text-xs" style={muted}>
                {b.subtitle}
              </span>
            </span>
            {b.buttonText && (
              <span className="relative mt-4 inline-flex items-center gap-1 text-xs font-semibold">
                {b.buttonText}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </Link>
        ))}
      </div>
    </Block>
  );
}
