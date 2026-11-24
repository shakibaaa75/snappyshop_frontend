import { MarketplaceReviews } from "@/components/reviews/Reviews";
import { Suspense } from "react";
import Link from "next/link";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import {
  BIG_DEALS_QUERY,
  FEATURED_SELLERS_LIMIT,
  RECOMMENDED_QUERY,
  TOP_SELLING_QUERY,
} from "@/lib/home-queries";
import {
  fetchMarketplaceCategoriesServer,
  fetchMarketplaceProductsServer,
  fetchMarketplaceSellersServer,
} from "@/lib/api/marketplace.server";
import { HomeShell } from "@/components/features/home/Homeshell";
import { HomeTheme } from "@/components/features/home/HomeTheme";
import {
  BigDealsSection,
  CategoriesSection,
  FeaturedSellersSection,
  RecentlyViewedSection,
  RecommendedSection,
  TopSellingSection,
} from "@/components/features/home/HomeSections";

import {
  HeroCarousel,
  type HeroSlide,
} from "@/components/features/home/HeroCarousel";

const R2_PUBLIC = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(
  /\/$/,
  "",
);

const heroVideo = (fileName: string) =>
  R2_PUBLIC ? `${R2_PUBLIC}/banner_video/${fileName}` : undefined;

const heroSlides: HeroSlide[] = [
  {
    image: "/herogg.jpg",
    video: heroVideo("hero_two.mp4"),
    title: ["Discover Unique Finds", "from Local Sellers"],
    text: "Explore fashion, home, beauty and more.",
    primary: { label: "View all products", href: "/products" },
    secondary: { label: "Explore Sellers", href: "/sellers" },
  },
  {
    image: "/hero/hero-deals.jpg",
    video: heroVideo("hero_one.mp4"),
    title: ["Big Savings,", "Every Single Day"],
    text: "Hand-picked discounts from verified sellers.",
    primary: { label: "See Deals", href: "#home-deals" },
    secondary: { label: "Top Selling", href: "/products?sort=top_selling" },
  },
  {
    image: "/hero/hero-new.jpg",
    video: heroVideo("hero_three.mp4"),
    title: ["Fresh Styles,", "Just Arrived"],
    text: "Be the first to shop the newest products from local sellers.",
    primary: { label: "Shop New Arrivals", href: "/products?sort=newest" },
  },
  {
    image: "/hero/hero-seller.jpg",
    video: heroVideo("hero_four.mp4"),
    title: ["Start Your Own", "Online Store"],
    text: "Open your free store and reach buyers across Bangladesh.",
    primary: { label: "Start Selling", href: "/seller/setup" },
    secondary: { label: "How it works", href: "/sellers" },
  },
];

/**
 * The page is rebuilt at most once a minute and then served from cache to
 * every visitor, so the home page costs the API a handful of calls per minute
 * no matter how many people open it.
 */
// Must be a plain number written here: Next reads it at build time and rejects
// values that come from an import. Keep it equal to
// MARKETPLACE_REVALIDATE_SECONDS in lib/api/marketplace.server.ts.
export const revalidate = 60;

/**
 * Loads the public, same-for-everyone sections on the server and hands them to
 * React Query. The sections' own hooks then find the data already in their
 * cache and show it at once, with no second request from the browser.
 *
 * Personal sections (Recently viewed) are not here on purpose. A failed call
 * is skipped silently: that section just loads in the browser as before.
 */
async function prefetchHome() {
  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: qk.marketplace.categories,
      queryFn: fetchMarketplaceCategoriesServer,
    }),
    queryClient.prefetchQuery({
      queryKey: qk.marketplace.products({ ...BIG_DEALS_QUERY }),
      queryFn: () => fetchMarketplaceProductsServer(BIG_DEALS_QUERY),
    }),
    queryClient.prefetchQuery({
      queryKey: qk.marketplace.products({ ...TOP_SELLING_QUERY }),
      queryFn: () => fetchMarketplaceProductsServer(TOP_SELLING_QUERY),
    }),
    queryClient.prefetchQuery({
      queryKey: qk.marketplace.sellers({
        sort: "popular",
        limit: FEATURED_SELLERS_LIMIT,
        page: 1,
      }),
      queryFn: () =>
        fetchMarketplaceSellersServer({
          sort: "popular",
          limit: FEATURED_SELLERS_LIMIT,
          page: 1,
        }),
    }),
    // Page 1 only; "Load more" fetches the rest in the browser.
    queryClient.prefetchInfiniteQuery({
      queryKey: qk.marketplace.products({
        ...RECOMMENDED_QUERY,
        infinite: true,
      }),
      queryFn: ({ pageParam }) =>
        fetchMarketplaceProductsServer({
          ...RECOMMENDED_QUERY,
          page: pageParam,
        }),
      initialPageParam: 1,
    }),
  ]);
  return dehydrate(queryClient);
}

export default async function HomePage() {
  const dehydrated = await prefetchHome();

  const sections = (
    <div className="market-sections grid gap-[clamp(32px,4vw,60px)] [&>*]:min-w-0">
      <HeroCarousel slides={heroSlides} />
      <CategoriesSection contained={false} />
      <RecentlyViewedSection />
      <div
        id="home-deals"
        className="scroll-mt-[calc(var(--market-header-height,120px)+24px)]"
      >
        <BigDealsSection />
      </div>
      <TopSellingSection />
      <FeaturedSellersSection filterable />
      <RecommendedSection />
      <MarketplaceReviews />
      <aside className="flex items-center justify-between gap-4 rounded-[14px] bg-primary px-[clamp(18px,4vw,48px)] py-[22px] text-primary-foreground">
        <h2 className="text-[clamp(1.25rem,2vw,1.8rem)] font-bold tracking-[-.035em] text-white">
          Sell on ShopBD
        </h2>
        <Link
          href="/seller/setup"
          className="rounded-full bg-white px-[18px] py-2.5 text-sm font-semibold text-primary"
        >
          Start selling
        </Link>
      </aside>
    </div>
  );

  return (
    <HomeTheme>
      <div className="mx-auto w-full max-w-[var(--market-width)] px-[var(--gutter)] pb-[clamp(36px,5vw,72px)] pt-[clamp(16px,2vw,28px)]">
        <HydrationBoundary state={dehydrated}>
          {/*
            HomeShell reads the URL (?category=, ?view=), so Next cannot render
            it on the server. The fallback below is the normal home page, so
            the server HTML (and search engines) get the real content instead
            of an empty box. In the browser HomeShell takes over; with no
            ?category= it shows the very same sections.
          */}
          <Suspense fallback={sections}>
            <HomeShell>{sections}</HomeShell>
          </Suspense>
        </HydrationBoundary>
      </div>
    </HomeTheme>
  );
}
