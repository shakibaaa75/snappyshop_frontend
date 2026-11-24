"use client";

import {
  type Category,
  type Product,
  type StoreDesign,
} from "@/lib/store-design/types";
import { templatePageLayout } from "@/lib/store-design/template-page-layout";
import {
  productDisplay,
  productSpan,
} from "@/lib/store-design/product-display";
import { memo, useMemo } from "react";
import { radiusPx } from "@/lib/store-design/utilts";
import { BalancedProductGrid } from "./balanced-grid";
import { Placeholder } from "./blocks";
import { useIsMobile } from "./hooks";
import { ProductCard } from "./product-card";
import { type Ctx } from "./types";

/**
 * The store's own product cards (variant, colors, photo ratio, columns,
 * corner shape) as one small grid. Used for "You may also like" on the product
 * page so it matches the home page and the products page exactly.
 * Shows `rows` rows of the template's products-per-row setting.
 */
export function StoreProductGrid({
  design,
  products,
  categories = [],
  interactive = true,
  mobile: mobileProp,
  rows = 1,
}: {
  design: StoreDesign;
  products: Product[];
  categories?: Category[];
  interactive?: boolean;
  /** Force the phone layout (editor preview). Omit to follow the screen. */
  mobile?: boolean;
  rows?: number;
}) {
  const auto = useIsMobile(interactive, false);
  const mobile = mobileProp ?? auto;
  const cols = mobile
    ? Math.min(2, design.productsPerRow)
    : design.productsPerRow;
  const list = products.slice(0, cols * rows);
  const ctx = useMemo<Ctx>(
    () => ({
      d: design,
      mobile,
      radius: radiusPx[design.buttonRadius],
      products,
      categories,
      verified: design.showVerifiedBadge,
      interactive,
    }),
    [design, mobile, products, categories, interactive],
  );
  return <ProductGrid products={list} ctx={ctx} />;
}
export const ProductGrid = memo(function ProductGrid({
  products,
  ctx,
}: {
  products: Product[];
  ctx: Ctx;
}) {
  if (templatePageLayout(ctx.d.template))
    return <BalancedProductGrid products={products} ctx={ctx} />;
  if (products.length === 0) {
    return <Placeholder>No products to show yet.</Placeholder>;
  }
  const cols = ctx.mobile
    ? Math.min(2, ctx.d.productsPerRow)
    : ctx.d.productsPerRow;
  const look = productDisplay(ctx.d.template, ctx.mobile);
  const mobileYokai = ctx.mobile && ctx.d.template === "yokai";
  const flush = ctx.d.cardVariant === "grid";
  /* Catalog cards sit nearly edge to edge, like a lookbook sheet. */
  const tight = ctx.d.cardVariant === "catalog" || ctx.d.cardVariant === "drop";
  return (
    <div
      className="grid"
      data-product-display={ctx.d.template}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        columnGap: flush ? 0 : tight ? 4 : look.gap,
        rowGap: flush ? 0 : look.rowGap,
        ...(mobileYokai && { columnGap: 10, rowGap: 24 }),
        ...(flush
          ? {
              borderTop: "1px solid var(--s-border)",
              borderLeft: "1px solid var(--s-border)",
            }
          : null),
      }}
    >
      {products.map((p, i) => (
        <div
          key={p.id}
          className="min-w-0"
          style={{
            gridColumn: `span ${productSpan(look, i, products.length, cols, ctx.mobile)}`,
            paddingTop:
              look.stagger && (i % cols) % 2 === 1 ? look.stagger : undefined,
            ...(flush
              ? {
                  borderRight: "1px solid var(--s-border)",
                  borderBottom: "1px solid var(--s-border)",
                }
              : {}),
          }}
        >
          <ProductCard p={p} ctx={ctx} index={i} />
        </div>
      ))}
    </div>
  );
});
