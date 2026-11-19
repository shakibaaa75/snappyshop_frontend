"use client";

import { type Product } from "@/lib/store-design/types";
import {
  balancedProductColumns,
} from "@/lib/store-design/template-page-layout";
import { useEffect, useRef, useState } from "react";
import { Placeholder } from "./blocks";
import { ProductCard } from "./product-card";
import { type Ctx } from "./types";

export function useStoreElementWidth(
  ref: { current: HTMLDivElement | null },
  fallback: number,
  active = true,
) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const measure = () => {
      if (el.clientWidth > 0) setWidth(el.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, active]);
  return width;
}
export function BalancedProductGrid({
  products,
  ctx,
}: {
  products: Product[];
  ctx: Ctx;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useStoreElementWidth(ref, ctx.mobile ? 360 : 1000);
  const columns = balancedProductColumns(width, ctx.d.productsPerRow);
  const flush = ctx.d.cardVariant === "grid";
  const tight = ctx.d.cardVariant === "catalog" || ctx.d.cardVariant === "drop";
  if (!products.length)
    return (
      <div ref={ref}>
        <Placeholder>No products to show yet.</Placeholder>
      </div>
    );
  return (
    <div
      ref={ref}
      data-product-display={ctx.d.template}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        columnGap: flush ? 0 : tight ? 6 : width < 600 ? 12 : 16,
        rowGap: flush ? 0 : width < 600 ? 20 : 28,
        borderTop: flush ? "1px solid var(--s-border)" : undefined,
        borderLeft: flush ? "1px solid var(--s-border)" : undefined,
      }}
    >
      {products.map((product, index) => (
        <div
          key={product.id}
          className="min-w-0"
          style={{
            borderRight: flush ? "1px solid var(--s-border)" : undefined,
            borderBottom: flush ? "1px solid var(--s-border)" : undefined,
          }}
        >
          <ProductCard p={product} ctx={ctx} index={index} />
        </div>
      ))}
    </div>
  );
}
