"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketplaceCategories } from "@/lib/api/marketplace";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopSellingCard } from "@/components/features/TopSellingCard";
import { Pager } from "@/components/features/home/Pager";
import {
  ProductGridSkeleton,
  SectionEmpty,
  SectionError,
  productGridClass,
} from "@/components/features/home/SectionState";
import {
  BEST_RATED_MIN_REVIEWS,
  PRODUCT_SORTS,
  type ProductSort,
} from "@/lib/api/marketplace";
import {
  useMarketplaceCategories,
  useMarketplaceProducts,
} from "@/lib/query/marketplace";
import { cn } from "@/lib/utils";

const LIMIT = 24;
const SORTS = PRODUCT_SORTS.map((s) => s.value);

export function ProductsClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = (sp.get("q") ?? "").trim();
  const deals = sp.get("deals") === "1";
  const category = sp.get("category") ?? "";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const rawSort = sp.get("sort") as ProductSort | null;
  const sort: ProductSort =
    rawSort && SORTS.includes(rawSort) ? rawSort : q ? "relevance" : "newest";

  const [draft, setDraft] = useState(q);

  const go = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | number | undefined> = {
      q,
      category,
      deals: deals ? "1" : undefined,
      sort: sp.get("sort") ?? undefined,
      page: undefined,
      ...next,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v === undefined || v === "" || (k === "page" && v === 1)) continue;
      params.set(k, String(v));
    }
    const s = params.toString();
    router.push(s ? `/products?${s}` : "/products");
  };

  const products = useMarketplaceProducts({
    sort,
    q: q || undefined,
    category: category || undefined,
    page,
    limit: LIMIT,
    minDiscount: deals ? 1 : undefined,
    maxDiscount: deals ? 40 : undefined,
    minReviews: sort === "best_rated" ? BEST_RATED_MIN_REVIEWS : undefined,
  });
  const categories = useMarketplaceCategories();

  // Platform ids look like "fashion" (Main Type) or "fashion.hoodie" (category).
  const mainSlug = category.split(".")[0];
  const subs = useQuery({
    queryKey: ["marketplace", "subcategories", mainSlug],
    queryFn: ({ signal }) => fetchMarketplaceCategories(signal, mainSlug),
    enabled: !!mainSlug,
    staleTime: 60_000,
  });
  const activeCategory =
    categories.data?.find((c) => c.slug === category) ??
    subs.data?.find((c) => c.slug === category);
  const heading = q
    ? `Results for “${q}”`
    : activeCategory
      ? activeCategory.name
      : deals
        ? "Today’s deals"
        : "All products";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <h1 className="text-2xl font-bold text-primary">{heading}</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <form
          role="search"
          className="flex flex-1 max-w-md rounded-lg border bg-card p-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: draft.trim(), sort: undefined, page: 1 });
          }}
        >
          <Input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Search products from all sellers"
            placeholder="Search products from all sellers..."
            className="border-0 shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon"
            variant="accent"
            className="shrink-0"
          >
            <Search />
            <span className="sr-only">Search</span>
          </Button>
        </form>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Sort by
          <select
            value={sort}
            onChange={(e) => go({ sort: e.target.value, page: 1 })}
            className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
          >
            {PRODUCT_SORTS.filter((s) => s.value !== "relevance" || q).map(
              (s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {categories.data && categories.data.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by category"
        >
          {[{ slug: "", name: "All", icon: "" }, ...categories.data].map(
            (c) => (
              <button
                key={c.slug || "all"}
                type="button"
                aria-pressed={c.slug === mainSlug}
                onClick={() => go({ category: c.slug, page: 1 })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  c.slug === mainSlug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:border-accent/50",
                )}
              >
                {c.name}
              </button>
            ),
          )}
        </div>
      )}

      {mainSlug && subs.data && subs.data.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by subcategory"
        >
          {[{ slug: mainSlug, name: "All" }, ...subs.data].map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={c.slug === category}
              onClick={() => go({ category: c.slug, page: 1 })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                c.slug === category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:border-accent/50",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {products.isPending ? (
        <ProductGridSkeleton count={12} />
      ) : products.isError ? (
        <SectionError
          message={`We couldn’t load products. ${products.error instanceof Error ? products.error.message : ""}`}
          onRetry={() => products.refetch()}
        />
      ) : products.data.items.length === 0 ? (
        <SectionEmpty>
          {q
            ? `No products match “${q}”. Try a different word or remove filters.`
            : "No products found."}
        </SectionEmpty>
      ) : (
        <>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {products.data.total} product{products.data.total === 1 ? "" : "s"}
          </p>
          <div className={productGridClass}>
            {products.data.items.map((p) => (
              <TopSellingCard key={p.id} product={p} rank={0} />
            ))}
          </div>
          <Pager
            page={products.data.page}
            limit={products.data.limit}
            total={products.data.total}
            onPage={(n) => go({ page: n })}
          />
        </>
      )}
    </div>
  );
}
