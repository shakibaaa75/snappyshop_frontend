"use client";

import type { CSSProperties } from "react";
import {
  Star,
  ShieldCheck,
  ShoppingCart,
  Phone,
  RotateCcw,
  Sparkles,
  Bookmark,
  Users,
  Package,
  Store,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import {
  defaultStoreDesign,
  type StoreDesignValues,
} from "@/types/store-customization";

type StorePreviewSettings = Partial<StoreDesignValues> & {
  storeSlug?: string;
  logoUrl?: string;
  coverUrl?: string;
  description?: string;
  textColor?: string;
  fontFamily?: string;
  cardStyle?: "plain" | "soft" | "bordered";
  productsPerRow?: string;
  showComparePrice?: boolean;
  showWishlist?: boolean;
  showQuickView?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  heroImageUrl?: string;
  showBestSellers?: boolean;
  bestSellersTitle?: string;
  showCategories?: boolean;
  showSellerStory?: boolean;
  sellerStoryTitle?: string;
  showSearch?: boolean;
  showSocialLinks?: boolean;
  showFooter?: boolean;
  returnPolicy?: string;
  deliveryNote?: string;
  showContactInfo?: boolean;
  supportEmail?: string;
  supportPhone?: string;
  // Illustrative values for the editor preview. Replace with API data in production.
  averageRating?: number;
  reviewCount?: number;
  followerCount?: number;
  totalProducts?: number;
  successfulOrders?: number;
  category?: string;
  verified?: boolean;
  themeMode?: "light" | "dark";
};

type LiveStorePreviewProps = {
  settings: StorePreviewSettings;
};

const demoProducts = [
  {
    id: 1,
    title: "Handcrafted Item",
    price: 1250,
    compareAtPrice: 1500,
    rating: 4.8,
  },
  {
    id: 2,
    title: "Everyday Essential",
    price: 890,
    compareAtPrice: 0,
    rating: 4.7,
  },
  {
    id: 3,
    title: "Premium Collection",
    price: 1750,
    compareAtPrice: 1990,
    rating: 4.9,
  },
  {
    id: 4,
    title: "Classic Favourite",
    price: 650,
    compareAtPrice: 0,
    rating: 4.6,
  },
];

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}k`;
  }
  return value.toLocaleString("en-BD");
}

export function LiveStorePreview({ settings }: LiveStorePreviewProps) {
  const s = { ...defaultStoreDesign, ...settings };

  const isDark = s.themeMode === "dark";
  const bgColor = isDark ? "#0B1220" : s.bgColor || "#FFFFFF";
  const textColor = isDark ? "#F8FAFC" : s.textColor || "#111827";
  const mutedText = isDark ? "#A7B0C0" : "#64748B";
  const borderColor = isDark ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.12)";
  const primary = s.primaryColor || "#064E3B";
  const accent = s.secondaryColor || "#10B981";
  const radiusClass: Record<StoreDesignValues["buttonRadius"], string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  const aspectClass: Record<StoreDesignValues["imageAspectRatio"], string> = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };
  const columns = Math.max(2, Math.min(5, Number(s.productsPerRow || 3)));
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  };
  const cardClass =
    s.cardStyle === "plain"
      ? "border-transparent shadow-none"
      : s.cardStyle === "bordered"
        ? "border-2 shadow-none"
        : "border shadow-sm";

  const buttonStyle: CSSProperties = {
    backgroundColor: primary,
    borderRadius: s.buttonRadius === "full" ? "9999px" : undefined,
  };

  return (
    <div
      className="mx-auto mb-8 w-full overflow-hidden rounded-xl border shadow-sm"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor,
        fontFamily: s.fontFamily || "Inter, sans-serif",
      }}
    >
      {s.showAnnouncementBar && (
        <div
          className="px-3 py-2 text-center text-xs font-medium text-white"
          style={{ backgroundColor: primary }}
        >
          {s.announcementText || "Welcome to our store"}
        </div>
      )}

      {/* Store-profile hero */}
      <section className="p-3 sm:p-4">
        <div
          className="relative h-28 overflow-hidden rounded-xl sm:h-40"
          style={{
            backgroundColor: `${primary}18`,
            backgroundImage: s.coverUrl
              ? `url("${s.coverUrl}")`
              : s.heroImageUrl
                ? `url("${s.heroImageUrl}")`
                : `linear-gradient(120deg, ${primary}, ${accent})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          {!s.coverUrl && !s.heroImageUrl && (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-white/90">
              <div>
                <p className="text-lg font-semibold sm:text-2xl">
                  {s.heroTitle || s.storeName || "Your Store"}
                </p>
                <p className="mt-1 text-xs sm:text-sm">
                  {s.heroSubtitle || s.tagline || "Your style, your way"}
                </p>
              </div>
            </div>
          )}
          <div className="absolute right-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
            Bangladesh
          </div>
        </div>

        <div className="px-1 sm:px-3">
          <div className="flex items-start justify-between gap-3">
            <div className="-mt-8 flex min-w-0 items-end gap-3 sm:-mt-10 sm:gap-4">
              <div
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 bg-white shadow-md sm:h-24 sm:w-24"
                style={{ borderColor: bgColor }}
              >
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.logoUrl}
                    alt={`${s.storeName || "Store"} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Store
                    className="h-7 w-7 sm:h-9 sm:w-9"
                    style={{ color: primary }}
                  />
                )}
                {s.verified !== false && s.showVerifiedBadge && (
                  <span className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-1 text-white ring-2 ring-white">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="min-w-0 pb-1 pt-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="max-w-full truncate text-base font-bold sm:text-xl">
                    {s.storeName || "Your Store"}
                  </h2>
                  {s.verified !== false && s.showVerifiedBadge && (
                    <ShieldCheck className="h-4 w-4 shrink-0 text-blue-500" />
                  )}
                </div>
                <p
                  className="mt-0.5 text-xs sm:text-sm"
                  style={{ color: mutedText }}
                >
                  {s.category || "Shop • Lifestyle • Everyday essentials"}
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Save store preview"
              className="mt-2 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs"
              style={{ borderColor, color: mutedText }}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>

          {s.description && (
            <p
              className="mt-3 line-clamp-2 max-w-3xl text-xs leading-5 sm:text-sm"
              style={{ color: mutedText }}
            >
              {s.description}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
              value={(s.averageRating ?? 4.8).toFixed(1)}
              label="Rating"
              sublabel={`${formatCount(s.reviewCount ?? 126)} reviews`}
              borderColor={borderColor}
              mutedText={mutedText}
            />
            <Stat
              icon={<Users className="h-4 w-4 text-blue-500" />}
              value={formatCount(s.followerCount ?? 1240)}
              label="Followers"
              borderColor={borderColor}
              mutedText={mutedText}
            />
            <Stat
              icon={<Package className="h-4 w-4" style={{ color: accent }} />}
              value={formatCount(s.totalProducts ?? 248)}
              label="Products"
              borderColor={borderColor}
              mutedText={mutedText}
            />
            <Stat
              icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
              value={formatCount(s.successfulOrders ?? 1800)}
              label="Successful orders"
              borderColor={borderColor}
              mutedText={mutedText}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a
              href={s.storeSlug ? `/stores/${s.storeSlug}` : "#"}
              onClick={(event) => {
                if (!s.storeSlug) event.preventDefault();
              }}
              className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white ${radiusClass[s.buttonRadius]}`}
              style={buttonStyle}
            >
              <Store className="h-4 w-4" />
              Visit Store
              <ArrowRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              className={`inline-flex min-h-10 items-center justify-center gap-2 border px-4 py-2 text-sm font-semibold ${radiusClass[s.buttonRadius]}`}
              style={{ borderColor: accent, color: accent }}
            >
              <UserPlus className="h-4 w-4" />
              Follow
            </button>
          </div>
        </div>
      </section>

      {/* Optional store hero banner below the profile details */}
      {s.showHeroBanner && (
        <section
          className="mx-3 mb-2 overflow-hidden rounded-xl p-4 sm:mx-4"
          style={{
            background: `linear-gradient(120deg, ${primary}18, ${accent}25)`,
          }}
        >
          <p
            className="text-sm font-bold sm:text-lg"
            style={{ color: primary }}
          >
            {s.heroTitle || s.storeName || "Find your next favourite"}
          </p>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: mutedText }}>
            {s.heroSubtitle || s.tagline || "Discover products picked for you."}
          </p>
          <span
            className={`mt-3 inline-flex px-3 py-1.5 text-xs font-semibold text-white ${radiusClass[s.buttonRadius]}`}
            style={buttonStyle}
          >
            {s.heroButtonText || "Shop collection"}
          </span>
        </section>
      )}

      {s.showCategories && (
        <div className="flex gap-2 overflow-hidden px-3 py-2 sm:px-4">
          {["All products", "New arrivals", "Popular"].map((category) => (
            <span
              key={category}
              className="shrink-0 rounded-full border px-3 py-1 text-[10px]"
              style={{ borderColor, color: mutedText }}
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {s.showFeaturedProducts && (
        <section className="p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3
              className="text-sm font-bold sm:text-base"
              style={{ color: primary }}
            >
              {s.featuredTitle || "Featured products"}
            </h3>
            <span className="text-xs" style={{ color: mutedText }}>
              View all
            </span>
          </div>
          <div className="grid gap-2 sm:gap-3" style={gridStyle}>
            {demoProducts.slice(0, columns).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                settings={s}
                cardClass={cardClass}
                radiusClass={radiusClass[s.buttonRadius]}
                mutedText={mutedText}
                textColor={textColor}
                primary={primary}
                borderColor={borderColor}
                aspectClass={aspectClass[s.imageAspectRatio]}
              />
            ))}
          </div>
        </section>
      )}

      {s.showNewArrivals && (
        <section className="border-t p-3 sm:p-4" style={{ borderColor }}>
          <h3
            className="mb-3 flex items-center gap-1.5 text-sm font-bold"
            style={{ color: primary }}
          >
            <Sparkles className="h-4 w-4" />
            {s.newArrivalsTitle || "New arrivals"}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {demoProducts.slice(1, 4).map((product) => (
              <ProductCard
                key={`new-${product.id}`}
                product={product}
                settings={s}
                cardClass={cardClass}
                radiusClass={radiusClass[s.buttonRadius]}
                mutedText={mutedText}
                textColor={textColor}
                primary={primary}
                borderColor={borderColor}
                aspectClass={aspectClass[s.imageAspectRatio]}
              />
            ))}
          </div>
        </section>
      )}

      {(s.showVerifiedBadge || s.showReturnPolicy || s.showContactInfo) && (
        <footer
          className="flex flex-wrap gap-x-4 gap-y-2 border-t p-3 text-[10px] sm:text-xs"
          style={{ borderColor, color: mutedText }}
        >
          {s.showVerifiedBadge && (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Verified
              seller
            </span>
          )}
          {s.showReturnPolicy && (
            <span className="inline-flex items-center gap-1">
              <RotateCcw className="h-3.5 w-3.5" /> Return policy
            </span>
          )}
          {s.deliveryNote && (
            <span className="inline-flex items-center gap-1">
              <ShoppingCart className="h-3.5 w-3.5" /> {s.deliveryNote}
            </span>
          )}
          {s.showContactInfo && (s.supportPhone || s.supportEmail) && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {s.supportPhone || s.supportEmail}
            </span>
          )}
        </footer>
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  sublabel,
  borderColor,
  mutedText,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel?: string;
  borderColor: string;
  mutedText: string;
}) {
  return (
    <div
      className="min-w-0 border-r pr-2 last:border-r-0"
      style={{ borderColor }}
    >
      <div className="mb-1 flex items-center gap-2">{icon}</div>
      <p className="truncate text-sm font-bold sm:text-base">{value}</p>
      <p className="text-[10px] sm:text-xs" style={{ color: mutedText }}>
        {label}
      </p>
      {sublabel && (
        <p className="text-[9px] sm:text-[10px]" style={{ color: mutedText }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}

function ProductCard({
  product,
  settings,
  cardClass,
  radiusClass,
  mutedText,
  textColor,
  primary,
  borderColor,
  aspectClass,
}: {
  product: (typeof demoProducts)[number];
  settings: StorePreviewSettings & StoreDesignValues;
  cardClass: string;
  radiusClass: string;
  mutedText: string;
  textColor: string;
  primary: string;
  borderColor: string;
  aspectClass: string;
}) {
  const hasSale = product.compareAtPrice > product.price;

  return (
    <article
      className={`min-w-0 overflow-hidden ${cardClass} ${radiusClass}`}
      style={{
        borderColor,
        backgroundColor: settings.themeMode === "dark" ? "#111827" : "#FFFFFF",
      }}
    >
      <div
        className={`${aspectClass} relative flex items-center justify-center bg-slate-100`}
      >
        <Package className="h-7 w-7 text-slate-300" />
        {settings.showSaleBadge && hasSale && (
          <span className="absolute left-1 top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            Sale
          </span>
        )}
        {settings.showWishlist && (
          <span className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-700">
            <Bookmark className="h-3 w-3" />
          </span>
        )}
      </div>
      <div className="p-2">
        <p
          className="truncate text-[10px] font-medium sm:text-xs"
          style={{ color: textColor }}
        >
          {product.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="text-xs font-bold" style={{ color: primary }}>
            ৳{product.price.toLocaleString("en-BD")}
          </span>
          {settings.showComparePrice && settings.showSaleBadge && hasSale && (
            <span
              className="text-[9px] line-through"
              style={{ color: mutedText }}
            >
              ৳{product.compareAtPrice.toLocaleString("en-BD")}
            </span>
          )}
        </div>
        {settings.showRatings && (
          <div
            className="mt-1 flex items-center gap-1 text-[9px]"
            style={{ color: mutedText }}
          >
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {product.rating}
          </div>
        )}
        {settings.showStockStatus && (
          <p className="mt-1 text-[9px] text-emerald-600">In stock</p>
        )}
      </div>
    </article>
  );
}
