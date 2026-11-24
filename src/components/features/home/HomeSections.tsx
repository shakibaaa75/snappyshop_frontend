"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
} from "lucide-react";
import { TopSellingCard } from "@/components/features/TopSellingCard";
import { DealCard } from "@/components/features/DealCard";
import { SellerCard } from "@/components/features/SellerCard";
import { RecentlyViewedCard } from "@/components/features/RecentlyViewedCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ProductCardSkeleton,
  SectionEmpty,
  SectionError,
} from "@/components/features/home/SectionState";
import { SectionHeader } from "@/components/features/home/SectionHeader";
import { homeHref } from "@/lib/query/category-nav";
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
import {
  BIG_DEALS_QUERY,
  FEATURED_SELLERS_LIMIT,
  HOME_ROW_LIMIT,
  MAX_DEAL_DISCOUNT,
  RECOMMENDED_PAGE,
  TOP_SELLING_QUERY,
} from "@/lib/home-queries";
import { productDiscount } from "@/lib/format";
import { useViewedProducts } from "@/lib/viewed-products";
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

/** Simple black and white pill for the section filters and sorts. */
function blackWhiteChip(active: boolean) {
  return cn(
    "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-xs font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#F5A524] focus-visible:ring-offset-2",
    active
      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
      : "border-border bg-white text-black hover:border-black dark:bg-card dark:text-white dark:hover:border-white",
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
  bleed = PILLS_BLEED_PANEL,
}: {
  value: CategoryPick | null;
  onChange: (c: CategoryPick | null) => void;
  /** Negative margin + matching padding. Must equal the parent's padding. */
  bleed?: string;
}) {
  const q = useMarketplaceCategories();
  const base =
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200";
  const on =
    "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black";
  const off =
    "border-border bg-white text-black hover:border-black dark:bg-card dark:text-white dark:hover:border-white";

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
  limit = HOME_ROW_LIMIT,
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
              coverImage
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
  // Same query the server prefetches (lib/home-queries.ts).
  const q = useMarketplaceProducts({
    ...BIG_DEALS_QUERY,
    category: picked?.slug,
  });

  const items = useMemo(
    () =>
      q.data ? byBiggestDiscount(q.data.items.filter(isDeal)).slice(0, 12) : [],
    [q.data],
  );
  const viewAll = picked
    ? `/products?deals=1&category=${encodeURIComponent(picked.slug)}`
    : "/products?deals=1";

  return (
    // No extra side padding here: the page already provides it.
    <section aria-labelledby="sec-big-deals" className="min-w-0">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-none sm:p-6">
        {/* Title left, View All right. Subtitle can wrap on phones. */}
        <div className="mb-3 flex items-start justify-between gap-3 sm:mb-5 sm:items-center">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
            <div className="min-w-0">
              <h2
                id="sec-big-deals"
                className="text-lg font-extrabold leading-tight tracking-tight text-[#C93B17] sm:text-2xl lg:text-3xl"
              >
                Today’s deals
              </h2>
            </div>
          </div>

          <Link
            href={viewAll}
            className="group inline-flex shrink-0 items-center gap-1 rounded-sm text-xs font-semibold text-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-[#F5A524] focus-visible:ring-offset-2"
          >
            View All{" "}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </Link>
        </div>

        <CategoryFilter value={picked} onChange={setPicked} />

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
              <DealCard key={p.id} product={p} coverImage />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---- other exported sections --------------------------------------------- */

/** Recommended shows 30 per page. 30 divides evenly by 2, 3 and 5 columns. */
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
            className={blackWhiteChip(sort === o.value)}
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
              <TopSellingCard key={p.id} product={p} coverImage />
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
      sort={TOP_SELLING_QUERY.sort}
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
  limit = FEATURED_SELLERS_LIMIT,
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
    <section aria-label="Featured sellers" className="min-w-0">
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

/** Phones show this many category circles. "View All Categories" has the rest. */
const CATEGORIES_ON_PHONE = 6;

type CategoryItem = NonNullable<
  ReturnType<typeof useMarketplaceCategories>["data"]
>[number];

/** One round category picture with its name underneath. */
function CategoryCircle({
  category: c,
  className,
}: {
  category: CategoryItem;
  className?: string;
}) {
  const image = (c as { image?: string }).image;
  return (
    <Link
      href={homeHref({ category: c.slug })}
      className={`group flex flex-col items-center gap-2 rounded-xl p-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#FF6845] focus-visible:ring-offset-2 ${className ?? ""}`}
    >
      {/* Round picture (64px on phones, 80px from sm up) */}
      <span className="relative block size-16 overflow-hidden rounded-full border border-border bg-[#17645F]/10 dark:bg-[#D93A2B]/15 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none sm:size-20">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-[#17645F] dark:text-[#D93A2B]">
            <Tag className="h-1/2 w-1/2" strokeWidth={1.5} />
          </span>
        )}
      </span>
      <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground group-hover:text-[#17645F] dark:group-hover:text-[#FF6845]">
        {c.name}
      </span>
    </Link>
  );
}

export function CategoriesSection({
  all = false,
  contained = true,
}: {
  all?: boolean;
  /** false = no max-width/padding wrapper (HomeShell already provides one). */
  contained?: boolean;
}) {
  const q = useMarketplaceCategories();
  const list = q.data ?? [];
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
        <div
          className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-5 lg:grid-cols-9"
          aria-busy="true"
          aria-label="Loading categories"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="size-16 rounded-full sm:size-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      ) : q.isError ? (
        <SectionError
          message={`We couldn’t load categories. ${errMsg(q.error)}`}
          onRetry={() => q.refetch()}
        />
      ) : list.length === 0 ? (
        <SectionEmpty>No categories yet.</SectionEmpty>
      ) : all ? (
        // Full "all categories" view: every category in a grid.
        <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-5 lg:grid-cols-9">
          {list.map((c) => (
            <li key={c.id}>
              <CategoryCircle category={c} />
            </li>
          ))}
        </ul>
      ) : (
        <>
          {/* Phones: first 6 only (3 per row). The rest: "View All Categories". */}
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:hidden">
            {list.slice(0, CATEGORIES_ON_PHONE).map((c) => (
              <li key={c.id}>
                <CategoryCircle category={c} />
              </li>
            ))}
          </ul>

          {/* Tablet / PC: every category in a slider (arrows + swipe). */}
          <div className="hidden sm:block">
            <ScrollRow bleed="">
              {list.map((c) => (
                <CategoryCircle
                  key={c.id}
                  category={c}
                  className="w-24 shrink-0 snap-start"
                />
              ))}
            </ScrollRow>
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Recently viewed (this browser only, see lib/viewed-products.ts)     */
/* ------------------------------------------------------------------ */

/** Wide screens show one row of 5. Phones show the first 3. "See all" has the rest. */
const RECENT_ON_DESKTOP = 5;
const RECENT_FROM_PHONE = 3; // phones = below the md breakpoint

export function RecentlyViewedSection() {
  const viewed = useViewedProducts();

  // First visit, or history cleared: no section at all (no empty box, no gap).
  if (viewed.length === 0) return null;

  return (
    <Panel labelledBy="sec-recently-viewed">
      <SectionHeader
        id="sec-recently-viewed"
        title="Recently viewed"
        href="/recently-viewed"
        linkLabel="See all"
      />
      {/* 3 columns on phones, 5 from md up. Items 4 and 5 are hidden below md. */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-5">
        {viewed.slice(0, RECENT_ON_DESKTOP).map((p, i) => (
          <div
            key={`${p.slug}/${p.id}`}
            className={
              i >= RECENT_FROM_PHONE ? "hidden min-w-0 md:block" : "min-w-0"
            }
          >
            <RecentlyViewedCard product={p} coverImage />
          </div>
        ))}
      </div>
    </Panel>
  );
}
