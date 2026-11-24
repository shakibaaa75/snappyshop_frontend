"use client";

import { ProductReviews } from "@/components/reviews/Reviews";
import { type Product, type StoreDesign } from "@/lib/store-design/types";
import { type CSSProperties, useEffect } from "react";
import {
  ArrowRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buyButtonStyle,
  controlRadius,
  PRODUCT_GRID_COLS,
  PRODUCT_IMAGE_RATIO,
  PRODUCT_PHONE,
  productRadius,
} from "@/lib/store-design/product-page";
import {
  formatPrice,
  loadFont,
  readableOn,
  themeVars,
} from "@/lib/store-design/utilts";
import { ProductArt } from "../productArt";
import { StoreProductGrid } from "./product-grid";
import { Shimmer } from "./skeleton";
import { INK, muted } from "./tokens";
import { type PreviewDevice } from "./types";

/* ------------------------------------------------------------------ */
/* Product page preview (mirrors ProductClient)                        */
/* ------------------------------------------------------------------ */

export function ProductPagePreview({
  design,
  products,
  device,
  loading = false,
}: {
  design: StoreDesign;
  products: Product[];
  device: PreviewDevice;
  loading?: boolean;
}) {
  const mobile = device === "mobile";

  const placeholder: Product = {
    id: "preview",
    name: "Sample Product Name",
    categoryId: "preview",
    price: 1290,
    comparePrice: 1590,
    emoji: "🛍️",
    hue: 210,
    rating: 4.8,
    reviews: 128,
    sold: 342,
    stock: 12,
    createdAt: new Date().toISOString(),
    badge: "New arrival",
    description:
      "Premium heavyweight cotton with a relaxed fit for ultimate comfort and modern style.",
  };

  const sample = products[0] ?? placeholder;
  // Other products first; with too few, repeat the sample so the row is visible.
  const relatedPreview = (() => {
    const others = products.filter((p) => p.id !== sample.id);
    if (others.length >= 2) return others.slice(0, 12);
    return Array.from({ length: 6 }, (_, i) => ({
      ...sample,
      id: `${sample.id}-r${i}`,
    }));
  })();

  useEffect(() => loadFont(design.fontFamily), [design.fontFamily]);

  const pageBg = design.productBgColor || "var(--s-bg)";
  // Follows the template: its primary color unless the seller picked another.
  const accent = design.productAccentColor || "var(--s-primary)";
  const accentOn = design.productAccentColor
    ? readableOn(design.productAccentColor)
    : "var(--s-on-primary)";

  const onSale = !!sample.comparePrice && sample.comparePrice > sample.price;
  const off = onSale
    ? Math.round((1 - sample.price / (sample.comparePrice as number)) * 100)
    : 0;

  const roundBtn =
    "flex h-11 w-11 items-center justify-center rounded-[var(--pp-btn)]";
  const layout = design.productLayout;
  const editorial = layout === "editorial";
  const galleryLeft = layout === "gallery-left";
  const galleryRight = layout === "gallery-right";
  const sideThumbs = galleryLeft || galleryRight;
  const phone = PRODUCT_PHONE[layout];
  const wide = !mobile;
  const reviewsAfterProducts = design.productReviewPosition === "after";
  const reviewSection = !loading && design.showProductReviews !== false && (
    <div data-product-reviews className="pointer-events-auto">
      <ProductReviews
        key={sample.id}
        preview
        product={products[0]?.id ?? ""}
        layout={design.productReviewLayout}
        heading={design.productReviewHeading}
      />
    </div>
  );
  return (
    <div
      style={
        {
          ...themeVars(design),
          "--pp-r": `${productRadius(design)}px`,
          "--pp-btn": `${controlRadius(design)}px`,
        } as CSSProperties
      }
      className="text-[15px] leading-normal"
    >
      <div
        className="min-h-screen"
        style={{ background: pageBg, color: "var(--s-text)" }}
      >
        {design.announcementEnabled && design.announcementText && (
          <div
            className="px-4 py-2 text-center text-xs font-semibold"
            style={{
              background: "var(--s-primary)",
              color: "var(--s-on-primary)",
            }}
          >
            {design.announcementText}
          </div>
        )}

        <main
          className={cn(
            "mx-auto w-full max-w-[1100px]",
            wide &&
              cn(
                "grid items-start gap-10 px-8 py-8",
                PRODUCT_GRID_COLS[layout],
              ),
          )}
        >
          {loading ? (
            <>
              <Shimmer
                className={cn(
                  "w-full",
                  mobile ? "rounded-b-[32px]" : "rounded-[32px]",
                )}
                style={{ aspectRatio: "4 / 5" }}
              />
              <div className="space-y-4 px-5 pt-6">
                <Shimmer className="h-6 w-24 rounded-full" />
                <Shimmer className="h-8 w-4/5" />
                <Shimmer className="h-8 w-32" />
                <Shimmer className="h-20 w-full" />
                <Shimmer className="h-14 w-full rounded-full" />
              </div>
            </>
          ) : (
            <>
              <section
                className={cn(
                  "relative",
                  mobile && phone.inset && "pt-16",
                  wide && galleryLeft && "flex flex-row-reverse gap-4",
                  wide && galleryRight && "flex flex-row gap-4",
                )}
              >
                {wide && editorial ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "overflow-hidden rounded-[var(--pp-r)]",
                          i === 0 ? "col-span-2 aspect-[5/4]" : "aspect-[4/5]",
                        )}
                        style={{ background: "var(--s-surface)" }}
                      >
                        <ProductArt
                          product={sample}
                          emojiClassName="text-[120px]"
                        />
                      </div>
                    ))}
                  </div>
                ) : mobile && phone.stackAll ? (
                  <div className="grid grid-cols-2 gap-2 px-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "overflow-hidden",
                          i === 0
                            ? "col-span-2 -mx-4 rounded-b-[32px]"
                            : "rounded-[var(--pp-r)]",
                        )}
                        style={{
                          background: "var(--s-surface)",
                          aspectRatio: "1 / 1",
                        }}
                      >
                        <ProductArt
                          product={sample}
                          emojiClassName="text-[140px]"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "overflow-hidden",
                      mobile
                        ? phone.inset
                          ? "mx-4 rounded-[var(--pp-r)]"
                          : "rounded-b-[32px]"
                        : "rounded-[var(--pp-r)]",
                      wide && sideThumbs && "min-w-0 flex-1",
                    )}
                    style={{
                      background: "var(--s-surface)",
                      aspectRatio: mobile
                        ? phone.ratio
                        : PRODUCT_IMAGE_RATIO[layout],
                    }}
                  >
                    <ProductArt
                      product={sample}
                      emojiClassName="text-[140px]"
                    />
                  </div>
                )}
                {wide && !editorial && (
                  <div
                    className={cn(
                      "flex gap-3",
                      sideThumbs ? "w-20 shrink-0 flex-col" : "mt-4",
                    )}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
                        style={{
                          background: "var(--s-surface)",
                          opacity: i === 0 ? 1 : 0.65,
                          boxShadow:
                            i === 0
                              ? "0 0 0 2px var(--s-text)"
                              : "0 0 0 1px var(--s-border)",
                        }}
                      >
                        <ProductArt
                          product={sample}
                          emojiClassName="text-2xl"
                        />
                      </span>
                    ))}
                  </div>
                )}
                {mobile && (
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                    <span className={roundBtn} style={INK}>
                      <ArrowRight className="h-5 w-5 rotate-180" />
                    </span>
                    <div className="flex gap-2">
                      {design.showWishlist && (
                        <span className={roundBtn} style={INK}>
                          <Heart className="h-5 w-5" />
                        </span>
                      )}
                      {design.showCartIcon && (
                        <span className={roundBtn} style={INK}>
                          <ShoppingBag className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {mobile && !phone.stackAll && (
                  <div
                    className={cn(
                      phone.thumbs === "right" &&
                        "absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2",
                      phone.thumbs === "left" &&
                        "absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-2",
                      phone.thumbs === "bottom" &&
                        cn(
                          "absolute inset-x-0 flex justify-center gap-2",
                          phone.sheet ? "bottom-12" : "bottom-3",
                        ),
                      phone.thumbs === "row" &&
                        "flex gap-2 overflow-x-auto px-4 pt-2",
                    )}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "shrink-0 overflow-hidden rounded-xl",
                          phone.thumbs === "row" ? "h-14 w-14" : "h-12 w-12",
                        )}
                        style={{
                          background: "var(--s-surface)",
                          opacity: i === 0 ? 1 : 0.7,
                          boxShadow:
                            i === 0
                              ? "0 0 0 2px var(--s-text)"
                              : "0 0 0 1px var(--s-border)",
                        }}
                      >
                        <ProductArt product={sample} emojiClassName="text-xl" />
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section
                className={cn(
                  mobile ? "space-y-3 px-4 pb-4" : "space-y-5 px-5 pb-8",
                  mobile
                    ? phone.sheet
                      ? "-mt-8 rounded-t-[32px] pt-4"
                      : "mt-3 pt-0"
                    : "pt-2",
                )}
                style={{ background: pageBg }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-[var(--pp-btn)] px-3 py-1 text-[11px] font-semibold"
                    style={{ background: "var(--s-surface)" }}
                  >
                    {sample.badge || "New arrival"}
                  </span>
                  {onSale && (
                    <span
                      className="rounded-[var(--pp-btn)] px-3 py-1 text-[11px] font-bold"
                      style={{
                        background: "var(--s-secondary)",
                        color: "var(--s-on-secondary)",
                      }}
                    >
                      {off}% off
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold leading-tight tracking-tight">
                      {sample.name}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                      <span className="text-2xl font-bold tracking-tight">
                        {formatPrice(sample.price)}
                      </span>
                      {design.showComparePrice && onSale && (
                        <span className="text-base line-through" style={muted}>
                          {formatPrice(sample.comparePrice as number)}
                        </span>
                      )}
                    </div>
                  </div>
                  {design.showProductReviews !== false &&
                    design.showRatings && (
                      <div className="shrink-0 text-right text-sm">
                        <span className="flex items-center justify-end gap-1 font-semibold">
                          <Star
                            className="h-4 w-4"
                            style={{ color: "#f59e0b" }}
                            fill="currentColor"
                          />
                          {sample.rating.toFixed(1)}
                        </span>
                        <span className="text-xs" style={muted}>
                          {sample.reviews} reviews
                        </span>
                      </div>
                    )}
                </div>

                {sample.description && (
                  <p className="text-sm leading-relaxed" style={muted}>
                    {sample.description}
                  </p>
                )}

                {design.showProductColorPicker && (
                  <div className="space-y-2.5">
                    <p className="text-sm font-semibold">Color</p>
                    <div className="flex gap-2.5">
                      {["#3f4551", "#a8c0dd", "#ece5d8", "#1c1c1c"].map(
                        (hex, i) => (
                          <span
                            key={hex}
                            className="h-9 w-9 rounded-[var(--pp-btn)]"
                            style={{
                              background: hex,
                              boxShadow:
                                i === 0
                                  ? "0 0 0 2px var(--s-bg), 0 0 0 3.5px var(--s-text)"
                                  : "0 0 0 1px var(--s-border)",
                            }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}

                {design.showProductSizePicker && (
                  <div className="space-y-2.5">
                    <p className="text-sm font-semibold">Select size</p>
                    <div className="flex flex-wrap gap-2.5">
                      {["XS", "S", "M", "L", "XL"].map((s) => (
                        <span
                          key={s}
                          className="flex h-12 w-12 items-center justify-center rounded-[var(--pp-btn)] text-sm font-semibold"
                          style={
                            s === "M"
                              ? { background: accent, color: accentOn }
                              : { background: "var(--s-surface)" }
                          }
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end justify-between gap-4">
                  {design.showProductQuantity ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Qty</p>
                      <div
                        className="flex h-12 items-center rounded-[var(--pp-btn)] px-1"
                        style={{ background: "var(--s-surface)" }}
                      >
                        <span className="flex h-10 w-10 items-center justify-center">
                          <Minus className="h-4 w-4" />
                        </span>
                        <span className="min-w-9 text-center text-sm font-semibold">
                          1
                        </span>
                        <span className="flex h-10 w-10 items-center justify-center">
                          <Plus className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span />
                  )}
                  <div className="text-right">
                    <p className="text-xs" style={muted}>
                      Total price
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                      {formatPrice(sample.price)}
                    </p>
                  </div>
                </div>

                <span
                  className="flex h-14 w-full items-center justify-center gap-2 text-base font-semibold"
                  style={buyButtonStyle(design, accent, accentOn)}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {design.productButtonText.trim() || "Add to bag"}
                </span>

                {design.showProductTrustRow && (
                  <div
                    className="grid grid-cols-1 gap-3 rounded-[24px] p-4 sm:grid-cols-3"
                    style={{ background: "var(--s-surface)" }}
                  >
                    {[
                      {
                        Icon: Truck,
                        title: "Free shipping",
                        text: `Over ${formatPrice(design.freeDeliveryThreshold || 999)}`,
                        show: true,
                      },
                      {
                        Icon: RotateCcw,
                        title: "Returns",
                        text: design.returnPolicy.trim(),
                        show:
                          design.showReturnPolicy &&
                          !!design.returnPolicy.trim(),
                      },
                      {
                        Icon: ShieldCheck,
                        title: "Secure payment",
                        text: "100% secure",
                        show: design.showPaymentBadges,
                      },
                    ]
                      .filter((t) => t.show)
                      .map(({ Icon, title, text }) => (
                        <div key={title} className="flex items-center gap-2.5">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--pp-btn)]"
                            style={INK}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold leading-tight">
                              {title}
                            </p>
                            <p
                              className="line-clamp-2 text-[11px] leading-tight"
                              style={muted}
                            >
                              {text}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
        {!reviewsAfterProducts && reviewSection}
        {design.showProductRelated && !loading && (
          <section className="mx-auto w-full max-w-[1100px] px-5 pb-10 lg:px-8">
            <h2 className="mb-4 text-xl font-bold tracking-tight">
              {design.productRelatedTitle.trim() || "You may also like"}
            </h2>
            <StoreProductGrid
              design={design}
              products={relatedPreview}
              interactive={false}
              mobile={mobile}
            />
          </section>
        )}
        {reviewsAfterProducts && reviewSection}
      </div>
    </div>
  );
}
