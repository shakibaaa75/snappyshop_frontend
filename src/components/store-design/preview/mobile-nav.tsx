"use client";

import {
  type CSSProperties,
  memo,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Heart,
  Home,
  LayoutGrid,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import {
  formatPrice,
  normalizeHex,
  readableOn,
} from "@/lib/store-design/utilts";
import { useCart } from "@/lib/store-design/cart";
import { Badge, Link, PreviewNavigation } from "./blocks";
import { searchStoreProducts } from "./search";
import { SearchField } from "./search-field";
import { GLASS, INK, muted } from "./tokens";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export function isActive(pathname: string, base: string, url: string) {
  if (!url) return false;
  if (url === base) return pathname === base || pathname === `${base}/`;
  return pathname === url || pathname.startsWith(url + "/");
}
const IconBtn = "sf-icon-btn";
export const MobileTop = memo(function MobileTop({ ctx }: { ctx: Ctx }) {
  const { d, interactive, openCart } = ctx;
  const cart = useCart();
  const base = `/store/${d.storeSlug}`;
  const count = interactive ? cart.count : 2;
  const btn =
    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-sm";
  const topSurface: CSSProperties = {
    background: normalizeHex(d.bgColor, "#ffffff"),
    color: readableOn(normalizeHex(d.bgColor, "#ffffff")),
    borderColor: "var(--s-border)",
  };
  return (
    <header
      className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-4 pb-2"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="min-w-0 flex-1">
        <SearchField ctx={ctx} compact mobileHeader />
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {d.showCartIcon &&
          (interactive && openCart ? (
            <button
              type="button"
              onClick={openCart}
              title="Cart"
              aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
              className={btn}
              style={topSurface}
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && <Badge n={count} />}
            </button>
          ) : (
            <Link
              on={interactive}
              href={`${base}/cart`}
              title="Cart"
              className={btn}
              style={topSurface}
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && <Badge n={count} />}
            </Link>
          ))}
        {d.showWishlist && (
          <Link
            on={interactive}
            href={`${base}/wishlist`}
            title="Wishlist"
            className={btn}
            style={topSurface}
          >
            <Heart className="h-[18px] w-[18px]" />
          </Link>
        )}
      </div>
    </header>
  );
});
export const MobileDock = memo(function MobileDock({
  ctx,
  inPreviewFrame = false,
  previewPath,
}: {
  ctx: Ctx;
  inPreviewFrame?: boolean;
  previewPath?: string;
}) {
  const previewNavigate = useContext(PreviewNavigation);
  const { d, products, interactive, openCart } = ctx;
  const cart = useCart();
  const realPathname = usePathname() ?? "";
  const pathname = previewPath ?? realPathname;
  const enabled = interactive || inPreviewFrame;
  const base = `/store/${d.storeSlug}`;

  const [panel, setPanel] = useState<"categories" | "menu" | null>(null);
  const dockRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  const closePanel = () => setPanel(null);
  useEffect(() => {
    setPanel(null);
    setSearching(false);
    setQ("");
  }, [pathname]);
  useEffect(() => {
    if (!panel) return;
    document
      .getElementById(panelId)
      ?.querySelector<HTMLButtonElement>("button")
      ?.focus();
    const outside = (event: PointerEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) setPanel(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [panel, panelId]);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searching) inputRef.current?.focus();
  }, [searching]);

  useEffect(() => {
    if (!enabled) return;
    const showSearch = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== d.storeSlug) return;
      setPanel(null);
      setSearching(true);
    };
    window.addEventListener("store:open-search", showSearch);
    return () => window.removeEventListener("store:open-search", showSearch);
  }, [enabled, d.storeSlug]);

  const term = q.trim();
  const results = useMemo(
    () => searchStoreProducts(products, ctx.categories, term, 6),
    [products, ctx.categories, term],
  );

  const closeSearch = () => {
    setSearching(false);
    setQ("");
  };

  type DockItem = {
    label: string;
    href?: string;
    Icon: typeof Home;
    badge: number;
    onClick?: () => void;
  };
  const items: DockItem[] = [
    { label: "Home", href: base, Icon: Home, badge: 0 },
    { label: "Shop", href: `${base}/products`, Icon: ShoppingBag, badge: 0 },
    {
      label: "Categories",
      Icon: LayoutGrid,
      badge: 0,
      onClick: () =>
        enabled &&
        setPanel((value) => (value === "categories" ? null : "categories")),
    },
    {
      label: "Menu",
      Icon: Menu,
      badge: 0,
      onClick: () =>
        enabled && setPanel((value) => (value === "menu" ? null : "menu")),
    },
  ];
  const menuLinks = [
    ...(d.showWishlist ? [{ label: "Wishlist", url: `${base}/wishlist` }] : []),
    { label: "About", url: `${base}/about` },
    { label: "Contact", url: `${base}/contact` },
    ...(d.navLinks ?? []).filter(
      (link) =>
        ![
          base,
          `${base}/products`,
          `${base}/about`,
          `${base}/contact`,
          `${base}/wishlist`,
        ].includes(link.url),
    ),
  ].filter(
    (link, index, links) =>
      links.findIndex((other) => other.url === link.url) === index,
  );

  const dockShell: CSSProperties = {
    ...GLASS,
    boxShadow: "var(--sf-shadow-md)",
  };

  if (previewNavigate && !inPreviewFrame) return null;

  return (
    <>
      {interactive && !inPreviewFrame && (
        <div className="h-24" aria-hidden="true" />
      )}
      <nav
        ref={dockRef}
        aria-label="Store navigation"
        className={cn(
          "inset-x-0 bottom-0 z-40 flex justify-center px-3",
          inPreviewFrame
            ? "relative shrink-0"
            : interactive
              ? "fixed"
              : "sticky",
        )}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {panel && enabled && (
          <section
            id={panelId}
            aria-label={
              panel === "categories" ? "Store categories" : "Store menu"
            }
            className="absolute inset-x-3 bottom-[calc(100%+8px)] mx-auto flex max-h-[65dvh] max-w-md flex-col overflow-hidden rounded-3xl border shadow-xl"
            style={{
              background: "var(--s-bg)",
              color: "var(--s-text)",
              borderColor: "var(--s-border)",
            }}
          >
            <div
              className="flex shrink-0 items-center justify-between border-b px-4 py-3"
              style={{ borderColor: "var(--s-border)" }}
            >
              <h2 className="text-base font-semibold">
                {panel === "categories" ? "Categories" : "Menu"}
              </h2>
              <button
                type="button"
                aria-label="Close navigation panel"
                onClick={() => {
                  closePanel();
                  triggerRef.current?.focus();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: "var(--s-surface)" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain p-2">
              {panel === "categories" ? (
                <>
                  <Link
                    on={interactive}
                    href={`${base}/products`}
                    onClick={closePanel}
                    className="flex min-h-12 items-center justify-between rounded-xl px-4 py-3 text-sm font-medium"
                  >
                    All products
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  {ctx.categories.map((category) => (
                    <Link
                      on={interactive}
                      key={category.id}
                      href={`${base}/products?category=${encodeURIComponent(category.id)}`}
                      onClick={closePanel}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm hover:bg-[var(--s-surface)]"
                    >
                      <span className="min-w-0 break-words">
                        {category.name}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </Link>
                  ))}
                  {!ctx.categories.length && (
                    <p className="px-4 py-3 text-sm" style={muted}>
                      No categories yet. Browse all products above.
                    </p>
                  )}
                </>
              ) : (
                <>
                  {d.showSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        closePanel();
                        setSearching(true);
                      }}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm"
                    >
                      <Search className="h-5 w-5" />
                      Search products
                    </button>
                  )}
                  {d.showCartIcon &&
                    (openCart ? (
                      <button
                        type="button"
                        onClick={() => {
                          closePanel();
                          openCart();
                        }}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm"
                      >
                        <ShoppingBag className="h-5 w-5" />
                        Cart <span className="ml-auto">{cart.count}</span>
                      </button>
                    ) : (
                      <Link
                        on={interactive}
                        href={`${base}/cart`}
                        onClick={closePanel}
                        className="flex min-h-12 items-center px-4 py-3 text-sm"
                      >
                        Cart ({cart.count})
                      </Link>
                    ))}
                  {menuLinks.map((link) => (
                    <Link
                      on={interactive}
                      key={link.url}
                      href={link.url}
                      onClick={closePanel}
                      aria-current={
                        isActive(pathname, base, link.url) ? "page" : undefined
                      }
                      className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm hover:bg-[var(--s-surface)]"
                    >
                      <span className="min-w-0 break-words">{link.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </Link>
                  ))}
                </>
              )}
            </div>
          </section>
        )}
        {searching && enabled ? (
          <div className="relative w-full max-w-md">
            {/* Results open upward above the bar */}
            {term.length > 0 && (
              <div
                role="listbox"
                className="absolute inset-x-0 bottom-[calc(100%+10px)] max-h-[min(55vh,340px)] overflow-y-auto rounded-[28px]"
                style={{ ...GLASS, boxShadow: "var(--sf-shadow-md)" }}
              >
                {results.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm" style={muted}>
                    No products match “{q.trim()}”
                  </p>
                ) : (
                  <ul className="py-1.5">
                    {results.map((p) => (
                      <li key={p.id} role="option">
                        <Link
                          on={interactive}
                          href={`${base}/products/${p.id}`}
                          onClick={closeSearch}
                          className="flex items-center gap-3 px-3 py-2.5 transition-colors active:bg-[var(--s-surface)]"
                        >
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg"
                            style={{ background: "var(--s-surface)" }}
                          >
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img(p.imageUrl, { width: 88, height: 88 })}
                                alt=""
                                width={44}
                                height={44}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{p.emoji || "·"}</span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {p.name}
                            </span>
                            <span className="text-xs" style={muted}>
                              {formatPrice(p.price)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div
              className="flex items-center gap-2 rounded-full p-1.5 pl-4"
              style={dockShell}
            >
              <Search className="h-5 w-5 shrink-0 opacity-60" />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Search products"
                placeholder="Search products…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") closeSearch();
                }}
                className="appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none min-w-0 flex-1 bg-transparent text-base outline-none placeholder:opacity-50"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={closeSearch}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
                style={INK}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="grid w-full max-w-md grid-cols-4 gap-1 rounded-full p-1.5"
            style={dockShell}
          >
            {items.map(({ label, href, Icon, badge, onClick }, i) => {
              const active = panel
                ? label.toLowerCase() === panel
                : enabled && href
                  ? isActive(pathname, base, href)
                  : !enabled && i === 0;
              const className =
                "relative flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full transition-[transform,background-color,color] duration-200 active:scale-90";
              const style = active ? INK : muted;
              if (onClick) {
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={(event) => {
                      triggerRef.current = event.currentTarget;
                      onClick();
                    }}
                    aria-expanded={panel === label.toLowerCase()}
                    aria-controls={
                      panel === label.toLowerCase() ? panelId : undefined
                    }
                    title={label}
                    aria-label={label}
                    className={className}
                    style={style}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{label}</span>
                    {badge > 0 && <Badge n={badge} />}
                  </button>
                );
              }
              return (
                <Link
                  key={label}
                  on={interactive}
                  href={href ?? base}
                  title={label}
                  className={className}
                  style={style}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                  {badge > 0 && <Badge n={badge} />}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
});
