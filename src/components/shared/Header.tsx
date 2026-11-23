"use client";

import { Suspense, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAllCarts } from "@/lib/cart/marketplace-cart";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Heart,
  LifeBuoy,
  ChevronRight,
  FileText,
  Cookie,
  Home,
  LayoutGrid,
  Loader2,
  Menu,
  RotateCcw,
  Search,
  ShieldCheck,
  Store,
  ShoppingCart,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { useMainTypes, useMarketplaceProducts } from "@/lib/query/marketplace";
import { AuthSlot } from "@/components/shared/ProfileMenu";
import { Offcanvas } from "@/components/shared/Offcanvas";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/?view=categories", label: "Categories", icon: LayoutGrid },
  { href: "/sellers", label: "Sellers", icon: Store },
  { href: "/products?deals=1", label: "Deals", icon: Tag },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/pricing", label: "Pricing", icon: Wallet },
  { href: "/help", label: "Help & Support", icon: LifeBuoy },
];

/** Legal pages. Shown in a "Policies" dropdown (desktop) and a section (mobile menu). */
const policyLinks = [
  { href: "/terms", label: "Terms & Conditions", icon: FileText },
  { href: "/privacy", label: "Privacy Policy", icon: ShieldCheck },
  { href: "/refund-policy", label: "Return & Refund Policy", icon: RotateCcw },
  { href: "/cookie-policy", label: "Cookie Policy", icon: Cookie },
];

const ring =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2";

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const inputClass =
  "h-11 w-full rounded-full border border-[#E6DDD0] dark:border-border bg-white dark:bg-card pl-11 pr-10 text-sm text-foreground outline-none transition placeholder:text-slate-500 focus:border-[#17645F]/40 dark:focus:border-[#D93A2B]/40 focus:bg-white dark:focus:bg-card focus:ring-2 focus:ring-[#FF6845]";

const POP_CSS = `
@keyframes sb-pop { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
.sb-pop { animation: sb-pop 140ms ease-out; transform-origin: top; }
@media (prefers-reduced-motion: reduce) { .sb-pop { animation: none; } }
`;

/** Static look-alike shown while the real box waits for the URL (Suspense). */
function SearchBoxFallback({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <div className={cn(inputClass, "flex items-center text-slate-500")}>
        Search ShopBD
      </div>
    </div>
  );
}

function SearchBox({
  className,
  suggest = true,
  onDone,
}: {
  className?: string;
  /** Live suggestions dropdown. */
  suggest?: boolean;
  /** Called after a search is submitted. */
  onDone?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const listId = useId();
  const { mains } = useMainTypes();
  const urlCategory =
    pathname === "/search" || pathname === "/products"
      ? params.get("category") || ""
      : "";
  const [scope, setScope] = useState(urlCategory);
  useEffect(() => setScope(urlCategory), [urlCategory]);

  // On the results page the box shows the current search.
  const fromUrl = pathname === "/search" ? (params.get("q") ?? "") : "";
  const [value, setValue] = useState(fromUrl);
  useEffect(() => setValue(fromUrl), [fromUrl]);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const term = value.trim();
  const debounced = useDebounced(term, 150);
  // 2+ letters: live matches. Empty/1 letter: popular products as suggestions.
  const searching = term.length >= 2;
  const enabled = suggest && open && (!searching || debounced.length >= 2);
  const q = useMarketplaceProducts(
    searching
      ? {
          q: debounced,
          category: scope || undefined,
          sort: "relevance",
          limit: 5,
        }
      : { category: scope || undefined, sort: "top_selling", limit: 5 },
    { enabled },
  );
  const items = enabled && q.data ? q.data.items : [];
  const total = enabled && q.data ? q.data.total : 0;
  const rows = items.length + (searching ? 1 : 0); // products + "see all"
  // Panel stays open while the next results load (old ones stay, dimmed),
  // so it never blinks closed between keystrokes.
  const showPanel = suggest && open;
  const pending =
    q.isFetching || (searching && (debounced !== term || debounced.length < 2));

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const goSearch = () => {
    if (!term && !scope) return;
    setOpen(false);
    input.current?.blur();
    const search = new URLSearchParams();
    if (term) search.set("q", term);
    if (scope) search.set("category", scope);
    router.push(`${term ? "/search" : "/products"}?${search}`);
    onDone?.();
  };

  const goProduct = (i: number) => {
    const p = items[i];
    if (!p) return;
    setOpen(false);
    input.current?.blur();
    // Navigate to the search results page filtered by the product's name AND
    // its category, so the user sees every matching product from every seller
    // — the standard marketplace "discovery" flow (like Amazon / Daraz).
    const sp = new URLSearchParams();
    sp.set("q", p.title);
    if (p.category?.slug) sp.set("category", p.category.slug);
    router.push(`/search?${sp.toString()}`);
    onDone?.();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showPanel) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % rows);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? rows - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0 && active < items.length) {
      e.preventDefault();
      goProduct(active);
    }
  };

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <form
        className="market-search"
        action="/search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goSearch();
        }}
      >
        <div className="sn-search-outline">
          <div className="sn-search-input">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            />
            <input
              ref={input}
              name="q"
              type="search"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setOpen(true);
                setActive(-1);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              role={suggest ? "combobox" : undefined}
              aria-expanded={suggest ? showPanel : undefined}
              aria-controls={suggest ? listId : undefined}
              aria-activedescendant={
                showPanel && active >= 0 ? `${listId}-${active}` : undefined
              }
              aria-label="Search products, stores or categories"
              placeholder="Search "
              className={cn(
                inputClass,
                "[&::-webkit-search-cancel-button]:hidden",
              )}
            />
            {value && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setValue("");
                  input.current?.focus();
                }}
                className={cn(
                  "absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-500 hover:bg-[#EAE2D7] dark:hover:bg-muted hover:text-[#17645F] dark:hover:text-white",
                  ring,
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            name="category"
            aria-label="Search category"
            className="sn-search-scope"
            value={scope}
            onChange={(event) => {
              setScope(event.target.value);
              setOpen(false);
              setActive(-1);
            }}
          >
            <option value="">All categories</option>
            {scope && !mains.some((m) => m.id === scope) && (
              <option value={scope}>{scope}</option>
            )}
            {mains.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="market-search-submit">
          Search
        </button>
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="sb-pop absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#E6DDD0] dark:border-border bg-white dark:bg-card shadow-lg"
        >
          <style>{POP_CSS}</style>
          {pending && items.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </p>
          ) : q.isError ? (
            <p className="px-4 py-4 text-sm text-destructive">
              Search is unavailable right now. Press Enter to try again.
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-500">
              {searching
                ? `No products match “${debounced}”.`
                : "Start typing to search products, stores or categories."}
            </p>
          ) : (
            <ul
              className={cn(
                "transition-opacity duration-150",
                pending && "opacity-60",
              )}
            >
              {!searching && (
                <li
                  role="presentation"
                  className="px-4 pb-1 pt-3 text-xs font-medium text-slate-500"
                >
                  Popular right now
                </li>
              )}
              {items.map((p, i) => {
                // Clicking a suggestion takes the user to the full search
                // results for that product's name + category, so they see
                // every matching listing from every seller.
                const suggestionHref = (() => {
                  const sp = new URLSearchParams();
                  sp.set("q", p.title);
                  if (p.category?.slug) sp.set("category", p.category.slug);
                  return `/search?${sp.toString()}`;
                })();
                return (
                  <li
                    key={p.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                  >
                    <Link
                      href={suggestionHref}
                      onClick={() => {
                        setOpen(false);
                        onDone?.();
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5",
                        active === i
                          ? "bg-[#F3EEE8] dark:bg-muted"
                          : "bg-white dark:bg-card",
                      )}
                    >
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#EDE6DC] dark:bg-muted">
                        <Image
                          src={p.images[0] || "/placeholder-product.jpg"}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {p.title}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="truncate">{p.store.name}</span>
                          {p.category?.name && (
                            <>
                              <span className="sr-only">Category</span>
                              <span className="shrink-0 text-[#17645F] dark:text-[#FF6845]">
                                {p.category.name}
                              </span>
                            </>
                          )}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="text-sm font-semibold text-[#17645F] dark:text-white">
                          {formatPrice(p.price)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          See all →
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {searching && (
            <button
              type="button"
              id={`${listId}-${items.length}`}
              role="option"
              aria-selected={active === items.length}
              onMouseEnter={() => setActive(items.length)}
              onClick={goSearch}
              className={cn(
                "flex w-full items-center justify-between gap-2 border-t border-[#E6DDD0] dark:border-border px-4 py-3 text-sm font-medium text-[#17645F] dark:text-white",
                active === items.length
                  ? "bg-[#F3EEE8] dark:bg-muted"
                  : "bg-white dark:bg-card",
              )}
            >
              <span className="truncate">
                {total > items.length
                  ? `See all ${total} results for “${term}”`
                  : `Search for “${term}”`}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function Navbar(props: { cartCount?: number }) {
  return (
    <Suspense
      fallback={
        <header
          aria-label="Loading navigation"
          className="h-28 border-b bg-background md:h-16 lg:h-28"
        />
      }
    >
      <MarketplaceHeader {...props} />
    </Suspense>
  );
}

function MarketplaceHeader({
  cartCount: cartCountProp,
}: {
  cartCount?: number;
}) {
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () =>
      document.documentElement.style.setProperty(
        "--market-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--market-header-height");
    };
  }, []);
  // Live count across every seller's cart. An explicit prop still wins.
  const live = useAllCarts();
  const cartCount = cartCountProp ?? (live.ready ? live.count : 0);
  const pathname = usePathname();
  const query = useSearchParams();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  // Close the menu panel whenever the page changes.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    const categories =
      pathname === "/" &&
      (query.get("view") === "categories" || query.has("category"));
    if (href === "/") return pathname === "/" && !categories;
    if (href === "/?view=categories") return categories;
    if (href === "/products?deals=1")
      return pathname === "/products" && query.get("deals") === "1";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const iconBtn = cn(
    "grid h-10 w-10 place-items-center rounded-full border border-[#E6DDD0] dark:border-border bg-white dark:bg-card text-[#17645F] dark:text-white transition-colors hover:bg-[#EAE2D7] dark:hover:bg-muted sm:h-11 sm:w-11",
    ring,
  );

  const logo = (
    <Image
      src="/Blue and coral snappy mascot logo.png"
      alt="SnappyShop"
      width={200}
      height={85}
      priority
      className="h-12 w-auto max-w-full object-contain md:h-14 lg:!h-16"
    />
  );

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md transition-shadow duration-300",
        scrolled
          ? "border-[#E6DDD0] dark:border-border shadow-[0_8px_24px_-16px_rgba(23,100,95,0.45)]"
          : "border-transparent",
      )}
    >
      <div className="sn-header shop-masthead relative mx-auto flex h-16 max-md:grid max-md:grid-cols-[minmax(0,1fr)_clamp(100px,calc(100vw_-_220px),168px)_minmax(0,1fr)] max-md:gap-1 max-md:px-3 max-w-[1400px] items-center gap-2 px-4 sm:h-[68px] sm:gap-3 sm:px-6 lg:gap-6 lg:px-8">
        <nav aria-label="Marketplace services" className="sn-utility">
          <Link href="/products?deals=1">Deals</Link>
          <Link href="/sellers">Explore sellers</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/refund-policy">Returns</Link>
          <Link href="/help">Help &amp; Support</Link>
        </nav>
        {/* Menu button (phones and tablets) — opens the left panel */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Open menu"
          className={cn(
            iconBtn,
            "max-md:col-start-1 max-md:row-start-1 max-md:justify-self-start lg:hidden",
          )}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link
          href="/"
          className={cn(
            "sn-logo flex shrink-0 items-center rounded-full max-md:col-start-2 max-md:row-start-1 max-md:min-w-0 max-md:justify-center",
            ring,
          )}
        >
          {logo}
        </Link>

        {/* Search (tablet and up) */}
        <Suspense
          fallback={
            <SearchBoxFallback className="sn-search-box hidden min-w-0 flex-1 md:block" />
          }
        >
          <SearchBox className="sn-search-box hidden min-w-0 flex-1 md:block" />
        </Suspense>

        {/* Actions */}
        <div className="shop-actions ml-auto flex shrink-0 items-center gap-1 sm:gap-2 max-md:col-start-3 max-md:row-start-1 max-md:justify-self-end max-md:[&_.sn-guest]:grid max-md:[&_.sn-guest]:leading-tight max-md:[&_.sn-guest_span]:hidden">
          <Link
            href="/wishlist"
            aria-label="View wishlist"
            className="sn-wishlist"
          >
            <Heart size={19} />
            <span>Wishlist</span>
          </Link>
          <Link className="sn-sell" href="/seller/setup">
            Sell
          </Link>
          {/* Bell: signed-in sellers (unread count) and admins only */}
          <div className="contents max-md:absolute max-md:left-[3.5rem] max-md:top-1/2 max-md:block max-md:-translate-y-1/2 sm:max-md:left-16">
            <NotificationBell className={iconBtn} />
          </div>

          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            className={cn("relative", iconBtn)}
          >
            <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.9} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#FF6845] px-1 text-[10px] font-bold text-white ring-2 ring-background">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Avatar (opens the right panel) when signed in, Login / Sign Up when signed out */}
          <AuthSlot />
        </div>
      </div>

      {/* Mobile search bar — always visible below the header row */}
      <div className="mx-auto max-w-[1400px] px-4 pb-3 sm:px-6 md:hidden">
        <Suspense fallback={<SearchBoxFallback />}>
          <SearchBox />
        </Suspense>
      </div>

      {/* Menu panel (phones and tablets) */}
      <Offcanvas
        id="mobile-menu"
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        label="Main menu"
        heading={
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={cn("flex items-center rounded-full", ring)}
          >
            {logo}
          </Link>
        }
        footer={
          <Link
            href="/cart"
            onClick={() => setOpen(false)}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#17645F] dark:bg-[#D93A2B] text-sm font-semibold text-white transition-colors hover:bg-[#17645F]/90 dark:hover:bg-[#D93A2B]/90",
              ring,
            )}
          >
            <ShoppingCart
              className="h-4 w-4 text-[#FF6845]"
              strokeWidth={1.9}
            />
            {cartCount > 0 ? `View cart (${cartCount})` : "View cart"}
          </Link>
        }
      >
        <nav aria-label="Main mobile" className="space-y-1 p-3">
          {links.map((l) => {
            const active = isActive(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[52px] items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition-colors",
                  ring,
                  active
                    ? "border-transparent bg-[#17645F] dark:bg-[#D93A2B] text-white"
                    : "border-transparent text-foreground hover:bg-[#EAE2D7] dark:hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-[#EAE2D7] dark:bg-muted text-[#17645F] dark:text-white",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex-1">{l.label}</span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-[#FF6845]" : "opacity-40",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Legal pages */}
        <nav aria-label="Policies" className="space-y-1 border-t p-3">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Policies
          </p>
          {policyLinks.map((l) => {
            const active = isActive(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[48px] items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition-colors",
                  ring,
                  active
                    ? "border-transparent bg-[#17645F] dark:bg-[#D93A2B] text-white"
                    : "border-transparent text-foreground hover:bg-[#EAE2D7] dark:hover:bg-muted",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1">{l.label}</span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-[#FF6845]" : "opacity-40",
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </Offcanvas>
    </header>
  );
}
