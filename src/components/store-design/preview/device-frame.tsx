"use client";

import { AboutContent } from "@/app/(storefront)/store/[slug]/_components/AboutContent";
import { ContactContent } from "@/app/(storefront)/store/[slug]/_components/ContactContent";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  normalizeHex,
  radiusPx,
  readableOn,
  themeVars,
} from "@/lib/store-design/utilts";
import { PreviewNavigation } from "./blocks";
import { LiveStorePreview } from "./live-preview";
import { MobileDock } from "./mobile-nav";
import { ProductPagePreview } from "./product-page-preview";
import { type PreviewProps } from "./types";

/* ------------------------------------------------------------------ */
/* Device frame (used by the editor preview)                           */
/* ------------------------------------------------------------------ */

const MAX_SCALE = 1.2;
function ScaledFrame({
  baseWidth,
  children,
}: {
  baseWidth: number;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ w: 0, h: 0, scale: 1 });

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    const measure = () => {
      const w = wrap.clientWidth;
      const h = inner.offsetHeight;
      if (!w || !h) return;
      const scale = Math.min(MAX_SCALE, w / baseWidth);
      setM((prev) =>
        prev.w === w && prev.h === h && prev.scale === scale
          ? prev
          : { w, h, scale },
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(inner);
    const t1 = window.setTimeout(measure, 200);
    const t2 = window.setTimeout(measure, 800);
    return () => {
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [baseWidth]);

  const left = Math.max(0, (m.w - baseWidth * m.scale) / 2);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden"
      style={{ height: m.h * m.scale || undefined }}
    >
      <div
        ref={innerRef}
        style={{
          width: baseWidth,
          marginLeft: left,
          transform: `scale(${m.scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
/** Real iPhone proportions (screen 390x844 + 10px bezel). */
const PHONE_W = 410;
const PHONE_H = 864;
/**
 * Keeps the phone at its true shape. It is built at a fixed size and scaled
 * down (never stretched) to fit the panel, centered.
 */
function PhoneFit({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale =
    box.w && box.h ? Math.min(1, box.w / PHONE_W, box.h / PHONE_H) : 0;

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">
      <div
        style={{
          position: "absolute",
          width: PHONE_W,
          height: PHONE_H,
          left: (box.w - PHONE_W * scale) / 2,
          top: (box.h - PHONE_H * scale) / 2,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
export function StorePreviewViewport({
  className,
  chrome = true,
  reviewPreview = false,
  onReviewPreviewChange,
  mode = "storefront",
  loading = false,
  ...props
}: PreviewProps & {
  className?: string;
  chrome?: boolean;
  reviewPreview?: boolean;
  onReviewPreviewChange?: (value: boolean) => void;
  mode?: "storefront" | "product" | "about" | "contact";
}) {
  const { design, device, products } = props;
  const mobile = device === "mobile";

  const browsing = mobile && mode !== "product";
  const [previewPath, setPreviewPath] = useState("home");
  const [previewCategory, setPreviewCategory] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useCallback(
    (href: string) => {
      const base = `/store/${design.storeSlug}`;
      const url = new URL(href || base, "https://preview.invalid");
      if (url.origin !== "https://preview.invalid") {
        setPreviewPath("unavailable");
        return;
      }
      const path =
        url.pathname === base
          ? "home"
          : url.pathname.startsWith(base + "/")
            ? url.pathname.slice(base.length + 1)
            : url.pathname.replace(/^\//, "") || "home";
      setPreviewPath(path === "shop" ? "products" : path);
      setPreviewCategory(url.searchParams.get("category") || "");
    },
    [design.storeSlug],
  );
  useEffect(() => {
    setPreviewPath(mode === "about" || mode === "contact" ? mode : "home");
    setPreviewCategory("");
  }, [design.template, design.storeSlug, mode]);
  useEffect(() => {
    const frame = scrollRef.current;
    if (!frame) return;
    if (mode !== "product" || !reviewPreview) {
      frame.scrollTo({ top: 0 });
      return;
    }
    if (loading || design.showProductReviews === false) return;
    const animation = requestAnimationFrame(() => {
      const section = frame.querySelector("[data-product-reviews]");
      if (!section) return;
      const offset =
        section.getBoundingClientRect().top - frame.getBoundingClientRect().top;
      // Keep the preceding product details visible above the reviews.
      frame.scrollTo({
        top: Math.max(0, frame.scrollTop + offset - frame.clientHeight * 0.23),
      });
    });
    return () => cancelAnimationFrame(animation);
  }, [
    previewPath,
    previewCategory,
    mode,
    reviewPreview,
    loading,
    design.showProductReviews,
    design.productReviewPosition,
  ]);
  const previewBase = `/store/${design.storeSlug}`;
  const routeButton = (label: string, href: string) => (
    <button
      key={href}
      type="button"
      onClick={() => navigate(href)}
      className="flex min-h-12 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-medium text-neutral-900"
    >
      {label}
      <ChevronRight className="h-4 w-4" />
    </button>
  );
  const previewPage =
    previewPath === "categories" ? (
      <section className="space-y-3 p-5">
        <h2 className="text-xl font-semibold">Categories</h2>
        {props.categories.length ? (
          props.categories.map((category) =>
            routeButton(
              category.name,
              `${previewBase}/products?category=${encodeURIComponent(category.id)}`,
            ),
          )
        ) : (
          <p>No categories yet.</p>
        )}
      </section>
    ) : previewPath === "menu" ? (
      <section className="space-y-3 p-5">
        <h2 className="text-xl font-semibold">Menu</h2>
        {routeButton("Home", previewBase)}
        {routeButton("Shop all products", `${previewBase}/products`)}
        {routeButton("Categories", `${previewBase}/categories`)}
        {routeButton("About", `${previewBase}/about`)}
        {routeButton("Contact", `${previewBase}/contact`)}
      </section>
    ) : previewPath === "about" || previewPath === "contact" ? (
      <LiveStorePreview
        {...props}
        hideFab
        interactive={false}
        loading={loading}
        activeTab={previewPath === "about" ? "about" : "contact"}
        tabContent={
          previewPath === "about" ? (
            <AboutContent design={design} mobile={mobile} />
          ) : (
            <ContactContent design={design} mobile={mobile} preview />
          )
        }
      />
    ) : previewPath.startsWith("products/") ? (
      <ProductPagePreview
        design={design}
        device={device}
        products={products.filter(
          (product) => product.id === previewPath.slice(9),
        )}
        loading={loading}
      />
    ) : previewPath !== "home" && previewPath !== "products" ? (
      <section className="space-y-4 p-5">
        <h2 className="text-xl font-semibold">Store preview</h2>
        <p>This action is available on your published store.</p>
        {routeButton("Continue browsing", `${previewBase}/products`)}
      </section>
    ) : (
      <>
        <LiveStorePreview
          {...props}
          hideFab
          key={previewPath + previewCategory}
          interactive={false}
          loading={loading}
          products={products}
          page={previewPath === "products" ? "products" : "home"}
          initialCategory={previewCategory || undefined}
        />
      </>
    );
  // WhatsApp button. Inside the scaled frame `fixed`/`sticky` cannot track the
  // visible area, so it is drawn here, over the scroll area (above the dock).
  const showFab =
    !!design.whatsappEnabled &&
    !!design.whatsappNumber &&
    !loading &&
    mode !== "product" &&
    !previewPath.startsWith("products/");
  const fab = showFab && (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute bottom-4 right-4 z-30 flex items-center justify-center rounded-full text-white shadow-xl",
        mobile ? "h-14 w-14" : "h-11 w-11",
      )}
      style={{ background: "#25D366" }}
    >
      <MessageCircle className={mobile ? "h-6 w-6" : "h-5 w-5"} />
    </span>
  );
  const screen = (
    <PreviewNavigation.Provider value={browsing ? navigate : null}>
      <div
        className="relative flex h-full min-h-0 flex-col"
        style={{
          ...themeVars(design),
          background: design.bgColor,
          color: design.textColor,
        }}
      >
        {mode === "product" && onReviewPreviewChange && (
          <nav
            aria-label="Product preview"
            className="flex shrink-0 gap-1 border-b bg-white p-2 text-sm text-slate-800"
          >
            {(["Product details", "Reviews"] as const).map((label) => (
              <button
                type="button"
                key={label}
                aria-pressed={reviewPreview === (label === "Reviews")}
                className="rounded-lg px-3 py-1.5 font-medium aria-pressed:bg-slate-900 aria-pressed:text-white"
                onClick={() => onReviewPreviewChange(label === "Reviews")}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
          >
            <ScaledFrame baseWidth={mobile ? 390 : 1280}>
              <div
                className={
                  browsing ? "select-none" : "pointer-events-none select-none"
                }
                onClickCapture={
                  browsing
                    ? (event) => {
                        const anchor = (event.target as Element).closest(
                          "a[href]",
                        );
                        if (!anchor) return;
                        event.preventDefault();
                        event.stopPropagation();
                        navigate(anchor.getAttribute("href") || "");
                      }
                    : undefined
                }
                onSubmitCapture={
                  browsing
                    ? (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    : undefined
                }
              >
                {mode === "product" ? (
                  <ProductPagePreview
                    design={design}
                    products={products}
                    device={device}
                    loading={loading}
                  />
                ) : browsing || mode === "about" || mode === "contact" ? (
                  previewPage
                ) : (
                  <LiveStorePreview
                    {...props}
                    hideFab
                    interactive={false}
                    loading={loading}
                  />
                )}
              </div>
            </ScaledFrame>
          </div>
          {fab}
        </div>
        {browsing && (
          <div className="shrink-0" style={themeVars(design)}>
            <MobileDock
              inPreviewFrame
              previewPath={
                previewPath === "home"
                  ? previewBase
                  : `${previewBase}/${previewPath}`
              }
              ctx={{
                d: design,
                mobile: true,
                radius: radiusPx[design.buttonRadius],
                products,
                categories: props.categories,
                verified: props.verified ?? true,
                interactive: false,
              }}
            />
          </div>
        )}
      </div>
    </PreviewNavigation.Provider>
  );

  if (!chrome) {
    return <div className={cn("h-full", className)}>{screen}</div>;
  }

  if (mobile) {
    // iPhone frame: black bezel, dynamic island, status bar, home indicator.
    // The status bar and home-indicator rows take the store's background so
    // the phone blends with the seller's theme.
    const bg = normalizeHex(design.bgColor ?? "", "#ffffff");
    const ink = readableOn(bg);
    return (
      <div className={cn("h-full", className)}>
        <PhoneFit>
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[56px] border-[10px] border-[#1c1c1e] bg-white shadow-[0_0_0_1px_#2c2c2e,0_40px_80px_rgba(0,0,0,0.35),0_20px_40px_rgba(0,0,0,0.15)]">
            {/* Dynamic island */}
            <span className="pointer-events-none absolute left-1/2 top-[11px] z-20 h-[34px] w-[120px] -translate-x-1/2 rounded-[20px] bg-black" />

            {/* Status bar */}
            <div
              className="flex h-[54px] shrink-0 items-end justify-between px-7 pb-2 text-[15px] font-semibold"
              style={{ background: bg, color: ink }}
            >
              <span className="tabular-nums tracking-[0.3px]">9:41</span>
              <span className="flex items-center gap-1.5">
                <svg
                  width="17"
                  height="11"
                  viewBox="0 0 17 11"
                  fill="currentColor"
                  aria-hidden
                >
                  <rect x="0" y="7" width="3" height="4" rx="0.5" />
                  <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
                  <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" />
                  <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
                </svg>
                <svg
                  width="15"
                  height="11"
                  viewBox="0 0 15 11"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M7.5 0C4.6 0 1.9 1.1 0 2.9l1.4 1.4C2.9 2.9 5.1 2 7.5 2s4.6.9 6.1 2.3L15 2.9C13.1 1.1 10.4 0 7.5 0zm0 4C5.7 4 4 4.7 2.7 5.9l1.4 1.4C5.1 6.4 6.3 6 7.5 6s2.4.4 3.4 1.3l1.4-1.4C11 4.7 9.3 4 7.5 4zm0 4C6.7 8 6 8.3 5.4 8.9L7.5 11l2.1-2.1C9 8.3 8.3 8 7.5 8z" />
                </svg>
                <svg
                  width="27"
                  height="13"
                  viewBox="0 0 27 13"
                  fill="none"
                  aria-hidden
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="22"
                    height="12"
                    rx="3"
                    stroke="currentColor"
                    opacity="0.4"
                  />
                  <rect
                    x="2"
                    y="2"
                    width="19"
                    height="9"
                    rx="1.5"
                    fill="currentColor"
                  />
                  <rect
                    x="24"
                    y="4"
                    width="2"
                    height="5"
                    rx="1"
                    fill="currentColor"
                    opacity="0.4"
                  />
                </svg>
              </span>
            </div>

            {/* Store preview */}
            <div className="min-h-0 flex-1 overflow-hidden bg-white">
              {screen}
            </div>

            {/* Home indicator */}
            <div
              className="flex h-6 shrink-0 items-center justify-center"
              style={{ background: bg }}
            >
              <span
                className="h-[5px] w-[134px] rounded-[3px]"
                style={{ background: ink }}
              />
            </div>
          </div>
        </PhoneFit>
      </div>
    );
  }

  return (
    <div className={cn("h-full", className)}>
      <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b bg-neutral-100 px-3 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-[11px] text-neutral-500">
            shopbd.com/store/{design.storeSlug || "your-store"}
            {mode === "product" ? "/products/1" : ""}
          </div>
          <span className="w-10" />
        </div>
        <div className="min-h-0 flex-1">{screen}</div>
      </div>
    </div>
  );
}
