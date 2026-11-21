import { Suspense } from "react";
import Link from "next/link";
import { HomeShell } from "@/components/features/home/Homeshell";
import { HomeTheme } from "@/components/features/home/HomeTheme";
import {
  BigDealsSection,
  CategoriesSection,
  FeaturedSellersSection,
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

export default function HomePage() {
  return (
    <HomeTheme>
      <div className="mx-auto w-full max-w-[var(--market-width)] px-[var(--gutter)] pb-[clamp(36px,5vw,72px)] pt-[clamp(16px,2vw,28px)]">
        <Suspense fallback={<div className="min-h-72" />}>
          <HomeShell>
            <div className="market-sections grid gap-[clamp(32px,4vw,60px)] [&>*]:min-w-0">
              <HeroCarousel slides={heroSlides} />
              <CategoriesSection contained={false} />
              <div id="home-deals" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)]">
                <BigDealsSection />
              </div>
              <TopSellingSection />
              <FeaturedSellersSection filterable />
              <RecommendedSection />
              <aside className="flex items-center justify-between gap-4 rounded-[14px] bg-primary px-[clamp(18px,4vw,48px)] py-[22px] text-primary-foreground">
                <h2 className="text-[clamp(1.25rem,2vw,1.8rem)] font-bold tracking-[-.035em] text-white">Sell on ShopBD</h2>
                <Link href="/seller/setup" className="rounded-full bg-white px-[18px] py-2.5 text-sm font-semibold text-primary">Start selling</Link>
              </aside>
            </div>
          </HomeShell>
        </Suspense>
      </div>
    </HomeTheme>
  );
}
