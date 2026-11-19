"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
} from "lucide-react";
import { TopSellingCard } from "@/components/features/TopSellingCard";
import { DealCard } from "@/components/features/DealCard";
import { SellerCard } from "@/components/features/SellerCard";
import { CategoryCard } from "@/components/features/Categorycard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CategorySkeleton,
  ProductCardSkeleton,
  SectionEmpty,
  SectionError,
  chipClass,
} from "@/components/features/home/SectionState";
import { SectionHeader } from "@/components/features/home/SectionHeader";
import {
  BEST_RATED_MIN_REVIEWS,
  type ProductSort,
} from "@/lib/api/marketplace";
import {
  useMarketplaceCategories,
  useMarketplaceProducts,
  useMarketplaceProductsInfinite,
  useMarketplaceSellers,
} from "@/lib/query/marketplace";
import { productDiscount } from "@/lib/format";
import type { Product } from "@/types";

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong.";

/* ------------------------------------------------------------------ */
/* Panel + grid (every home section uses the same look)                */
/* ------------------------------------------------------------------ */

/** Default: the parent is the page, which has px-4 (px-3 on sm+ rows). */
const ROW_BLEED_PAGE = "-mx-4 px-4 scroll-px-4 sm:-mx-3 sm:px-3 sm:scroll-px-3";
const PILLS_BLEED_PAGE = "-mx-4 px-4 sm:mx-0 sm:px-0";

/* ------------------------------------------------------------------ */
/* Sideways scroll row (arrows on desktop, swipe on touch)             */
/* ------------------------------------------------------------------ */

function ScrollRow({
  children,
  dim,
  bleed = ROW_BLEED_PAGE,
}: {
  children: React.ReactNode;
  /** Fades the row while the next category's products load. */
  dim?: boolean;
  /** Negative margin + matching padding. Must equal the parent's padding. */
  bleed?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [children]);

  const scrollBy = (dir: 1 | -1) =>
    ref.current?.scrollBy({
      left: dir * ref.current.clientWidth * 0.8,
      behavior: "smooth",
    });

  const arrow =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-primary shadow-md transition hover:bg-muted active:scale-90 sm:grid";

  return (
    <div
      className={`relative transition-opacity duration-200 ${dim ? "opacity-60" : ""}`}
    >
      <div
        ref={ref}
        className={`no-scrollbar -my-3 flex snap-x snap-proximity gap-4 overflow-x-auto scroll-smooth py-3 ${bleed}`}
      >
        {children}
      </div>
      {canLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className={`${arrow} -left-3`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className={`${arrow} -right-3`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

/** Category pills bleed to the panel edge on phones. Equals the panel's p-3. */
const PILLS_BLEED_PANEL = "-mx-3 px-3 sm:mx-0 sm:px-0";

/** Products: 2 columns on phones, 3 on tablets, 4 on desktop (12 fits all). */
const PRODUCT_GRID =
  "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4";

/** Bordered card that holds one section (title, filter pills, products). */
function Panel({
  labelledBy,
  children,
}: {
  labelledBy: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={labelledBy} className="min-w-0">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-none sm:p-6">
        {children}
      </div>
    </section>
  );
}

function ProductGridSkeleton({
  count,
  className = PRODUCT_GRID,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Category pills (shared by every section)                            */
/* ------------------------------------------------------------------ */

interface CategoryPick {
  slug: string;
  name: string;
}

/** Sideways row of category pills ("All" + every category from the API). */
function CategoryFilter({
  value,
  onChange,
  showIcons = false,
  bleed = PILLS_BLEED_PANEL,
}: {
  value: CategoryPick | null;
  onChange: (c: CategoryPick | null) => void;
  /** Shows a small tag icon on pills whose category has no emoji. */
  showIcons?: boolean;
  /** Negative margin + matching padding. Must equal the parent's padding. */
  bleed?: string;
}) {
  const q = useMarketplaceCategories();
  const base =
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200";
  const on =
    "border-[#17645F] dark:border-[#D93A2B] bg-[#17645F] dark:bg-[#D93A2B] text-white";
  const off =
    "border-border bg-muted text-primary/80 hover:bg-muted/80 hover:text-primary";

  return (
    <div
      role="group"
      aria-label="Filter by category"
      className={`no-scrollbar mb-4 flex gap-2 overflow-x-auto py-1 ${bleed}`}
    >
      <button
        type="button"
        aria-pressed={!value}
        onClick={() => onChange(null)}
        className={`${base} ${!value ? on : off}`}
      >
        All
      </button>
      {q.data?.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={value?.slug === c.slug}
          onClick={() => onChange({ slug: c.slug, name: c.name })}
          className={`${base} ${value?.slug === c.slug ? on : off}`}
        >
          {c.icon ? (
            <span aria-hidden>{c.icon}</span>
          ) : showIcons ? (
            <Tag className="h-3.5 w-3.5" aria-hidden />
          ) : null}
          {c.name}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product sections                                                    */
/* ------------------------------------------------------------------ */

interface ProductsSectionProps {
  /** Unique per section (two sections can share the same sort). */
  id: string;
  title: string;
  sort: ProductSort;
  /** "View all" link. May already contain a query string. */
  href: string;
  /** How many products to load into the scroll row. */
  limit?: number;
  /** Show #1, #2 ... badges (only used for top selling). */
  ranked?: boolean;
  /** Drops items the real data does not justify (e.g. 0 sales, 0 reviews). */
  keep?: (p: Product) => boolean;
  /** Reorders the kept items. Pass a module-level function (stable reference). */
  arrange?: (items: Product[]) => Product[];
  minReviews?: number;
  /** Asks the API for discounted products only (also re-checked in the browser). */
  minDiscount?: number;
  maxDiscount?: number;
  emptyText: string;
  /** Adds the category pills above the row. */
  filterable?: boolean;
}

function ProductsSection({
  id,
  title,
  sort,
  href,
  limit = 12,
  ranked,
  keep,
  arrange,
  minReviews,
  minDiscount,
  maxDiscount,
  emptyText,
  filterable,
}: ProductsSectionProps) {
  const headingId = `sec-${id}`;
  const [picked, setPicked] = useState<CategoryPick | null>(null);
  const q = useMarketplaceProducts({
    sort,
    limit,
    minReviews,
    minDiscount,
    maxDiscount,
    category: picked?.slug,
  });

  const items = useMemo(() => {
    if (!q.data) return [];
    const kept = keep ? q.data.items.filter(keep) : q.data.items;
    const arranged = arrange ? arrange(kept) : kept;
    // Show at most `limit` even when we fetched more to filter.
    return arranged.slice(0, limit);
  }, [q.data, keep, arrange, limit]);

  const viewAll = picked
    ? `${href}${href.includes("?") ? "&" : "?"}category=${picked.slug}`
    : href;

  return (
    <Panel labelledBy={headingId}>
      <SectionHeader id={headingId} title={title} href={viewAll} />
      {filterable && <CategoryFilter value={picked} onChange={setPicked} />}
      {q.isPending ? (
        <ProductGridSkeleton count={limit} />
      ) : q.isError ? (
        <SectionError
          message={`We couldn’t load ${title.toLowerCase()}. ${errMsg(q.error)}`}
          onRetry={() => q.refetch()}
        />
      ) : items.length === 0 ? (
        <SectionEmpty>
          {picked ? `No products in ${picked.name} yet.` : emptyText}
        </SectionEmpty>
      ) : (
        <div
          key={picked?.slug ?? "all"}
          className={`${PRODUCT_GRID} transition-opacity duration-200 ${
            q.isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          {items.map((p, i) => (
            <TopSellingCard
              key={p.id}
              product={p}
              rank={ranked ? i + 1 : undefined}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ---- keep / arrange helpers (module level = stable references) ---------- */

const hasSales = (p: Product) => (p.sold ?? 0) > 0;

/** "Up to 40% off": change this one number to adjust the range. */
const MAX_DEAL_DISCOUNT = 40;
const isDeal = (p: Product) => {
  const d = productDiscount(p);
  return d > 0 && d <= MAX_DEAL_DISCOUNT;
};
const byBiggestDiscount = (items: Product[]) =>
  [...items].sort((a, b) => productDiscount(b) - productDiscount(a));

/* ------------------------------------------------------------------ */
/* Best Big Deals (real data only)                                     */
/* ------------------------------------------------------------------ */

export function BigDealsSection() {
  const [picked, setPicked] = useState<CategoryPick | null>(null);
  const q = useMarketplaceProducts({
    sort: "newest",
    // Fetch more than we show: the discount filter can drop many items.
    limit: 40,
    minDiscount: 1,
    maxDiscount: MAX_DEAL_DISCOUNT,
    category: picked?.slug,
  });

  const items = useMemo(
    () =>
      q.data ? byBiggestDiscount(q.data.items.filter(isDeal)).slice(0, 12) : [],
    [q.data],
  );
  const viewAll = picked ? `/deals?category=${picked.slug}` : "/deals";

  return (
    // No extra side padding here: the page already provides it.
    <section aria-labelledby="sec-big-deals" className="min-w-0">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-none sm:p-6">
        {/* Title left, View All right. Subtitle can wrap on phones. */}
        <div className="mb-3 flex items-start justify-between gap-3 sm:mb-5 sm:items-center">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FF6845]/15 text-[#C93B17] sm:h-11 sm:w-11 sm:rounded-2xl">
              <BadgePercent
                className="h-5 w-5 sm:h-6 sm:w-6"
                strokeWidth={2.2}
                aria-hidden
              />
            </span>
            <div className="min-w-0">
              <h2
                id="sec-big-deals"
                className="text-lg font-extrabold leading-tight tracking-tight text-[#C93B17] sm:text-2xl lg:text-3xl"
              >
                Best Big Deals
              </h2>
              <p className="line-clamp-2 text-xs text-slate-500 sm:truncate sm:text-sm">
                Top picks. Crazy discounts. Don’t miss out!
              </p>
            </div>
          </div>

          <Link
            href={viewAll}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#17645F] dark:bg-[#D93A2B] px-3.5 py-2 text-xs font-semibold text-white outline-none transition-colors hover:bg-[#17645F]/90 dark:hover:bg-[#D93A2B]/90 focus-visible:ring-2 focus-visible:ring-[#FF6845] focus-visible:ring-offset-2 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
          >
            View All{" "}
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          </Link>
        </div>

        <CategoryFilter showIcons value={picked} onChange={setPicked} />

        {q.isPending ? (
          <ProductGridSkeleton count={8} />
        ) : q.isError ? (
          <SectionError
            message={`We couldn’t load deals. ${errMsg(q.error)}`}
            onRetry={() => q.refetch()}
          />
        ) : items.length === 0 ? (
          <SectionEmpty>
            {picked
              ? `No deals in ${picked.name} right now.`
              : "No deals right now. Check back soon."}
          </SectionEmpty>
        ) : (
          <div
            key={picked?.slug ?? "all"}
            className={`${PRODUCT_GRID} transition-opacity duration-200 ${
              q.isPlaceholderData ? "opacity-60" : ""
            }`}
          >
            {items.map((p) => (
              <DealCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---- other exported sections --------------------------------------------- */

/** Recommended shows 30 per page. 30 divides evenly by 2, 3 and 5 columns. */
const RECOMMENDED_PAGE = 30;
const RECOMMENDED_GRID =
  "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5";

/** New Arrivals and Best Rated live here as filters, not as their own sections. */
const RECOMMENDED_SORTS: { value: ProductSort; label: string }[] = [
  { value: "relevance", label: "Most relevant" },
  { value: "newest", label: "New Arrivals" },
  { value: "best_rated", label: "Best Rated" },
];

export function RecommendedSection() {
  const [picked, setPicked] = useState<CategoryPick | null>(null);
  const [sort, setSort] = useState<ProductSort>("relevance");
  const q = useMarketplaceProductsInfinite({
    sort,
    limit: RECOMMENDED_PAGE,
    category: picked?.slug,
    // Only products with enough real reviews can rank as "best rated".
    minReviews: sort === "best_rated" ? BEST_RATED_MIN_REVIEWS : undefined,
  });

  // Pages are joined into one list. The id check protects against the same
  // product showing twice if the list changes between two "Load more" clicks.
  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const page of q.data?.pages ?? []) {
      for (const p of page.items) {
        if (sort === "best_rated" && (p.reviewCount ?? 0) === 0) continue;
        if (!seen.has(p.id)) {
          seen.add(p.id);
          out.push(p);
        }
      }
    }
    return out;
  }, [q.data, sort]);

  const total = q.data?.pages[0]?.total ?? 0;
  const viewAll = picked
    ? `/products?sort=${sort}&category=${picked.slug}`
    : `/products?sort=${sort}`;

  return (
    <Panel labelledBy="sec-recommended">
      <SectionHeader
        id="sec-recommended"
        title="Recommended for You"
        href={viewAll}
      />

      {/* Sort filter (same chip style as the category pills) */}
      <div
        role="group"
        aria-label="Sort products"
        className={`no-scrollbar mb-3 flex gap-2 overflow-x-auto py-1 ${PILLS_BLEED_PANEL}`}
      >
        {RECOMMENDED_SORTS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={sort === o.value}
            onClick={() => setSort(o.value)}
            className={chipClass(sort === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <CategoryFilter value={picked} onChange={setPicked} />

      {q.isPending ? (
        <ProductGridSkeleton count={10} className={RECOMMENDED_GRID} />
      ) : q.isError ? (
        <SectionError
          message={`We couldn’t load recommendations. ${errMsg(q.error)}`}
          onRetry={() => q.refetch()}
        />
      ) : items.length === 0 ? (
        <SectionEmpty>
          {sort === "best_rated"
            ? "Best rated products will appear here once they have enough customer reviews."
            : picked
              ? `No products in ${picked.name} yet.`
              : "Recommendations will appear here soon."}
        </SectionEmpty>
      ) : (
        <>
          <div
            key={`${sort}-${picked?.slug ?? "all"}`}
            className={`${RECOMMENDED_GRID} transition-opacity duration-200 ${
              q.isPlaceholderData ? "opacity-60" : ""
            }`}
          >
            {items.map((p) => (
              <TopSellingCard key={p.id} product={p} />
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-xs text-slate-500" aria-live="polite">
              Showing {items.length.toLocaleString("en-US")}
              {total > items.length
                ? ` of ${total.toLocaleString("en-US")}`
                : ""}{" "}
              products
            </p>

            {q.isFetchNextPageError && (
              <p role="alert" className="text-xs text-[#C93B17]">
                Couldn’t load more products. Please try again.
              </p>
            )}

            {q.hasNextPage && (
              <button
                type="button"
                onClick={() => void q.fetchNextPage()}
                disabled={q.isFetchingNextPage}
                className="inline-flex min-w-40 items-center justify-center gap-2 rounded-full bg-[#17645F] dark:bg-[#D93A2B] px-6 py-3 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#17645F]/90 dark:hover:bg-[#D93A2B]/90 focus-visible:ring-2 focus-visible:ring-[#FF6845] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              >
                {q.isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading…
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}

export function TopSellingSection() {
  return (
    <ProductsSection
      id="top-selling"
      title="Top Selling Products"
      sort="top_selling"
      href="/products?sort=top_selling"
      ranked
      filterable
      keep={hasSales}
      emptyText="Top sellers will appear here once products have completed orders."
    />
  );
}

/* ------------------------------------------------------------------ */
/* Featured sellers (Instagram-story style)                            */
/* ------------------------------------------------------------------ */

function SellerStoriesSkeleton({ count }: { count: number }) {
  return (
    <div className="flex gap-4 overflow-hidden py-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-[250px] shrink-0 overflow-hidden rounded-3xl border bg-card"
        >
          <div className="h-24 animate-pulse bg-muted" />
          <div className="-mt-10 flex justify-center">
            <div className="h-[84px] w-[84px] animate-pulse rounded-full border-4 border-card bg-muted-foreground/20" />
          </div>
          <div className="flex flex-col items-center gap-2 px-4 pb-5 pt-3">
            <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeaturedSellersSection({
  limit = 6,
  paged = false,
  page = 1,
  filterable = false,
}: {
  limit?: number;
  paged?: boolean;
  page?: number;
  /** Adds the category pills above the sellers. */
  filterable?: boolean;
}) {
  const [picked, setPicked] = useState<CategoryPick | null>(null);
  const q = useMarketplaceSellers({
    sort: "popular",
    limit,
    page,
    category: picked?.slug,
  });

  return (
    <section
      aria-label="Featured sellers"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      {!paged && (
        <SectionHeader
          title="Featured Sellers"
          href="/sellers"
          linkLabel="View All Sellers"
        />
      )}
      {filterable && (
        <CategoryFilter
          value={picked}
          onChange={setPicked}
          bleed={PILLS_BLEED_PAGE}
        />
      )}
      {q.isPending ? (
        <SellerStoriesSkeleton count={Math.min(limit, 8)} />
      ) : q.isError ? (
        <SectionError
          message={`We couldn’t load sellers. ${errMsg(q.error)}`}
          onRetry={() => q.refetch()}
        />
      ) : q.data.items.length === 0 ? (
        <SectionEmpty>
          {picked
            ? `No sellers in ${picked.name} yet.`
            : "No sellers to show yet."}
        </SectionEmpty>
      ) : paged ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.items.map((s) => (
            <SellerCard key={s.id} store={s} className="w-full" />
          ))}
        </div>
      ) : (
        <ScrollRow key={picked?.slug ?? "all"} dim={q.isPlaceholderData}>
          {q.data.items.map((s) => (
            <SellerCard
              key={s.id}
              store={s}
              className="w-[250px] shrink-0 snap-start"
            />
          ))}
        </ScrollRow>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export function CategoriesSection({
  all = false,
  contained = true,
}: {
  all?: boolean;
  /** false = no max-width/padding wrapper (HomeShell already provides one). */
  contained?: boolean;
}) {
  const q = useMarketplaceCategories();
  const list = q.data ? (all ? q.data : q.data.slice(0, 9)) : [];
  return (
    <section
      className={
        contained ? "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" : undefined
      }
    >
      {!all && (
        <SectionHeader
          title="Shop by Category"
          href="/?view=categories"
          linkLabel="View All Categories"
        />
      )}
      {q.isPending ? (
        <CategorySkeleton />
      ) : q.isError ? (
        <SectionError
          message={`We couldn’t load categories. ${errMsg(q.error)}`}
          onRetry={() => q.refetch()}
        />
      ) : list.length === 0 ? (
        <SectionEmpty>No categories yet.</SectionEmpty>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {list.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      )}
    </section>
  );
}
