"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TopSellingCard } from "@/components/features/TopSellingCard";
import {
  ProductGridSkeleton,
  SectionEmpty,
  SectionError,
  chipClass,
  productGridClass,
} from "@/components/features/home/SectionState";
import { AllCategories } from "@/components/features/home/AllCategories";
import { mainIcon } from "@/components/features/home/Homesidebar";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/api/marketplace";
import { useMainTypes, useMarketplaceProducts } from "@/lib/query/marketplace";
import {
  homeHref,
  isCategoryId,
  mainIdOf,
  pageWindow,
} from "@/lib/query/category-nav";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10; // two full rows of 5
const SORTS = PRODUCT_SORTS.map((s) => s.value);

// Swapping views is a quick fade, nothing more. (Move this to globals.css when convenient.)
const SWAP_CSS = `
@keyframes home-swap-in { from { opacity: 0; } to { opacity: 1; } }
.home-swap { animation: home-swap-in 220ms ease-out backwards; }
@media (prefers-reduced-motion: reduce) { .home-swap { animation: none; } }
`;

const pagerBase = cn(chipClass(false), "gap-1 px-4");

const humanize = (slug: string) =>
  (slug.split(".").pop() ?? slug).replace(/^c-/, "").replace(/-/g, " ");

/**
 * Main Type -> Category view.
 *
 *   /?category=fashion                 every product in Fashion
 *   /?category=fashion.hoodie          only Hoodie products
 *   /?category=fashion.hoodie&page=2   page 2 of Hoodie
 *
 * Category tabs, sort and page all come from the URL, so they can never get
 * out of sync with each other. Every link below resets `page` when the
 * filter changes and keeps `category` when the page changes.
 */
function CategoryView({ category }: { category: string }) {
  const params = useSearchParams();
  const rawSort = params.get("sort") as ProductSort | null;
  const sort: ProductSort =
    rawSort && SORTS.includes(rawSort) ? rawSort : "relevance";
  const page = Math.max(1, Math.floor(Number(params.get("page"))) || 1);

  const { mains, isPending: mainsPending, categoriesPending } = useMainTypes();
  const mainId = mainIdOf(category);
  const main = mains.find((m) => m.id === mainId);
  const sub = isCategoryId(category)
    ? main?.categories.find((c) => c.slug === category)
    : undefined;

  const Icon = mainIcon(mainId);
  const mainTitle = main?.name ?? (mainsPending ? "" : humanize(mainId));
  const title = isCategoryId(category)
    ? (sub?.name ?? humanize(category))
    : mainTitle;

  // The backend filters by this exact ID, so other categories can never leak in.
  const q = useMarketplaceProducts({
    sort,
    category,
    page,
    limit: PAGE_SIZE,
  });

  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // After paging, bring the top of the list back into view.
  const top = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [page]);

  // Keep the active tab centred in the tab strip.
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = strip.current;
    const tab = box?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!box || !tab) return;
    box.scrollTo({
      left: tab.offsetLeft - (box.clientWidth - tab.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [category, main]);

  const categoryCount = main?.categories.length;
  const href = (next: {
    category?: string;
    sort?: ProductSort;
    page?: number;
  }) => homeHref({ category, sort, page: 1, ...next });

  return (
    <section
      ref={top}
      className="market-category market-anchor space-y-6"
      aria-labelledby="cat-title"
    >
      <header className="market-category-heading flex flex-wrap items-end justify-between gap-5 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17645F] dark:bg-[#D93A2B] text-[#FF6845] dark:text-white">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            {isCategoryId(category) && mainTitle && (
              <p className="text-xs text-muted-foreground">
                <Link
                  href={homeHref({ category: mainId })}
                  className="hover:text-primary hover:underline"
                >
                  {mainTitle}
                </Link>
              </p>
            )}
            <h1
              id="cat-title"
              className="text-2xl font-bold capitalize tracking-tight"
            >
              {title || "\u00a0"}
            </h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {categoryCount !== undefined && (
                <>
                  {categoryCount}{" "}
                  {categoryCount === 1 ? "category" : "categories"}
                  {q.data && " · "}
                </>
              )}
              {q.data && (
                <>
                  {total} {total === 1 ? "product" : "products"}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto py-1">
          {PRODUCT_SORTS.map((s) => (
            <Link
              key={s.value}
              href={href({ sort: s.value, page: 1 })}
              scroll={false}
              aria-current={sort === s.value ? "true" : undefined}
              className={chipClass(sort === s.value)}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Category tabs for the selected Main Type */}
      {mainsPending || (categoriesPending && !main?.categories.length) ? (
        <div className="h-9 w-2/3 animate-pulse rounded-full bg-[#EDE6DC]" />
      ) : main && main.categories.length > 0 ? (
        <nav aria-label={`${main.name} categories`}>
          <div
            ref={strip}
            className="no-scrollbar flex gap-2 overflow-x-auto py-1"
          >
            <Link
              href={homeHref({ category: main.id, sort })}
              scroll={false}
              aria-current={category === main.id ? "page" : undefined}
              className={chipClass(category === main.id)}
            >
              All {main.name}
            </Link>
            {main.categories.map((c) => (
              <Link
                key={c.slug}
                href={homeHref({ category: c.slug, sort })}
                scroll={false}
                aria-current={category === c.slug ? "page" : undefined}
                className={chipClass(category === c.slug)}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      {q.isPending ? (
        <ProductGridSkeleton count={PAGE_SIZE} />
      ) : q.isError ? (
        <SectionError
          message={`We couldn’t load ${title.toLowerCase() || "products"}. ${
            q.error instanceof Error ? q.error.message : ""
          }`}
          onRetry={() => q.refetch()}
        />
      ) : q.data.items.length === 0 ? (
        <SectionEmpty>
          {page > 1 ? (
            <>
              There are no more products in {title}.{" "}
              <Link href={href({ page: 1 })} className="underline">
                Back to page 1
              </Link>
            </>
          ) : (
            <>No products in {title} yet.</>
          )}
        </SectionEmpty>
      ) : (
        <>
          <div
            className={cn(
              productGridClass,
              "transition-opacity",
              q.isPlaceholderData && "opacity-60",
            )}
            aria-busy={q.isPlaceholderData}
          >
            {q.data.items.map((p) => (
              <TopSellingCard key={p.id} product={p} coverImage />
            ))}
          </div>

          {pages > 1 && (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
            >
              {page > 1 ? (
                <Link
                  href={href({ page: page - 1 })}
                  scroll={false}
                  rel="prev"
                  className={pagerBase}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Link>
              ) : (
                <span aria-disabled className={cn(pagerBase, "opacity-40")}>
                  <ChevronLeft className="h-4 w-4" /> Prev
                </span>
              )}

              {pageWindow(page, pages).map((n, i) =>
                n === "gap" ? (
                  <span
                    key={`gap-${i}`}
                    aria-hidden
                    className="px-1 text-sm text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Link
                    key={n}
                    href={href({ page: n })}
                    scroll={false}
                    aria-label={`Page ${n}`}
                    aria-current={n === page ? "page" : undefined}
                    className={cn(chipClass(n === page), "px-3")}
                  >
                    {n}
                  </Link>
                ),
              )}

              {page < pages ? (
                <Link
                  href={href({ page: page + 1 })}
                  scroll={false}
                  rel="next"
                  className={pagerBase}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span aria-disabled className={cn(pagerBase, "opacity-40")}>
                  Next <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Right-hand column of the home page. Shows the normal home sections by
 * default, and swaps in the clicked category (or all categories) while the
 * sidebar stays exactly where it is.
 */
export function HomeShell({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const category = params.get("category");
  const view = params.get("view");

  // Keyed by the whole category ID, so choosing another Main Type or Category
  // starts a fresh view: the previous category's products are never shown
  // (not even for a moment) while the next one loads.
  const key = category
    ? `cat-${category}`
    : view === "categories"
      ? "all"
      : "home";

  return (
    <div className="min-w-0">
      <style>{SWAP_CSS}</style>
      <div key={key} className="home-swap min-w-0">
        {category ? (
          <CategoryView category={category} />
        ) : view === "categories" ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Explore ShopBD
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                Shop by category
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Find your favourites, or discover something new. Browse every
                collection below.
              </p>
            </div>
            <AllCategories />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
