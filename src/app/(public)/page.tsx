import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  ShieldCheck,
  Star,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HomeSidebar,
  MobileCategoryBar,
} from "@/components/features/home/Homesidebar";
import { HomeShell } from "@/components/features/home/Homeshell";
import { HomeTheme } from "@/components/features/home/HomeTheme";
import {
  HeroCarousel,
  type HeroSlide,
} from "@/components/features/home/HeroCarousel";
import {
  BigDealsSection,
  CategoriesSection,
  FeaturedSellersSection,
  RecommendedSection,
  TopSellingSection,
} from "@/components/features/home/HomeSections";

/* ---------- static data ---------- */

// Public address of the R2 bucket (same value as R2_PUBLIC_URL on the backend).
const R2_PUBLIC = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(
  /\/$/,
  "",
);

/**
 * Hero video served from Cloudflare R2, from the banner_video/ folder.
 * `fileName` includes the extension, e.g. "hero_one.mp4".
 * Returns undefined when NEXT_PUBLIC_R2_PUBLIC_URL is not set, so the slide
 * simply falls back to its image instead of breaking.
 *
 * R2 does not convert videos like Cloudinary did, so upload files that are
 * already web-ready: MP4 (H.264), no audio, about 1280px wide.
 */
const heroVideo = (fileName: string) =>
  R2_PUBLIC ? `${R2_PUBLIC}/banner_video/${fileName}` : undefined;

/**
 * The 4 hero slides. Change the text, links and images here.
 * `image` stays in /public/hero/ (landscape, about 1600x700, subject on the
 * right). It is the placeholder and fallback for the video. Remove the
 * `video` line from any slide that should stay image-only.
 */
const heroSlides: HeroSlide[] = [
  {
    image: "/herogg.jpg",
    video: heroVideo("hero_two.mp4"),
    badge: "Bangladesh's Trusted Marketplace",
    title: ["Discover Unique Finds", "from Local Sellers"],
    text: "Fashion • Home • Beauty • Lifestyle • And More",
    primary: { label: "Shop Now", href: "/products" },
    secondary: { label: "Explore Sellers", href: "/sellers" },
  },
  {
    image: "/hero/hero-deals.jpg",
    video: heroVideo("hero_one.mp4"),
    badge: "Best Big Deals",
    title: ["Big Savings,", "Every Single Day"],
    text: "Hand-picked discounts from verified sellers.",
    primary: { label: "See Deals", href: "#home-deals" },
    secondary: { label: "Top Selling", href: "/products?sort=top_selling" },
  },
  {
    image: "/hero/hero-new.jpg",
    video: heroVideo("hero_three.mp4"),
    badge: "Just Landed",
    title: ["Fresh Styles,", "Just Arrived"],
    text: "Be the first to shop the newest products from local sellers.",
    primary: { label: "Shop New Arrivals", href: "/products?sort=newest" },
  },
  {
    image: "/hero/hero-seller.jpg",
    video: heroVideo("hero_four.mp4"),
    badge: "Sell on ShopBD",
    title: ["Start Your Own", "Online Store"],
    text: "Open your free store and reach buyers across Bangladesh.",
    primary: { label: "Start Selling", href: "/seller/setup" },
    secondary: { label: "How it works", href: "/sellers" },
  },
];

const heroTrust = [
  {
    icon: BadgeCheck,
    title: "Verified Sellers",
    sub: "Real people, real businesses",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    sub: "Safe & trusted transactions",
  },
  {
    icon: Headphones,
    title: "Explore Sellers",
    sub: "Discover local businesses",
  },
];

const whyItems = [
  {
    icon: UserCheck,
    title: "Verified Identity",
    sub: "Real sellers, real businesses",
  },
  {
    icon: ShieldCheck,
    title: "Buyer Protection",
    sub: "Easy refunds & dispute handling",
  },
  { icon: Star, title: "Trusted Reviews", sub: "Shop with confidence" },
  {
    icon: Headphones,
    title: "Explore Sellers",
    sub: "Meet independent businesses",
  },
];

/* ---------- page ---------- */

export default function HomePage() {
  return (
    <HomeTheme>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-4 pb-10 market-home lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-7">
        {/* Phone / tablet: sideways category chips (desktop uses the sidebar) */}
        <Suspense fallback={<div className="mb-5 h-10 lg:hidden" />}>
          <MobileCategoryBar />
        </Suspense>

        {/* useSearchParams inside the sidebar needs a Suspense boundary */}
        <Suspense fallback={<aside className="hidden lg:block" />}>
          <HomeSidebar />
        </Suspense>

        {/* HomeShell also reads the URL, so it needs its own Suspense */}
        <Suspense fallback={<div className="min-w-0" />}>
          <HomeShell>
            <div className="min-w-0 space-y-9">
              {/* HERO: 4 auto-scrolling slides (image or background video) */}
              <HeroCarousel slides={heroSlides} />

              {/* Trust strip */}
              <ul className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
                {heroTrust.map(({ icon: Icon, title, sub }) => (
                  <li key={title} className="flex items-center gap-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-[11px] font-semibold">{title}</p>
                      <p className="text-[10px] text-muted-foreground">{sub}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* CATEGORIES (GET /marketplace/categories) — mobile/tablet, since desktop has the sidebar */}
              <div className="lg:hidden">
                <CategoriesSection />
              </div>

              {/* 1. BEST BIG DEALS (up to 40% off, category filter) */}
              <div id="home-deals" className="market-anchor">
                <BigDealsSection />
              </div>

              {/* 2. FEATURED SELLERS (category filter) */}
              <FeaturedSellersSection filterable />

              {/* 3. TOP SELLING PRODUCTS (category filter) */}
              <TopSellingSection />

              {/* 4. RECOMMENDED FOR YOU (category filter) */}
              <RecommendedSection />

              {/* WHY SHOPBD */}
              <section>
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:px-8 grid xl:grid-cols-[1fr_3fr] gap-6 items-center">
                  <div>
                    <h2 className="text-lg font-bold text-primary">
                      Why ShopBD?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      A safer, smarter way to shop from verified sellers in
                      Bangladesh.
                    </p>
                  </div>

                  <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {whyItems.map(({ icon: Icon, title, sub }) => (
                      <li key={title} className="flex items-start gap-2">
                        <Icon className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <p className="text-xs font-semibold">{title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {sub}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* BECOME A SELLER BANNER: plain white card */}
              <section className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <div className="grid md:grid-cols-[1.2fr_1fr] items-center gap-4 px-6 md:px-10 py-8 min-h-[200px]">
                  <div className="relative z-10 space-y-3">
                    <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-primary">
                      Become a Seller
                      <br />
                      on ShopBD
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground max-w-md">
                      Turn your products into a business. Open your free online
                      store, reach thousands of buyers across Bangladesh, and
                      get paid securely with our seller tools and 24/7 support.
                    </p>
                    <Button
                      asChild
                      className="rounded-full bg-[#FF6845] text-white hover:bg-[#FF6845]/90"
                    >
                      <Link href="/seller/setup">
                        Start Selling <ArrowRight />
                      </Link>
                    </Button>
                  </div>

                  <div className="relative hidden md:block h-[180px]">
                    <Image
                      src="/promo-local.png"
                      alt="Become a seller"
                      fill
                      className="object-contain object-right"
                    />
                  </div>
                </div>
              </section>
            </div>
          </HomeShell>
        </Suspense>
      </div>
    </HomeTheme>
  );
}
