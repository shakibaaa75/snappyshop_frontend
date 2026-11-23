"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, Search, X } from "lucide-react";
import { TopSellingCard } from "@/components/features/TopSellingCard";
import {
  ProductGridSkeleton,
  SectionEmpty,
  SectionError,
  chipClass,
  productGridClass,
} from "@/components/features/home/SectionState";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/api/marketplace";
import {
  useMarketplaceCategories,
  useMarketplaceProducts,
} from "@/lib/query/marketplace";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const pagerBtn = cn(
  chipClass(false),
  "gap-1 px-4 disabled:pointer-events-none disabled:opacity-40",
);

export function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();

  const q = (params.get("q") ?? "").trim();
  const category = (params.get("category") ?? "").trim();
  const sort: ProductSort =
    PRODUCT_SORTS.find((s) => s.value === params.get("sort"))?.value ??
    "relevance";
  const page = Math.max(1, Number(params.get("page")) || 1);

  // Fetch products filtered by search term AND optional category
  const query = useMarketplaceProducts(
    {
      q: q || undefined,
      category: category || undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    },
    { enabled: q.length > 0 || category.length > 0 },
  );

  // Fetch all marketplace categories for the filter chips
  const categoriesQ = useMarketplaceCategories();
  const categories = categoriesQ.data ?? [];

  // Find the active category name for the heading
  const activeCategoryName = category
    ? (categories.find((c) => c.slug === category)?.name ??
      category.split(".").pop()?.replace(/^c-/, "").replace(/-/g, " ") ??
      category)
    : "";

  const go = (next: {
    sort?: ProductSort;
    page?: number;
    category?: string;
  }) => {
    const sp = new URLSearchParams(params.toString());
    if (next.sort) sp.set("sort", next.sort);
    if (next.category !== undefined) {
      if (next.category) sp.set("category", next.category);
      else sp.delete("category");
    }
    sp.set("page", String(next.page ?? 1));
    router.push(`/search?${sp.toString()}`);
  };

  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {!q && !category ? (
        <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-slate-200 px-4 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#36454F] text-[#F5A524]">
            <Search className="h-5 w-5" />
          </span>
          <h1 className="text-xl font-bold text-[#36454F]">Search </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Type a product, store or category in the search box above.
          </p>
        </div>
      ) : (
        <>
          {/* Heading */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#36454F]">
                  {q ? <>Results for &ldquo;{q}&rdquo;</> : <>All products</>}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {activeCategoryName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#17645F] dark:bg-[#D93A2B] px-3 py-1 text-xs font-semibold text-white">
                      <LayoutGrid className="h-3 w-3" />
                      {activeCategoryName}
                      <button
                        type="button"
                        aria-label={`Remove ${activeCategoryName} filter`}
                        onClick={() => go({ category: "", page: 1 })}
                        className="ml-0.5 grid h-4 w-4 place-items-center rounded-full bg-white/20 hover:bg-white/30 transition"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  {query.data && (
                    <p
                      className="text-sm text-muted-foreground"
                      aria-live="polite"
                    >
                      {total} {total === 1 ? "product" : "products"}
                      {activeCategoryName ? ` in ${activeCategoryName}` : ""}
                    </p>
                  )}
                </div>
              </div>

              {/* Sort chips */}
              <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto py-1">
                {PRODUCT_SORTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={sort === s.value}
                    onClick={() => go({ sort: s.value })}
                    className={chipClass(sort === s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter chips */}
            {categories.length > 0 && (
              <nav aria-label="Filter by category">
                <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
                  <button
                    type="button"
                    aria-pressed={!category}
                    onClick={() => go({ category: "", page: 1 })}
                    className={chipClass(!category)}
                  >
                    All categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      aria-pressed={category === c.slug}
                      onClick={() => go({ category: c.slug, page: 1 })}
                      className={chipClass(category === c.slug)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </nav>
            )}
          </header>

          {/* Product grid */}
          {query.isPending ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : query.isError ? (
            <SectionError
              message={`We couldn't search right now. ${
                query.error instanceof Error ? query.error.message : ""
              }`}
              onRetry={() => query.refetch()}
            />
          ) : query.data.items.length === 0 ? (
            <SectionEmpty>
              {category && q ? (
                <>
                  No products match &ldquo;{q}&rdquo; in{" "}
                  <strong className="capitalize">{activeCategoryName}</strong>.{" "}
                  <button
                    type="button"
                    className="underline text-[#17645F] dark:text-[#FF6845]"
                    onClick={() => go({ category: "", page: 1 })}
                  >
                    Search all categories
                  </button>
                </>
              ) : q ? (
                <>
                  Nothing matched &ldquo;{q}&rdquo;. Check the spelling or try a
                  shorter word.
                </>
              ) : (
                <>No products in this category yet.</>
              )}
            </SectionEmpty>
          ) : (
            <>
              <div
                className={cn(
                  productGridClass,
                  query.isPlaceholderData && "opacity-60 transition-opacity",
                )}
              >
                {query.data.items.map((p) => (
                  <TopSellingCard key={p.id} product={p} />
                ))}
              </div>

              {pages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="flex items-center justify-center gap-3 pt-2"
                >
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => go({ page: page - 1 })}
                    className={pagerBtn}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <span
                    className="text-sm text-muted-foreground"
                    aria-live="polite"
                  >
                    Page {page} of {pages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pages}
                    onClick={() => go({ page: page + 1 })}
                    className={pagerBtn}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
