"use client";

import { usesDropLayout, usesYokaiLayout } from "@/lib/store-design/types";
import { templatePageLayout } from "@/lib/store-design/template-page-layout";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MessageCircle, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadFont, radiusPx, themeVars } from "@/lib/store-design/utilts";
import { CartProvider, useHasCartProvider } from "@/lib/store-design/cart";
import { ProductsListing } from "./all-products";
import { useStoreElementWidth } from "./balanced-grid";
import { CartSheet } from "./cart-sheet";
import { SideNav, TopBar } from "./dashboard-shell";
import { Footer } from "./footer";
import {
  EditorialHeader,
  HeaderNav,
  StreetHeader,
  TopNavHeader,
  YokaiHeader,
} from "./headers";
import { useIsMobile, useWide } from "./hooks";
import { MobileDock, MobileTop } from "./mobile-nav";
import { RightRail } from "./right-rail";
import { SectionRenderer } from "./section-renderer";
import { StoreSkeleton } from "./skeleton";
import { StoreHero } from "./store-hero";
import { TemplatePageSections } from "./template-rows";
import { isPookie, PookieStyles, pookiePageBackground } from "./pookie-theme";
import { CTA_BG, SHELL_CLASS, SHELL_GAP, shellOf } from "./tokens";
import { FeedHead } from "./trust-bar";
import { type Ctx, type PreviewProps } from "./types";

export function LiveStorePreview(props: PreviewProps) {
  // On real storefront routes the layout already provides the cart. A second
  // provider here kept its own copy of the lines, so the header badge and the
  // product page could disagree. Only the editor preview needs its own.
  const hasCart = useHasCartProvider();
  const inner = <LiveStorePreviewInner {...props} />;
  if (hasCart) return inner;
  return (
    <CartProvider slug={props.design.storeSlug || "preview"}>
      {inner}
    </CartProvider>
  );
}
function LiveStorePreviewInner({
  design: d,
  products,
  categories,
  device,
  verified = true,
  interactive = false,
  loading = false,
  activeTab = "shop",
  tabContent,
  looksSlot,
  page = "home",
  initialCategory,
}: PreviewProps) {
  const mobile = useIsMobile(interactive, device === "mobile");
  const wide = useWide(interactive);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isListing = page === "products";
  useEffect(() => loadFont(d.fontFamily), [d.fontFamily]);

  const openCart = useCallback(() => setCartOpen(true), []);

  const scopedDesign = useMemo(() => {
    if (!interactive) return d;
    const storeBase = `/store/${d.storeSlug}`;
    const mapped = (d.navLinks ?? []).map((l) => {
      const label = (l.label || "").trim().toLowerCase();
      const url = (l.url || "").trim();
      if (
        /^(shop|store|home)$/.test(label) ||
        url === "/products" ||
        url === "/shop" ||
        url === "/" ||
        url === ""
      ) {
        return { ...l, url: storeBase };
      }
      if (/^(https?:|mailto:|tel:|#)/.test(url) || url.startsWith("/store/")) {
        return { ...l, url };
      }
      return { ...l, url: `${storeBase}${url}` };
    });
    const seen = new Set<string>();
    const deduped = mapped.filter((l) => {
      if (seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });
    const wanted = [
      { id: "nav-about-force", label: "About", url: `${storeBase}/about` },
      {
        id: "nav-contact-force",
        label: "Contact",
        url: `${storeBase}/contact`,
      },
      ...(d.showWishlist
        ? [
            {
              id: "nav-wishlist-force",
              label: "Wishlist",
              url: `${storeBase}/wishlist`,
            },
          ]
        : []),
    ];
    const existing = new Set(deduped.map((l) => l.url));
    return {
      ...d,
      navLinks: [...deduped, ...wanted.filter((w) => !existing.has(w.url))],
    };
  }, [d, interactive]);

  const ctx = useMemo<Ctx>(
    () => ({
      d: scopedDesign,
      mobile,
      radius: radiusPx[d.buttonRadius],
      products,
      categories,
      verified,
      interactive,
      openCart: interactive ? openCart : undefined,
      searchQuery,
      setSearchQuery,
    }),
    [
      scopedDesign,
      mobile,
      d.buttonRadius,
      products,
      categories,
      verified,
      interactive,
      openCart,
      searchQuery,
    ],
  );

  const pageLayout = templatePageLayout(d.template);
  const pookie = isPookie(d);
  const pookieBg = pookiePageBackground(d);
  const pageFrameRef = useRef<HTMLDivElement>(null);
  const pageFrameWidth = useStoreElementWidth(
    pageFrameRef,
    1280,
    !!pageLayout && !mobile,
  );

  const sections = useMemo(
    () => d.sections.filter((s) => s.enabled),
    [d.sections],
  );

  const notices = (
    <>
      {d.vacationMode && (
        <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2.5 text-center text-xs font-medium text-amber-950">
          <Moon className="h-4 w-4 shrink-0" />
          <span>
            {d.vacationMessage || "This store is taking a short break."}
          </span>
        </div>
      )}
      {d.announcementEnabled && d.announcementText && (
        <div
          className={cn(
            "px-4 py-2 text-center",
            usesDropLayout(d)
              ? "text-[11px] font-medium uppercase tracking-[0.16em]"
              : "text-xs font-semibold",
          )}
          style={{ background: CTA_BG, color: "var(--s-on-primary)" }}
        >
          {d.announcementText}
        </div>
      )}
    </>
  );

  const feed = (
    <main
      id="store-feed"
      className={cn(
        "flex min-w-0 scroll-mt-4 flex-col",
        mobile ? "pb-2 pt-6" : "pt-4",
      )}
    >
      {loading ? (
        <StoreSkeleton ctx={ctx} />
      ) : (
        <div
          key={isListing ? "products" : activeTab}
          className="storefront-tab flex min-w-0 flex-col"
          style={{ gap: "var(--sf-section)" }}
        >
          {tabContent ??
            (isListing ? (
              <ProductsListing ctx={ctx} initialCategory={initialCategory} />
            ) : (
              <>
                {usesYokaiLayout(d) ? (
                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-x-6 gap-y-4",
                      ["centered", "editorial", "framed", "spotlight"].includes(
                        d.headerStyle,
                      )
                        ? "flex-col-reverse"
                        : "justify-between",
                    )}
                  >
                    <FeedHead ctx={ctx} />
                    <StoreHero ctx={ctx} slim />
                  </div>
                ) : (
                  <FeedHead ctx={ctx} />
                )}
                {pageLayout ? (
                  <TemplatePageSections
                    ctx={ctx}
                    sections={sections}
                    plan={pageLayout}
                  />
                ) : (
                  sections.map((s) => (
                    <SectionRenderer key={s.id} section={s} ctx={ctx} />
                  ))
                )}
                {looksSlot}
              </>
            ))}
        </div>
      )}
    </main>
  );

  const shell = shellOf(d);
  const gap = SHELL_GAP[shell];
  const rootStyle: CSSProperties = {
    ...themeVars(d),
    ...(gap
      ? ({ "--sf-section": mobile ? gap[0] : gap[1] } as CSSProperties)
      : null),
  };

  const showFab = d.whatsappEnabled && d.whatsappNumber && !loading;

  const fab = showFab && (
    <a
      href={
        interactive
          ? `https://wa.me/${d.whatsappNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(d.whatsappMessage || "")}`
          : undefined
      }
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={cn(
        "sticky z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform duration-150 active:scale-90",
        mobile ? "mb-2 ml-auto mr-5 -mt-4" : "fixed bottom-6 right-6",
      )}
      style={{ background: "#25D366" }}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );

  const cartSheet = interactive && (
    <CartSheet
      open={cartOpen}
      onOpenChange={setCartOpen}
      design={scopedDesign}
      interactive={interactive}
    />
  );

  if (mobile) {
    return (
      <div
        style={rootStyle}
        className={cn(
          "storefront text-[15px] leading-normal",
          SHELL_CLASS[shell],
        )}
        data-pookie={pookie ? "" : undefined}
      >
        {pookie && <PookieStyles />}
        <div
          data-pookie-page={pookie ? "" : undefined}
          style={{
            background: "var(--s-bg)",
            color: "var(--s-text)",
            ...pookieBg,
          }}
        >
          {notices}
          <div className="relative">
            <MobileTop ctx={ctx} />
            {tabContent || isListing ? (
              <div className="h-20" />
            ) : usesYokaiLayout(d) ? null : (
              <StoreHero ctx={ctx} />
            )}
          </div>
          {feed}
          {d.showFooter ? <Footer ctx={ctx} /> : <div className="h-24" />}
          <MobileDock ctx={ctx} />
        </div>
        {fab}
        {cartSheet}
      </div>
    );
  }

  if (pageLayout) {
    const rail = !!pageLayout.cartRail && wide && pageFrameWidth >= 1460;
    const side = pageLayout.navigation !== "top";
    const profile = (
      <div className="flex min-w-0 flex-col gap-5">
        <TopBar ctx={ctx} rail={rail} />
        {!tabContent && !isListing && !loading && <StoreHero ctx={ctx} />}
      </div>
    );
    const navigation = <HeaderNav ctx={ctx} variant="text" />;
    const body = (
      <div
        className="flex min-w-0 flex-col"
        style={{ gap: Math.min(20, pageLayout.gap / 2) }}
      >
        {pageLayout.profile === "inside" && profile}
        {feed}
      </div>
    );
    const tracks = side
      ? pageLayout.navigation === "left"
        ? `${pageLayout.sidebar}px minmax(0, 1fr)${rail ? " 288px" : ""}`
        : `minmax(0, 1fr) ${pageLayout.sidebar}px`
      : "minmax(0, 1fr)";
    return (
      <div
        style={rootStyle}
        className="storefront text-[15px] leading-normal"
        data-template-page={d.template}
        data-pookie={pookie ? "" : undefined}
      >
        {pookie && <PookieStyles />}
        <div
          className="min-h-screen w-full"
          data-pookie-page={pookie ? "" : undefined}
          style={{
            background: "var(--s-bg)",
            color: "var(--s-text)",
            ...pookieBg,
          }}
        >
          {notices}
          <div
            ref={pageFrameRef}
            className="mx-auto w-full px-6 pb-12 pt-6"
            style={{ maxWidth: pageLayout.width }}
          >
            {pageLayout.profile === "above" && (
              <div style={{ marginBottom: Math.min(24, pageLayout.gap / 2) }}>
                {profile}
              </div>
            )}
            {!side && (
              <div
                className={cn(
                  "mb-6 z-30 overflow-x-auto border-b py-3",
                  d.stickyHeader && "sticky top-0",
                )}
                style={{
                  borderColor: "var(--s-border)",
                  background: "var(--s-bg)",
                }}
              >
                {navigation}
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: tracks,
                gap: Math.min(pageLayout.gap, 28),
                alignItems: "start",
              }}
            >
              {side && pageLayout.navigation === "left" && (
                <SideNav ctx={ctx} />
              )}
              {body}
              {side && pageLayout.navigation === "right" && (
                <SideNav ctx={ctx} />
              )}
              {rail && <RightRail ctx={ctx} />}
            </div>
          </div>
          {d.showFooter && <Footer ctx={ctx} />}
        </div>
        {fab}
        {cartSheet}
      </div>
    );
  }

  if (shell !== "dashboard") {
    const Header =
      shell === "editorial"
        ? EditorialHeader
        : shell === "street"
          ? usesYokaiLayout(d)
            ? YokaiHeader
            : StreetHeader
          : TopNavHeader;
    return (
      <div
        style={rootStyle}
        className={cn(
          "storefront text-[15px] leading-normal",
          SHELL_CLASS[shell],
        )}
      >
        <div
          className="min-h-screen w-full"
          style={{ background: "var(--s-bg)", color: "var(--s-text)" }}
        >
          {notices}
          <Header ctx={ctx} />
          <div
            className={cn(
              "mx-auto w-full px-6 pb-12 pt-6",
              shell === "editorial"
                ? "max-w-[1120px]"
                : shell === "street"
                  ? "max-w-[1440px]"
                  : "max-w-[1240px]",
            )}
          >
            {!tabContent && !isListing && !loading && shell !== "street" && (
              <StoreHero ctx={ctx} />
            )}
            {feed}
          </div>
          {d.showFooter && <Footer ctx={ctx} />}
        </div>
        {fab}
        {cartSheet}
      </div>
    );
  }

  return (
    <div style={rootStyle} className="storefront text-[15px] leading-normal">
      <div
        className="min-h-screen w-full"
        style={{
          background: "color-mix(in srgb, var(--s-surface) 70%, var(--s-bg))",
          color: "var(--s-text)",
        }}
      >
        {notices}
        <div
          className="mx-auto grid w-full max-w-[1680px] items-start gap-5 p-5"
          style={{
            gridTemplateColumns: wide
              ? "232px minmax(0, 1fr) 320px"
              : "232px minmax(0, 1fr)",
          }}
        >
          <SideNav ctx={ctx} />
          <div className="flex min-w-0 flex-col gap-5">
            <TopBar ctx={ctx} rail={wide} />
            {!tabContent && !isListing && !loading && <StoreHero ctx={ctx} />}
            {feed}
          </div>
          {wide && <RightRail ctx={ctx} />}
        </div>
        {d.showFooter && <Footer ctx={ctx} />}
      </div>
      {fab}
      {cartSheet}
    </div>
  );
}
