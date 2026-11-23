"use client";
import {
  AddReviewButton,
  ProductReviews,
  ReviewScore,
} from "@/components/reviews/Reviews";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePublicDelivery } from "@/lib/delivery/use-delivery";
import { chargesFor, chargeText } from "@/lib/delivery/pricing";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Zap,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError, apiFetch } from "@/lib/api/http";
import { trackAnalyticsEvent } from "@/lib/api/analytics";
import { fetchPublicStore } from "@/lib/store-design/api";
import { lineKey, useCart } from "@/lib/store-design/cart";
import {
  formatPrice,
  loadFont,
  readableOn,
  themeVars,
} from "@/lib/store-design/utilts";
import { ProductArt } from "@/components/store-design/productArt";
import {
  PRODUCT_GRID_COLS,
  PRODUCT_IMAGE_LG_ASPECT,
  PRODUCT_PHONE,
  buyButtonStyle,
  controlRadius,
  optionVisible,
  productRadius,
} from "@/lib/store-design/product-page";
import { StoreProductGrid } from "@/components/store-design/Storepreview";
import {
  toggleWishlistItem,
  useWishlisted,
} from "@/lib/store-design/use-wishlist";
import {
  comboLabel,
  effectivePrice,
  findCombination,
  isColorName,
  productImages,
  allProductImages,
  variantImageIndex,
  selectValue,
  variantOptions,
  type Selection,
  type VariantProduct,
} from "@/lib/store-design/variants";
import type { ProductOption } from "@/lib/api/products";
import type { Product, StoreDesign } from "@/lib/store-design/types";
import type { PublicStoreData } from "@/lib/store-design/server";

const LOW_STOCK = 5;

/**
 * Variant details passed as a third argument to cart.addItem.
 * Extend your cart to store it (see notes), or it is ignored.
 */
type CartVariant = {
  id: string;
  label: string;
  price: number;
  sku?: string;
  imageUrl?: string;
  selection: Selection;
};

export default function ProductClient({
  slug,
  productId,
  initialStore,
  initialProduct,
  marketplace = false,
}: {
  slug: string;
  productId: string;
  initialStore: PublicStoreData;
  initialProduct: Product;
  marketplace?: boolean;
}) {
  const router = useRouter();
  const cart = useCart();

  // Logged-in users must not inflate public view counts
  const { data: me, isFetched: meFetched } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await apiFetch<unknown>("/auth/me");
      } catch (err) {
        if (
          err instanceof ApiError &&
          (err.status === 401 || err.status === 403)
        ) {
          return null;
        }
        return null;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
  const isLoggedIn = Boolean(me);

  useEffect(() => {
    if (!slug || !productId) return;
    if (!meFetched) return;
    if (isLoggedIn) return;

    // apiFetch JSON.stringifies `body` — pass a plain object, not a string
    trackAnalyticsEvent({
      storeSlug: slug,
      kind: "product_view",
      productId,
    }).catch(() => {});
  }, [slug, productId, isLoggedIn, meFetched]);

  const { data, error } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: () => fetchPublicStore(slug),
    initialData: initialStore,
    staleTime: 30_000,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });

  const design = data?.design as StoreDesign | undefined;
  const products = data?.products ?? initialStore.products;

  const product = useMemo(
    () =>
      (products.find((p) => p.id === productId) ??
        initialProduct) as VariantProduct,
    [products, productId, initialProduct],
  );

  // The store's delivery charges. Used for this product's delivery line below.
  const deliveryQ = usePublicDelivery(slug);

  const related = useMemo(() => {
    const others = products.filter((p) => p.id !== product.id);
    const sameCategory = others.filter(
      (p) => p.categoryId === product.categoryId,
    );
    const rest = others.filter((p) => p.categoryId !== product.categoryId);
    // Same-category first, then fill with other products so the section shows
    return [...sameCategory, ...rest].slice(0, 12);
  }, [products, product]);

  const [qty, setQty] = useState(1);
  const wish = useWishlisted(slug, product.id);
  const [mainImage, setMainImage] = useState(0);
  // Nothing is pre-selected: the shopper chooses their own variant. Until then
  // the product's main image stays on screen.
  const [selection, setSelection] = useState<Selection>({});
  const [needPick, setNeedPick] = useState(false);
  const [tab, setTab] = useState<string>("");

  /* ---------- Variant state ---------- */

  const options = variantOptions(product);
  // Only keep choices that still point at real option values.
  const sel: Selection = Object.fromEntries(
    options
      .filter((o) => o.values.some((v) => v.id === selection[o.id]))
      .map((o) => [o.id, selection[o.id]]),
  );
  const missingOption = options.find((o) => !sel[o.id]);
  const needsSelection = options.length > 0 && !!missingOption;
  const combo = needsSelection ? null : findCombination(product, sel);
  const hasPicked = Object.keys(sel).length > 0;

  // Combinations that agree with whatever the shopper has chosen so far.
  const chosenCombos = (product.combinations ?? []).filter((c) =>
    Object.entries(sel).every(([oid, vid]) => c.valueIds[oid] === vid),
  );
  const totalStock = (product.combinations ?? []).reduce(
    (n, c) => n + Math.max(0, c.stock),
    0,
  );

  const price = effectivePrice(product, combo);
  const stock = combo
    ? combo.stock
    : options.length > 0
      ? totalStock
      : product.stock;
  const sku = combo?.sku || product.sku;
  const label = comboLabel(product, combo);

  // The gallery always holds every photo, main image first. Picking a variant
  // does not swap the gallery: it jumps to that variant's photo.
  const pickedCombo =
    combo ??
    (hasPicked
      ? (chosenCombos.find((c) => (c.imageUrls ?? []).some((u) => u?.trim())) ??
        null)
      : null);
  // The variant's own photo (or the main one) is what goes in the cart.
  const variantImages = productImages(product, pickedCombo);
  const images = allProductImages(product);
  const slides: (string | undefined)[] =
    images.length > 0 ? images : [undefined];
  const imageKey = images.join("|");
  const artFor = (url?: string) => ({ ...product, imageUrl: url }) as Product;

  useEffect(() => {
    setMainImage(0);
  }, [imageKey]);

  const jumpTo = variantImageIndex(images, pickedCombo);
  const pickedKey = pickedCombo?.id ?? "";
  useEffect(() => {
    if (!hasPicked) {
      setMainImage(0);
      return;
    }
    if (jumpTo >= 0) setMainImage(jumpTo);
    // Only when the shopper picks something else, so browsing stays free.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedKey, jumpTo, hasPicked]);

  const maxQty = stock > 0 ? stock : 1;
  useEffect(() => {
    setQty((q) => Math.min(q, maxQty));
  }, [maxQty]);

  if (error || !design) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <p className="text-sm text-muted-foreground">
          This product is no longer available or the store may have been
          removed.
        </p>
        <Button variant="outline" onClick={() => router.push(`/store/${slug}`)}>
          Back to store
        </Button>
      </div>
    );
  }

  loadFont(design.fontFamily);

  const pageBg = design.productBgColor || "var(--s-bg)";
  // Follows the template: its primary color unless the seller picked another.
  const accent = design.productAccentColor || "var(--s-primary)";
  const accentOn = design.productAccentColor
    ? readableOn(design.productAccentColor)
    : "var(--s-on-primary)";
  const showReviews = marketplace || design.showProductReviews !== false;
  const reviewsAfterProducts = design.productReviewPosition === "after";
  const reviewSection = showReviews && (
    <ProductReviews
      product={product.id}
      layout={design.productReviewLayout}
      heading={design.productReviewHeading}
    />
  );
  const layout = design.productLayout;
  const editorial = layout === "editorial";
  const galleryLeft = layout === "gallery-left";
  const galleryRight = layout === "gallery-right";
  // Thumbnails sit in a column beside the photo (left or right).
  const sideThumbs = galleryLeft || galleryRight;
  const stacked = layout === "stacked";
  const phone = PRODUCT_PHONE[layout];
  const shownOptions = options.filter((o) => optionVisible(o.name, design));

  const onSale = !!product.comparePrice && product.comparePrice > price;
  const off = onSale
    ? Math.round((1 - price / (product.comparePrice as number)) * 100)
    : 0;
  const soldOut = stock <= 0;
  const paused = design.vacationMode;
  const canBuy = cart.ready && !soldOut && !paused;
  const selectedKey = lineKey({ productId: product.id, variantId: combo?.id });
  const added = !needsSelection && cart.lines.some((line) => lineKey(line) === selectedKey);
  const shownMain = Math.min(mainImage, slides.length - 1);

  const storeHref = `/store/${slug}`;

  const roundBtn: CSSProperties = {
    background: accent,
    color: accentOn,
  };

  /* ---------- Info tabs built from real product and store data ---------- */

  const attributes = (product.attributes ?? []).filter(
    (a) => a.key?.trim() && a.value?.trim(),
  );
  const shippingPoints: string[] = [];
  // This product's own charges: its custom amount if the seller set one,
  // otherwise the store-wide amount. An order pays the highest charge among
  // its products, so a larger cart can show a higher figure at checkout.
  const dSettings = deliveryQ.data;
  const dCharges = dSettings ? chargesFor(dSettings, product.id) : undefined;
  const dThreshold = dSettings?.freeDeliveryThreshold ?? 0;
  const dAllFree =
    !!dCharges && dCharges.insideDhaka === 0 && dCharges.outsideDhaka === 0;
  const dLine = dCharges
    ? dAllFree
      ? "Free delivery"
      : dCharges.insideDhaka === dCharges.outsideDhaka
        ? `Delivery ${chargeText(dCharges.insideDhaka, formatPrice)} anywhere in Bangladesh`
        : `Delivery ${chargeText(dCharges.insideDhaka, formatPrice)} inside Dhaka, ${chargeText(dCharges.outsideDhaka, formatPrice)} outside Dhaka`
    : "";
  if (dLine) shippingPoints.push(dLine);
  if (dThreshold > 0 && dCharges && !dAllFree)
    shippingPoints.push(`Free delivery over ${formatPrice(dThreshold)}`);
  if (design.deliveryNote) shippingPoints.push(design.deliveryNote);
  if (design.showReturnPolicy && design.returnPolicy.trim())
    shippingPoints.push(design.returnPolicy.trim());

  const tabs: { id: string; label: string }[] = [];
  if (attributes.length > 0)
    tabs.push({ id: "specs", label: "Specifications" });
  if (shippingPoints.length > 0)
    tabs.push({ id: "shipping", label: "Shipping & returns" });
  const activeTab = tabs.find((t) => t.id === tab)?.id ?? tabs[0]?.id;

  /* ---------- Actions ---------- */

  const pick = (optionId: string, valueId: string) => {
    setNeedPick(false);
    const next = { ...sel, [optionId]: valueId };
    // Keep the shopper's other choices when that mix exists...
    const exists = (product.combinations ?? []).some((c) =>
      Object.entries(next).every(([oid, vid]) => c.valueIds[oid] === vid),
    );
    // ...otherwise move to the closest combination that does.
    setSelection(exists ? next : selectValue(product, sel, optionId, valueId));
  };

  const addToCart = (): boolean => {
    if (!canBuy) return false;
    if (needsSelection) {
      setNeedPick(true);
      return false;
    }
    if (added) return true;
    const variant: CartVariant | undefined = combo
      ? {
          id: combo.id,
          label,
          price,
          sku: sku || undefined,
          imageUrl: variantImages[0] ?? images[0],
          selection: sel,
        }
      : undefined;
    cart.addItem(product, qty, variant, true);

    if (!isLoggedIn) {
      trackAnalyticsEvent({
        storeSlug: slug,
        kind: "add_to_cart",
        productId: product.id,
      }).catch(() => {});
    }
    return true;
  };

  // Adds the chosen variant/quantity, then goes straight to checkout.
  const handleBuyNow = () => {
    if (!addToCart()) return;
    router.push(`${storeHref}/checkout`);
  };

  const hasRelated =
    !marketplace && design.showProductRelated && related.length > 0;
  return (
    <div
      style={
        {
          ...themeVars(design),
          "--pp-btn": `${controlRadius(design)}px`,
        } as CSSProperties
      }
      data-pp="v2"
      data-template={design.template}
      data-layout={design.productLayout}
      data-card={design.cardVariant}
      data-radius={design.buttonRadius}
      data-primary={design.primaryColor}
      className="storefront text-[15px] leading-normal"
    >
      <div
        className="min-h-screen"
        style={{ background: pageBg, color: "var(--s-text)" }}
      >
        {!marketplace &&
          design.announcementEnabled &&
          design.announcementText && (
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

        {/* Desktop only: store profile header */}
        <header
          className={
            marketplace
              ? "hidden"
              : "sticky top-0 z-30 hidden border-b lg:block"
          }
          style={{
            background: pageBg,
            borderColor: "var(--s-border)",
          }}
        >
          <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-6 px-8">
            <Link
              href={storeHref}
              className="group flex min-w-0 items-center gap-3"
              aria-label={`Visit ${design.storeName}`}
            >
              <StoreAvatar design={design} size={44} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[15px] font-bold leading-tight">
                  <span className="truncate group-hover:underline underline-offset-2">
                    {design.storeName}
                  </span>
                  {design.showVerifiedBadge && (
                    <BadgeCheck
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--s-secondary)" }}
                      aria-label="Verified store"
                    />
                  )}
                </p>
                {design.tagline && (
                  <p
                    className="truncate text-xs leading-tight"
                    style={{ color: "var(--s-muted)" }}
                  >
                    {design.tagline}
                  </p>
                )}
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={storeHref}
                className="mr-1 inline-flex h-10 items-center gap-2 rounded-[var(--pp-btn)] px-4 text-sm font-semibold transition active:scale-95"
                style={{ background: "var(--s-surface)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to store
              </Link>
              {design.showWishlist && (
                <button
                  type="button"
                  aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={wish}
                  onClick={() => toggleWishlistItem(slug, product.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--pp-btn)] transition active:scale-90"
                  style={
                    wish ? { background: "#ef4444", color: "#fff" } : roundBtn
                  }
                >
                  <Heart
                    className="h-[18px] w-[18px]"
                    fill={wish ? "currentColor" : "none"}
                  />
                </button>
              )}
              {design.showCartIcon && (
                <Link
                  href={`${storeHref}/cart`}
                  aria-label="Cart"
                  className="relative flex h-10 w-10 items-center justify-center rounded-[var(--pp-btn)] transition active:scale-90"
                  style={roundBtn}
                >
                  <ShoppingBag className="h-[18px] w-[18px]" />
                  {cart.count > 0 && (
                    <span
                      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                      style={{
                        background: "var(--s-secondary)",
                        color: "var(--s-on-secondary)",
                      }}
                    >
                      {cart.count}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
        </header>

        {marketplace && (
          <nav
            aria-label="Product navigation"
            className="mx-auto flex max-w-[1200px] justify-between gap-4 px-5 py-4 text-sm"
          >
            <Link href="/products" className="inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> All products
            </Link>
            <Link href={storeHref}>Sold by {design.storeName}</Link>
          </nav>
        )}

        <main
          className={cn(
            "mx-auto w-full max-w-[1200px] pb-6 lg:grid lg:items-start lg:gap-14 lg:px-8 lg:py-10 lg:pb-16",
            PRODUCT_GRID_COLS[layout],
          )}
          style={{ "--pp-r": `${productRadius(design)}px` } as CSSProperties}
        >
          <section
            className={cn(
              "relative",
              !editorial && !stacked && "lg:sticky lg:top-[96px]",
              galleryLeft && "lg:flex lg:flex-row-reverse lg:gap-4",
              galleryRight && "lg:flex lg:flex-row lg:gap-4",
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden lg:rounded-[var(--pp-r)]",
                phone.aspect,
                phone.inset
                  ? "mx-4 mt-[calc(env(safe-area-inset-top,0px)+4.5rem)] w-[calc(100%-2rem)] rounded-[var(--pp-r)] lg:mx-0 lg:mt-0 lg:w-full"
                  : "w-full rounded-b-[32px]",
                PRODUCT_IMAGE_LG_ASPECT[layout],
                sideThumbs && "lg:min-w-0 lg:flex-1",
                editorial && "hidden",
              )}
              style={{
                background: "var(--s-surface)",
                maxHeight: "min(720px, 82vh)",
              }}
            >
              <div
                key={`${imageKey}-${shownMain}`}
                className="sf-fade-in h-full w-full"
              >
                <ProductArt
                  product={artFor(slides[shownMain])}
                  emojiClassName="text-[140px]"
                  width={1200}
                />
              </div>

              {/* Desktop: image counter */}
              {slides.length > 1 && !editorial && (
                <span
                  className="absolute bottom-4 right-4 hidden rounded-[var(--pp-btn)] px-3 py-1 text-xs font-semibold lg:block"
                  style={{
                    background: "rgba(255,255,255,.78)",
                    color: "#000",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                  }}
                >
                  {shownMain + 1} / {slides.length}
                </span>
              )}
            </div>

            {/* Mobile: top bar with back, store profile chip, actions */}
            <div
              className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-4 pb-2 lg:hidden"
              style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
            >
              <Link
                href={marketplace ? "/products" : storeHref}
                aria-label={
                  marketplace
                    ? "Back to all products"
                    : `Back to ${design.storeName}`
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--pp-btn)] transition active:scale-90"
                style={roundBtn}
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <Link
                href={storeHref}
                aria-label={`Visit ${design.storeName}`}
                className="flex h-11 min-w-0 items-center gap-2 rounded-[var(--pp-btn)] py-1 pl-1 pr-3.5 transition active:scale-95"
                style={{
                  background: "rgba(255,255,255,.78)",
                  color: "#000",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                }}
              >
                <StoreAvatar design={design} size={34} />
                <span className="truncate text-sm font-semibold">
                  {design.storeName}
                </span>
                {design.showVerifiedBadge && (
                  <BadgeCheck
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--s-secondary)" }}
                  />
                )}
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                {design.showWishlist && (
                  <button
                    type="button"
                    aria-label={
                      wish ? "Remove from wishlist" : "Add to wishlist"
                    }
                    aria-pressed={wish}
                    onClick={() => toggleWishlistItem(slug, product.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-[var(--pp-btn)] transition active:scale-90"
                    style={
                      wish ? { background: "#ef4444", color: "#fff" } : roundBtn
                    }
                  >
                    <Heart
                      className="h-5 w-5"
                      fill={wish ? "currentColor" : "none"}
                    />
                  </button>
                )}
                {design.showCartIcon && (
                  <Link
                    href={`${storeHref}/cart`}
                    aria-label="Cart"
                    className="relative flex h-11 w-11 items-center justify-center rounded-[var(--pp-btn)] transition active:scale-90"
                    style={roundBtn}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {cart.count > 0 && (
                      <span
                        className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                        style={{
                          background: "var(--s-secondary)",
                          color: "var(--s-on-secondary)",
                        }}
                      >
                        {cart.count}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            </div>

            {/* Phone: thumbnails, placed by the layout (side, bottom edge or a row) */}
            {slides.length > 1 && !phone.stackAll && (
              <div
                className={cn(
                  "lg:hidden",
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
                    "flex gap-2 overflow-x-auto px-4 pt-3",
                )}
              >
                {slides.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={shownMain === i}
                    onClick={() => setMainImage(i)}
                    className={cn(
                      "relative shrink-0 overflow-hidden rounded-xl transition-all duration-200 active:scale-90",
                      phone.thumbs === "row" ? "h-14 w-14" : "h-12 w-12",
                    )}
                    style={{
                      background: "var(--s-surface)",
                      opacity: shownMain === i ? 1 : 0.7,
                      boxShadow:
                        shownMain === i
                          ? "0 0 0 2px var(--s-text)"
                          : "0 0 0 1px var(--s-border)",
                    }}
                  >
                    <ProductArt
                      product={artFor(url)}
                      emojiClassName="text-xl"
                      width={160}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Editorial: every photo stacked (phone and desktop), no thumbnails */}
            {editorial && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {slides.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className={cn(
                      "overflow-hidden",
                      i === 0
                        ? "aspect-[4/5] rounded-b-[32px] rounded-t-none lg:col-span-2 lg:aspect-[5/4] lg:rounded-[var(--pp-r)]"
                        : "mx-4 aspect-[4/5] rounded-[var(--pp-r)] lg:mx-0",
                    )}
                    style={{ background: "var(--s-surface)" }}
                  >
                    <ProductArt
                      product={artFor(url)}
                      emojiClassName="text-[120px]"
                      width={1200}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Desktop: thumbnails (row below, or a column on the left) */}
            {slides.length > 1 && !editorial && (
              <div
                className={cn(
                  "mt-4 hidden gap-3 lg:flex",
                  sideThumbs &&
                    "lg:mt-0 lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-y-auto",
                )}
                style={
                  sideThumbs ? { maxHeight: "min(720px, 82vh)" } : undefined
                }
              >
                {slides.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={shownMain === i}
                    onClick={() => setMainImage(i)}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl transition-all duration-200 hover:opacity-100 active:scale-95"
                    style={{
                      background: "var(--s-surface)",
                      opacity: shownMain === i ? 1 : 0.65,
                      boxShadow:
                        shownMain === i
                          ? "0 0 0 2px var(--s-text)"
                          : "0 0 0 1px var(--s-border)",
                    }}
                  >
                    <ProductArt
                      product={artFor(url)}
                      emojiClassName="text-2xl"
                      width={200}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section
            className={cn(
              "relative space-y-5 px-5 pb-4 lg:mt-0 lg:space-y-6 lg:rounded-none lg:p-0",
              phone.sheet ? "-mt-8 rounded-t-[32px] pt-6" : "mt-5 pt-0",
              editorial && "lg:sticky lg:top-[96px]",
            )}
            style={{ background: pageBg }}
          >
            <nav
              aria-label="Breadcrumb"
              className="hidden items-center gap-1.5 text-xs lg:flex"
              style={{ color: "var(--s-muted)" }}
            >
              <Link href={storeHref} className="hover:underline">
                Shop
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span
                className="max-w-[360px] truncate font-medium"
                style={{ color: "var(--s-text)" }}
              >
                {product.name}
              </span>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-[var(--pp-btn)] px-3 py-1 text-[11px] font-semibold"
                style={{ background: "var(--s-surface)" }}
              >
                {product.badge || "New arrival"}
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
              {soldOut && (
                <span
                  className="rounded-[var(--pp-btn)] px-3 py-1 text-[11px] font-bold"
                  style={roundBtn}
                >
                  Sold out
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                  {product.name}
                </h1>
                {showReviews && (
                  <div className="mt-2">
                    <AddReviewButton product={product.id} />
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-baseline gap-2.5 lg:mt-3">
                  <span className="text-2xl font-bold tracking-tight lg:text-3xl">
                    {formatPrice(price)}
                  </span>
                  {design.showComparePrice && onSale && (
                    <span
                      className="text-base line-through"
                      style={{ color: "var(--s-muted)" }}
                    >
                      {formatPrice(product.comparePrice as number)}
                    </span>
                  )}
                </div>
                {sku && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--s-muted)" }}
                  >
                    SKU: {sku}
                  </p>
                )}
              </div>

              {showReviews && (marketplace || design.showRatings) && (
                <a href="#customer-reviews">
                  <ReviewScore product={product.id} />
                </a>
              )}
            </div>

            {product.description && (
              <p
                className="text-sm leading-relaxed lg:max-w-[60ch] lg:text-[15px]"
                style={{ color: "var(--s-muted)" }}
              >
                {product.description}
              </p>
            )}

            {/* Real options from the seller. Products without variants show no pickers. */}
            {shownOptions.map((option) => (
              <OptionPicker
                key={option.id}
                option={option}
                selectedId={sel[option.id]}
                stateOf={(valueId) => {
                  // Judged against what the shopper has chosen so far, so
                  // options still work while the rest are unpicked.
                  const next = { ...sel, [option.id]: valueId };
                  const fits = (product.combinations ?? []).filter((c) =>
                    Object.entries(next).every(
                      ([oid, vid]) => c.valueIds[oid] === vid,
                    ),
                  );
                  if (fits.length === 0) return "unavailable";
                  return fits.some((c) => c.stock > 0)
                    ? "available"
                    : "soldout";
                }}
                onPick={(valueId) => pick(option.id, valueId)}
                accent={accent}
                accentOn={accentOn}
              />
            ))}

            {/* Desktop: divider before the buy box */}
            <div
              className="hidden h-px w-full lg:block"
              style={{ background: "var(--s-border)" }}
            />

            <div className="flex items-end justify-between gap-4">
              {design.showProductQuantity ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Qty</p>
                  <div
                    className="flex h-12 items-center rounded-[var(--pp-btn)] px-1"
                    style={{ background: "var(--s-surface)" }}
                  >
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="flex h-10 w-10 items-center justify-center rounded-[var(--pp-btn)] disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-9 text-center text-sm font-semibold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                      disabled={soldOut || qty >= maxQty}
                      className="flex h-10 w-10 items-center justify-center rounded-[var(--pp-btn)] disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {!soldOut && !needsSelection && stock <= LOW_STOCK && (
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--s-muted)" }}
                    >
                      Only {stock} left
                    </p>
                  )}
                </div>
              ) : (
                <span />
              )}

              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--s-muted)" }}>
                  Total price
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {formatPrice(price * qty)}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "fixed inset-x-0 bottom-0 z-40 px-4 pt-6 lg:static lg:!bg-none lg:p-0",
              )}
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                backgroundImage:
                  "linear-gradient(to top, var(--s-bg) 55%, transparent)",
              }}
            >
              {needPick && needsSelection && (
                <p
                  role="alert"
                  className="mx-auto mb-2 max-w-[1200px] text-center text-sm font-medium lg:text-left"
                  style={{ color: "#dc2626" }}
                >
                  Please select {missingOption?.name.toLowerCase()} first
                </p>
              )}
              <div className="mx-auto flex max-w-[1200px] items-center gap-2.5">
                <button
                  type="button"
                  disabled={!canBuy || added}
                  onClick={addToCart}
                  className={cn(
                    "sf-press flex h-14 flex-1 items-center justify-center gap-2 text-base font-semibold",
                    design.productButtonStyle !== "outline" &&
                      "shadow-lg lg:shadow-none",
                    !canBuy && "cursor-not-allowed opacity-50",
                  )}
                  style={buyButtonStyle(design, accent, accentOn)}
                >
                  {added ? (
                    <span className="sf-pop flex items-center gap-2">
                      <Check className="h-5 w-5" /> Added
                    </span>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      {paused
                        ? "Store paused"
                        : soldOut
                          ? label
                            ? `${label} is sold out`
                            : "Sold out"
                          : design.productButtonText.trim() || "Add to bag"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={handleBuyNow}
                  className={cn(
                    "sf-press flex h-14 flex-1 items-center justify-center gap-2 border-2 text-base font-semibold",
                    !canBuy && "cursor-not-allowed opacity-50",
                  )}
                  style={{
                    ...buyButtonStyle(design, accent, accentOn),
                    background: "var(--s-bg)",
                    color: accent,
                    borderColor: accent,
                    boxShadow: "none",
                  }}
                >
                  <Zap className="h-5 w-5" /> Buy now
                </button>
              </div>
            </div>

            {design.showProductTrustRow && (
              <div
                className="grid grid-cols-1 gap-3 rounded-[var(--pp-r)] p-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-4 lg:p-5 xl:grid-cols-3"
                style={{ background: "var(--s-surface)" }}
              >
                {(dCharges || design.deliveryNote) && (
                  <TrustItem
                    Icon={Truck}
                    title={dAllFree ? "Free delivery" : "Delivery"}
                    text={
                      dCharges && !dAllFree
                        ? dCharges.insideDhaka === dCharges.outsideDhaka
                          ? `${chargeText(dCharges.insideDhaka, formatPrice)} anywhere in Bangladesh`
                          : `${chargeText(dCharges.insideDhaka, formatPrice)} inside Dhaka · ${chargeText(dCharges.outsideDhaka, formatPrice)} outside`
                        : dAllFree
                          ? "On this product"
                          : design.deliveryNote || "Tracked to your door"
                    }
                  />
                )}
                {design.showReturnPolicy && design.returnPolicy.trim() && (
                  <TrustItem
                    Icon={RotateCcw}
                    title="Returns"
                    text={design.returnPolicy.trim()}
                  />
                )}
                {design.showPaymentBadges &&
                  design.paymentMethods.length > 0 && (
                    <TrustItem
                      Icon={ShieldCheck}
                      title="Secure payment"
                      text="100% secure checkout"
                    />
                  )}
              </div>
            )}

            {design.showProductTabs && tabs.length > 0 && (
              <div>
                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={activeTab === t.id}
                      onClick={() => setTab(t.id)}
                      className="shrink-0 whitespace-nowrap rounded-[var(--pp-btn)] px-4 py-2 text-xs font-semibold transition active:scale-95"
                      style={
                        activeTab === t.id
                          ? {
                              background: "var(--s-text)",
                              color: "var(--s-bg)",
                            }
                          : { background: "var(--s-surface)" }
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {activeTab === "specs" && (
                  <dl
                    key="specs"
                    className="sf-fade-in mt-4 divide-y text-sm"
                    style={{ borderColor: "var(--s-border)" }}
                  >
                    {attributes.map((a, i) => (
                      <div
                        key={`${a.key}-${i}`}
                        className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2.5"
                        style={{ borderColor: "var(--s-border)" }}
                      >
                        <dt style={{ color: "var(--s-muted)" }}>{a.key}</dt>
                        <dd className="font-medium">{a.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {activeTab === "shipping" && (
                  <ul
                    key="shipping"
                    className="sf-fade-in mt-4 space-y-2.5 text-sm"
                  >
                    {shippingPoints.map((t) => (
                      <Bullet key={t}>{t}</Bullet>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </main>
        {!reviewsAfterProducts && reviewSection}
        {hasRelated && (
          <section className="mx-auto w-full max-w-[1200px] px-4 pb-28 lg:px-8 lg:pb-16 lg:pt-6">
            <div className="mb-4 flex items-baseline justify-between lg:mb-6">
              <h2 className="text-xl font-bold tracking-tight lg:text-2xl">
                {design.productRelatedTitle.trim() || "You may also like"}
              </h2>
              <Link href={storeHref} className="text-xs font-semibold">
                See all
              </Link>
            </div>
            <StoreProductGrid
              design={design}
              products={related}
              categories={data?.categories ?? initialStore.categories}
            />
          </section>
        )}

        {reviewsAfterProducts && reviewSection}
        {!(!marketplace && design.showFooter) &&
          (!hasRelated || (reviewsAfterProducts && showReviews)) && (
            <div className="h-24 lg:hidden" aria-hidden="true" />
          )}
        {!marketplace && design.showFooter && (
          <footer
            className="px-6 py-7 pb-28 text-center text-xs lg:pb-7"
            style={{ color: "var(--s-muted)" }}
          >
            © {new Date().getFullYear()} {design.storeName}. Powered by ShopBD.
          </footer>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Option picker (colors as swatches, everything else as pills)        */
/* ================================================================== */

function OptionPicker({
  option,
  selectedId,
  stateOf,
  onPick,
  accent,
  accentOn,
}: {
  option: ProductOption;
  selectedId: string | undefined;
  stateOf: (valueId: string) => "available" | "soldout" | "unavailable";
  onPick: (valueId: string) => void;
  accent: string;
  accentOn: string;
}) {
  const current = option.values.find((v) => v.id === selectedId);
  const color = isColorName(option.name);

  return (
    <div className="space-y-2.5">
      <p className="text-sm">
        <span className="font-semibold">{option.name}</span>{" "}
        <span style={{ color: "var(--s-muted)" }}>{current?.label}</span>
      </p>
      <div
        className="flex flex-wrap gap-2.5"
        role="group"
        aria-label={option.name}
      >
        {option.values.map((v) => {
          const on = v.id === selectedId;
          const state = stateOf(v.id);
          const dim = state !== "available";
          const note =
            state === "soldout"
              ? " (sold out)"
              : state === "unavailable"
                ? " (unavailable)"
                : "";

          if (color && v.colorHex) {
            return (
              <button
                key={v.id}
                type="button"
                aria-label={`${v.label}${note}`}
                aria-pressed={on}
                title={`${v.label}${note}`}
                onClick={() => onPick(v.id)}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-[var(--pp-btn)] transition active:scale-90",
                  dim && !on && "opacity-40",
                )}
                style={{
                  background: v.colorHex,
                  boxShadow: on
                    ? "0 0 0 2px var(--s-bg), 0 0 0 3.5px var(--s-text)"
                    : "0 0 0 1px var(--s-border)",
                }}
              >
                {on && (
                  <Check
                    className="h-4 w-4"
                    style={{ color: readableOn(v.colorHex) }}
                  />
                )}
                {dim && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute h-px w-[130%] -rotate-45"
                    style={{ background: "var(--s-text)" }}
                  />
                )}
              </button>
            );
          }

          return (
            <button
              key={v.id}
              type="button"
              aria-label={`${v.label}${note}`}
              aria-pressed={on}
              title={`${v.label}${note}`}
              onClick={() => onPick(v.id)}
              className={cn(
                "flex h-12 min-w-12 items-center justify-center rounded-[var(--pp-btn)] px-4 text-sm font-semibold transition-all duration-200 active:scale-90",
                dim && !on && "line-through opacity-50",
              )}
              style={
                on
                  ? { background: accent, color: accentOn }
                  : { background: "var(--s-surface)" }
              }
            >
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StoreAvatar({ design, size }: { design: StoreDesign; size: number }) {
  const initial = (design.storeName || "S").trim().charAt(0).toUpperCase();
  return design.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={design.logoUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: "var(--s-primary)",
        color: "var(--s-on-primary)",
      }}
    >
      {initial}
    </span>
  );
}

function TrustItem({
  Icon,
  title,
  text,
}: {
  Icon: typeof Truck;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--pp-btn)]"
        style={{ background: "var(--s-text)", color: "var(--s-bg)" }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold leading-tight">{title}</p>
        <p
          className="line-clamp-2 text-[11px] leading-tight"
          style={{ color: "var(--s-muted)" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{ background: "var(--s-surface)" }}
      >
        <Check className="h-3 w-3" />
      </span>
      <span>{children}</span>
    </li>
  );
}
