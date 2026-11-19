"use client";

import { type HomeSection } from "@/lib/store-design/types";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAllProducts } from "@/lib/store-design/utilts";
import { Block, Heading, Link, PButton } from "./blocks";
import { ProductGrid } from "./product-grid";
import { searchStoreProducts } from "./search";
import { INK, muted } from "./tokens";
import { type Ctx } from "./types";

export function AllProducts({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, products, categories, interactive, mobile } = ctx;
  const [cat, setCat] = useState("all");
  const pool = useMemo(
    () =>
      cat === "all" ? products : products.filter((p) => p.categoryId === cat),
    [cat, products],
  );
  const list = resolveAllProducts(d, pool, section.limit);
  const hasMore = pool.length > list.length;
  // "Load more" opens the full products page (keeps the chosen category).
  const moreHref =
    cat === "all"
      ? `/store/${d.storeSlug}/products`
      : `/store/${d.storeSlug}/products?category=${cat}`;
  return (
    <Block ctx={ctx}>
      <Heading
        title={section.title || "All products"}
        action={null}
        on={interactive}
      />
      {d.showFilters && (
        <div
          className={cn(
            "no-scrollbar mb-4 flex snap-x gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch]",
            mobile && "-mx-4 scroll-px-4 px-4",
          )}
        >
          {[{ id: "all", name: "All" }, ...categories].map((c) => {
            const active = c.id === cat;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCat(c.id)}
                className="shrink-0 snap-start rounded-full px-5 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95"
                style={active ? INK : { background: "var(--s-surface)" }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}
      <div key={cat} className="storefront-tab">
        <ProductGrid products={list} ctx={ctx} />
      </div>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <PButton variant="outline" interactive={interactive} href={moreHref}>
            Load more products
          </PButton>
        </div>
      )}
    </Block>
  );
}
/* ------------------------------------------------------------------ */
/* Full products page (opened by "Load more products")                 */
/* Category chips on top, then every product. Same shell and theme.    */
/* ------------------------------------------------------------------ */

export function ProductsListing({
  ctx,
  initialCategory,
}: {
  ctx: Ctx;
  initialCategory?: string;
}) {
  const {
    d,
    products,
    categories,
    interactive,
    mobile,
    searchQuery = "",
  } = ctx;
  const base = `/store/${d.storeSlug}`;

  const [cat, setCat] = useState<string>(
    initialCategory && categories.some((c) => c.id === initialCategory)
      ? initialCategory
      : "all",
  );

  // Switch category instantly and keep the URL shareable, no page reload.
  const select = (id: string) => {
    setCat(id);
    if (!interactive) return;
    const url =
      id === "all"
        ? `${base}/products`
        : `${base}/products?category=${encodeURIComponent(id)}`;
    window.history.replaceState(null, "", url);
  };

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1);
    }
    return m;
  }, [products]);

  const term = searchQuery.trim();
  const list = useMemo(() => {
    const pool =
      cat === "all" ? products : products.filter((p) => p.categoryId === cat);
    if (term) return searchStoreProducts(pool, categories, term, pool.length);
    return resolveAllProducts(d, pool, Math.max(pool.length, 1));
  }, [cat, products, categories, term, d]);

  const activeName =
    cat === "all"
      ? "All products"
      : (categories.find((c) => c.id === cat)?.name ?? "Products");

  const chips = [
    { id: "all", name: "All", count: products.length },
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      count: counts.get(c.id) ?? 0,
    })),
  ];

  return (
    <Block ctx={ctx}>
      {/* Back link */}
      <Link
        on={interactive}
        href={base}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity active:opacity-60"
        style={muted}
      >
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        Back to store
      </Link>

      {/* Category chips: at the very top */}
      <div
        className={cn(
          "no-scrollbar mb-5 flex snap-x gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch]",
          mobile && "-mx-4 scroll-px-4 px-4",
        )}
      >
        {chips.map((c) => {
          const active = c.id === cat;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => select(c.id)}
              className="shrink-0 snap-start whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95"
              style={active ? INK : { background: "var(--s-surface)" }}
            >
              {c.name}
              <span className="ml-1.5 opacity-60">{c.count}</span>
            </button>
          );
        })}
      </div>

      <Heading
        title={term ? `Results for “${term}”` : activeName}
        action={null}
        on={interactive}
      />
      <p className="-mt-2 mb-4 text-xs" style={muted}>
        {list.length} {list.length === 1 ? "product" : "products"}
      </p>

      {/* All products */}
      <div key={`${cat}-${term}`} className="storefront-tab">
        <ProductGrid products={list} ctx={ctx} />
      </div>
    </Block>
  );
}
