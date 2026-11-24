"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

const categoryTab =
  "inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-1 text-sm text-muted-foreground hover:text-foreground aria-[current=page]:border-current aria-[current=page]:font-semibold aria-[current=page]:text-foreground";

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

  const router = useRouter();
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
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          {isCategoryId(category) && mainTitle && (
            <Link
              href={homeHref({ category: mainId, sort })}
              className="text-xs text-muted-foreground hover:underline"
            >
              {mainTitle}
            </Link>
          )}
          <h1
            id="cat-title"
            className="break-words text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {title || "\u00a0"}
          </h1>
          {q.data && !q.isPlaceholderData && (
            <p
              aria-live="polite"
              className="mt-1 text-sm text-muted-foreground"
            >
              {total} {total === 1 ? "product" : "products"}
            </p>
          )}
        </div>
        <label className="flex max-w-full items-center gap-1 text-sm">
          <span className="text-muted-foreground">Sort</span>
          <select
            value={sort}
            onChange={(e) =>
              router.push(href({ sort: e.target.value as ProductSort }), {
                scroll: false,
              })
            }
            className="h-11 min-w-0 max-w-full cursor-pointer rounded bg-background pl-1 font-medium text-foreground focus-visible:outline-2"
          >
            {PRODUCT_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* Category tabs for the selected Main Type */}
      {mainsPending || (categoriesPending && !main?.categories.length) ? (
        <div className="h-9 w-2/3 animate-pulse rounded-full bg-[#EDE6DC]" />
      ) : main && main.categories.length > 0 ? (
        <nav aria-label={`${main.name} categories`}>
          <div
            ref={strip}
            className="relative flex gap-4 overflow-x-auto border-b sm:gap-6"
          >
            <Link
              href={homeHref({ category: main.id, sort })}
              scroll={false}
              aria-current={category === main.id ? "page" : undefined}
              className={categoryTab}
            >
              All {main.name}
            </Link>
            {main.categories.map((c) => (
              <Link
                key={c.slug}
                href={homeHref({ category: c.slug, sort })}
                scroll={false}
                aria-current={category === c.slug ? "page" : undefined}
                className={categoryTab}
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

  // The first view is already on screen (rendered by the server), so it must
  // not fade in a second time. Only later view changes animate.
  const firstKey = useRef(key).current;

  return (
    <div className="min-w-0">
      <style>{SWAP_CSS}</style>
      <div key={key} className={cn("min-w-0", key !== firstKey && "home-swap")}>
        {category ? (
          <CategoryView category={category} />
        ) : view === "categories" ? (
          <AllCategories />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
