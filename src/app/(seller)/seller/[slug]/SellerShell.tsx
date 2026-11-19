"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams, usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  Paintbrush,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authApi, type AuthUser } from "@/lib/api/auth";
import { sellerProducts } from "@/lib/api/products";
import { sellerOrders } from "@/lib/api/orders";
import { sellerCouriers } from "@/lib/api/couriers";
import { fetchPublicStore } from "@/lib/store-design/api";
import { qk } from "@/lib/query/keys";
import { useSellerNotifications } from "@/lib/query/notifications";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

/** Unread-count bubble on a nav icon. */
function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

const mainLinks = (slug: string): NavItem[] => [
  {
    href: `/seller/${slug}/dashboard`,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  { href: `/seller/${slug}/products`, label: "Products", icon: Package },
  { href: `/seller/${slug}/orders`, label: "Orders", icon: ShoppingBag },
  { href: `/seller/${slug}/couriers`, label: "Couriers", icon: Truck },
  {
    href: `/seller/${slug}/store-design`,
    label: "Store Design",
    icon: Paintbrush,
  },
  {
    href: `/seller/${slug}/try-the-look`,
    label: "Try the Look",
    icon: Sparkles,
  },
];

const moreLinks = (slug: string): NavItem[] => [
  {
    href: `/seller/${slug}/notifications`,
    label: "Notifications",
    icon: Bell,
  },
  { href: `/seller/${slug}/analytics`, label: "Analytics", icon: BarChart3 },
  {
    href: `/seller/${slug}/subscription`,
    label: "Subscription",
    icon: CreditCard,
  },
  { href: `/seller/${slug}/settings`, label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string, slug: string) {
  if (pathname === href) return true;
  if (href === `/seller/${slug}/dashboard`) return false;
  return pathname.startsWith(href);
}

/* ------------------------------------------------------------------ */
/* Animations (keyframes + reduced-motion handling)                    */
/* ------------------------------------------------------------------ */

const ANIMATION_CSS = `
@keyframes seller-page-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
@keyframes seller-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.seller-page-enter {
  /* "backwards" (not "both") so no transform is left behind after the
     animation ends — a lingering transform would break fixed children. */
  animation: seller-page-in 320ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.seller-fade-enter {
  animation: seller-fade-in 240ms ease-out backwards;
}
@media (prefers-reduced-motion: reduce) {
  .seller-page-enter,
  .seller-fade-enter { animation: none; }
  .seller-pill { transition: none !important; }
}
`;

/** Re-mounts on every route change so the enter animation replays. */
function PageTransition({
  routeKey,
  fadeOnly,
  children,
}: {
  routeKey: string;
  fadeOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      key={routeKey}
      className={fadeOnly ? "seller-fade-enter" : "seller-page-enter"}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* User menu (profile)                                                 */
/* ------------------------------------------------------------------ */

function UserMenu({
  name,
  email,
  slug,
  logoUrl,
  onLogout,
}: {
  name?: string | null;
  email: string;
  slug: string;
  logoUrl?: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = !!logoUrl && !imgFailed;
  const initial = (name || email || "S").trim().charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
        title={name || email}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-emerald-700 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-emerald-800 active:scale-95"
      >
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            width={44}
            height={44}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          initial
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          {/* Opens to the right of the rail */}
          <div
            role="menu"
            className="seller-fade-enter absolute left-14 top-0 z-50 w-64 origin-top-left rounded-2xl border bg-white p-2 shadow-xl"
          >
            <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{name || email}</p>
              {name && (
                <p className="truncate text-xs text-neutral-500">{email}</p>
              )}
              <p className="mt-1 truncate text-xs font-medium text-emerald-700">
                /store/{slug}
              </p>
            </div>
            <a
              href={`/store/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
            >
              <ExternalLink className="h-4 w-4" /> View store
            </a>
            <Link
              href={`/seller/${slug}/settings`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating icon rail (left)                                           */
/* ------------------------------------------------------------------ */

function RailButton({
  item,
  active,
  onHover,
  badge = 0,
}: {
  item: NavItem;
  active: boolean;
  onHover?: (href: string) => void;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => onHover?.(item.href)}
      onFocus={() => onHover?.(item.href)}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ease-out active:scale-90",
        active
          ? "scale-105 bg-emerald-700 text-white shadow-md"
          : "text-neutral-500 hover:scale-105 hover:bg-neutral-100 hover:text-neutral-900",
      )}
    >
      <item.icon className="h-[18px] w-[18px]" />
      <Badge count={badge} />
    </Link>
  );
}

function Rail({
  slug,
  name,
  email,
  logoUrl,
  pathname,
  unread,
  onHover,
  onLogout,
}: {
  slug: string;
  name?: string | null;
  email: string;
  logoUrl?: string;
  pathname: string;
  unread: number;
  onHover: (href: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1.5 rounded-full bg-white p-2 shadow-sm">
        <UserMenu
          name={name}
          email={email}
          slug={slug}
          logoUrl={logoUrl}
          onLogout={onLogout}
        />
      </div>
      <div className="flex flex-col items-center gap-1.5 rounded-full bg-white p-2 shadow-sm">
        {mainLinks(slug).map((l) => (
          <RailButton
            key={l.href}
            item={l}
            active={isActive(pathname, l.href, slug)}
            onHover={onHover}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1.5 rounded-full bg-white p-2 shadow-sm">
        {moreLinks(slug).map((l) => (
          <RailButton
            key={l.href}
            item={l}
            active={isActive(pathname, l.href, slug)}
            badge={l.href.endsWith("/notifications") ? unread : 0}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1.5 rounded-full bg-white p-2 shadow-sm">
        <a
          href={`/store/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View store"
          aria-label="View store"
          className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition-all duration-300 hover:scale-105 hover:bg-neutral-100 hover:text-neutral-900 active:scale-90"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
        </a>
        <button
          type="button"
          title="Log out"
          aria-label="Log out"
          onClick={onLogout}
          className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition-all duration-300 hover:scale-105 hover:bg-red-50 hover:text-red-600 active:scale-90"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile off-canvas menu (closes on tab click / route change)         */
/* ------------------------------------------------------------------ */

function MobileMenu({
  name,
  email,
  slug,
  pathname,
  unread,
  onHover,
  onLogout,
}: {
  name?: string | null;
  email: string;
  slug: string;
  pathname: string;
  unread: number;
  onHover: (href: string) => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const openMenu = () => setOpen(true);
    window.addEventListener("seller:open-menu", openMenu);
    return () => window.removeEventListener("seller:open-menu", openMenu);
  }, []);

  // Safety net: close whenever the route changes (back button, redirects…).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium text-neutral-600 hover:bg-neutral-100 lg:hidden"
        >
          <span className="relative">
            <Menu className="h-5 w-5" />
            <Badge count={unread} />
          </span>
          Menu
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          const trigger = document.querySelector<HTMLButtonElement>(
            "[data-seller-menu-trigger]",
          );
          if (trigger && trigger.getClientRects().length) {
            event.preventDefault();
            trigger.focus();
          }
        }}
        className="w-[min(85vw,320px)] p-0"
      >
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-emerald-800">
              <Store className="h-5 w-5" /> Seller Hub
            </SheetTitle>
            <p className="mt-2 truncate text-xs text-muted-foreground">
              {name || email} · /store/{slug}
            </p>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {[...mainLinks(slug), ...moreLinks(slug)].map((l) => {
              const active = isActive(pathname, l.href, slug);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  onClick={close}
                  onMouseEnter={() => onHover(l.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-300 active:scale-[0.98]",
                    active
                      ? "bg-emerald-700 text-white"
                      : "text-neutral-600 hover:bg-neutral-100",
                  )}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                  {l.href.endsWith("/notifications") && unread > 0 && (
                    <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-3">
            <button
              type="button"
              onClick={() => {
                close();
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/**
 * Seller dashboard chrome. The server layout (./layout.tsx) has already
 * verified the session, role and shop address and passes the user in, so this
 * renders immediately. The client checks below stay as a fallback for a
 * session that ends while the page is open (logout in another tab, expiry).
 */
export function SellerShell({
  children,
  initialMe,
}: {
  children: React.ReactNode;
  initialMe: AuthUser;
}) {
  const params = useParams<{ slug: string }>();
  const urlSlug = params?.slug ?? "";
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: me, isLoading } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    initialData: initialMe,
    retry: false,
    staleTime: 30_000,
  });

  // Store logo for the profile avatar (shares the cache with the storefront).
  const { data: store } = useQuery({
    queryKey: ["public-store", me?.storeSlug],
    queryFn: () => fetchPublicStore(me!.storeSlug as string),
    enabled: !!me?.storeSlug,
    staleTime: 60_000,
    retry: false,
  });
  const logoUrl = store?.design?.logoUrl || undefined;

  // Fallback redirects for a session that ends mid-visit.
  useEffect(() => {
    if (isLoading) return;

    if (!me) {
      router.replace(
        `/login?next=${encodeURIComponent(
          pathname || `/seller/${urlSlug}/dashboard`,
        )}`,
      );
      return;
    }
    if (me.role !== "SELLER") {
      router.replace(me.role === "ADMIN" ? "/admin" : "/account");
      return;
    }
    if (!me.storeSlug) {
      if (!pathname.endsWith("/setup")) {
        router.replace("/seller/setup");
      }
      return;
    }
  }, [me, isLoading, urlSlug, pathname, router]);

  // A seller address that is not the seller's CURRENT one (for example the
  // one before a shop rename) is invalid: 404, never a redirect to the shop.
  if (
    !isLoading &&
    me?.role === "SELLER" &&
    me.storeSlug &&
    urlSlug &&
    urlSlug !== me.storeSlug
  ) {
    notFound();
  }

  const ready =
    !isLoading &&
    !!me &&
    me.role === "SELLER" &&
    !!me.storeSlug &&
    urlSlug === me.storeSlug;

  // Unread admin messages: red bubble on the Notifications icon.
  const { data: notif } = useSellerNotifications(ready);
  const unread = notif?.unread ?? 0;

  if (!ready || !me || !me.storeSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e4e5e8] text-sm text-neutral-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your
        dashboard…
      </div>
    );
  }

  const storeSlug: string = me.storeSlug;

  // Prefetch the likely destination when the user hovers a nav link.
  const prefetch = (href: string) => {
    if (href.endsWith("/dashboard")) {
      qc.prefetchQuery({
        queryKey: qk.seller.stats(),
        queryFn: () => sellerOrders.stats(),
      });
      qc.prefetchQuery({
        queryKey: qk.seller.orders.list("all"),
        queryFn: () => sellerOrders.list({ status: "all", limit: 100 }),
      });
    } else if (href.endsWith("/products")) {
      qc.prefetchQuery({
        queryKey: qk.seller.products.list(),
        queryFn: sellerProducts.list,
      });
    } else if (href.endsWith("/orders")) {
      qc.prefetchQuery({
        queryKey: qk.seller.orders.list("all"),
        queryFn: () => sellerOrders.list({ status: "all", limit: 100 }),
      });
      // The orders page needs the connected couriers for its Ship buttons.
      qc.prefetchQuery({
        queryKey: qk.seller.couriers.list(),
        queryFn: sellerCouriers.list,
      });
    } else if (href.endsWith("/couriers")) {
      qc.prefetchQuery({
        queryKey: qk.seller.couriers.list(),
        queryFn: sellerCouriers.list,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      // Clear all cached data so the next user doesn't see the previous one's
      // products, orders, or stats.
      qc.clear();
      router.push("/login");
      router.refresh();
    }
  };

  // The designer opens the shared menu from its own toolbar.
  const isDesigner = pathname.startsWith(`/seller/${storeSlug}/store-design`);

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      <style>{ANIMATION_CSS}</style>

      <div className="fixed inset-y-0 left-0 z-50 hidden w-[120px] items-center justify-center pl-[36px] lg:flex">
        <Rail
          slug={storeSlug}
          name={me.name}
          email={me.email}
          logoUrl={logoUrl}
          pathname={pathname}
          unread={unread}
          onHover={prefetch}
          onLogout={handleLogout}
        />
      </div>

      <nav
        aria-label="Seller navigation"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-white px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden",
          isDesigner && "hidden",
        )}
      >
        {[
          mainLinks(storeSlug)[0],
          mainLinks(storeSlug)[1],
          mainLinks(storeSlug)[2],
          mainLinks(storeSlug)[4],
        ].map((link) => {
          const active = isActive(pathname, link.href, storeSlug);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium",
                active ? "bg-emerald-50 text-emerald-800" : "text-neutral-600",
              )}
            >
              <link.icon className="h-5 w-5" />
              <span className="truncate">
                {link.label === "Store Design" ? "Design" : link.label}
              </span>
            </Link>
          );
        })}
        <MobileMenu
          name={me.name}
          email={me.email}
          slug={storeSlug}
          pathname={pathname}
          unread={unread}
          onHover={prefetch}
          onLogout={handleLogout}
        />
      </nav>

      <div className="px-2 pt-2 sm:px-4 sm:pt-4 lg:pl-[136px] lg:pr-6">
        {isDesigner ? (
          <PageTransition routeKey={pathname} fadeOnly>
            {children}
          </PageTransition>
        ) : (
          <main className="min-w-0 px-2 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-3 sm:px-4 md:px-6 lg:pb-10 lg:pt-5">
            <PageTransition routeKey={pathname}>{children}</PageTransition>
          </main>
        )}
      </div>
    </div>
  );
}
