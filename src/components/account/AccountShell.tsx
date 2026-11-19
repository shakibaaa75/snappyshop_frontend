"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Home,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Plus,
  Search,
  Store,
  UserPen,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { authApi, type AuthUser } from "@/lib/api/auth";
import { useBuyerProfile } from "@/lib/query/buyer";
import { qk } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import { BuyerAvatar } from "@/components/account/BuyerAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const ring =
  "outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2";

/** Soft white round button (bell, pill nav). */
const roundBtn =
  "flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_1px_6px_rgba(0,0,0,0.08)] transition active:scale-95";

type MenuItem = { href: string; label: string; icon: LucideIcon };

const MENU: MenuItem[] = [
  { href: "/account", label: "My profile", icon: UserRound },
  { href: "/account/profile", label: "Edit profile", icon: UserPen },
  { href: "/account/addresses", label: "Saved addresses", icon: MapPin },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/", label: "Back to shopping", icon: Store },
];

/** Inline tabs in the desktop top bar (the account sheet keeps the full list). */
const TABS: { href: string; label: string }[] = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
];

/** Where a signed-in user who is not a buyer belongs. */
function homeFor(me: AuthUser): string {
  if (me.role === "ADMIN") return "/admin";
  if (me.role === "SELLER") {
    return me.storeSlug ? `/seller/${me.storeSlug}/dashboard` : "/seller/setup";
  }
  return "/";
}

/**
 * Frame for every /account page. A normal responsive website:
 *  - desktop / tablet: full-width top bar with the logo, inline tabs,
 *    a "New snap" button, the bell and the avatar; wide content area.
 *  - phones: compact top bar and a floating pill nav at the bottom.
 * Only buyers get in; everyone else is sent where they belong.
 */
export function AccountShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    data: me,
    isLoading,
    isError,
  } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 30_000,
  });

  const isBuyer = me?.role === "BUYER";
  const { data: profile } = useBuyerProfile(isBuyer);

  useEffect(() => {
    if (isLoading) return;
    if (isError || !me) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (me.role !== "BUYER") {
      router.replace(homeFor(me));
    }
  }, [isLoading, isError, me, pathname, router]);

  // Close the menu when the page changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      /* cookies may already be gone; still sign out locally */
    }
    qc.clear();
    router.replace("/");
    router.refresh();
  };

  if (isLoading || !isBuyer) {
    return (
      <div className="min-h-screen bg-neutral-100 px-4 pt-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const name = profile?.name || me.name || me.email.split("@")[0];
  const onProfile = pathname.startsWith("/account");

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-neutral-100/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="ShopBD home"
            className={cn("shrink-0 rounded-md", ring)}
          >
            <Image
              src="/mainlogo.png"
              alt="ShopBD"
              width={120}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </Link>

          <nav
            aria-label="Account"
            className="ml-4 hidden items-center gap-1 md:flex"
          >
            <TabLink href="/" label="Home" active={false} />
            <TabLink href="/search" label="Search" active={false} />
            <span className="mx-2 h-5 w-px bg-neutral-300" aria-hidden />
            {TABS.map((t) => (
              <TabLink
                key={t.href}
                href={t.href}
                label={t.label}
                active={
                  t.href === "/account"
                    ? pathname === "/account"
                    : pathname.startsWith(t.href)
                }
              />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Posting snaps arrives in a later part. */}
            <button
              type="button"
              aria-disabled="true"
              title="Snaps are coming soon"
              className="hidden h-11 cursor-default items-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white opacity-60 md:flex"
            >
              <Plus className="h-4 w-4" />
              New snap
            </button>

            {/* Buyer notifications arrive in a later part (a red dot will mark new ones). */}
            <button
              type="button"
              aria-label="Notifications (coming soon)"
              aria-disabled="true"
              title="Notifications are coming soon"
              className={cn(roundBtn, ring, "cursor-default opacity-60")}
            >
              <Bell className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Open account menu"
              onClick={() => setMenuOpen(true)}
              className={cn(
                "rounded-full p-0.5 transition hover:ring-2 hover:ring-neutral-300",
                ring,
              )}
            >
              <BuyerAvatar
                name={name}
                src={profile?.avatarUrl}
                className="h-10 w-10"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Page content; extra bottom padding on phones clears the floating nav */}
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 md:px-6 md:pb-16 lg:px-8">
        {children}
      </main>

      {/* Floating pill nav: phones only */}
      <nav
        aria-label="Account navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="flex items-center gap-2 rounded-full bg-white/95 p-2 shadow-[0_6px_24px_rgba(0,0,0,0.14)] backdrop-blur">
          <PillLink href="/" label="Home" icon={Home} />
          <PillLink href="/search" label="Search" icon={Search} />
          <button
            type="button"
            aria-label="Add snap (coming soon)"
            aria-disabled="true"
            title="Snaps are coming soon"
            className="flex h-11 w-11 cursor-default items-center justify-center rounded-full bg-neutral-900 text-white opacity-60"
          >
            <Plus className="h-5 w-5" />
          </button>
          <PillLink href="/account/orders" label="Orders" icon={Package} />
          <Link
            href="/account"
            aria-label="My profile"
            aria-current={onProfile ? "page" : undefined}
            className={cn(
              "rounded-full p-0.5 transition",
              ring,
              onProfile && "ring-2 ring-neutral-900",
            )}
          >
            <BuyerAvatar
              name={name}
              src={profile?.avatarUrl}
              className="h-10 w-10"
            />
          </Link>
        </div>
      </nav>

      {/* Account sheet (opens from the avatar) */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          className="flex w-[85%] max-w-sm flex-col gap-0 p-0"
        >
          <SheetHeader className="border-b p-5 text-left">
            <div className="flex items-center gap-3">
              <BuyerAvatar
                name={name}
                src={profile?.avatarUrl}
                className="h-12 w-12"
              />
              <div className="min-w-0">
                <SheetTitle className="truncate text-base">{name}</SheetTitle>
                <p className="truncate text-xs text-muted-foreground">
                  {me.email}
                </p>
              </div>
            </div>
          </SheetHeader>

          <ul className="flex-1 space-y-1 overflow-y-auto p-3">
            {MENU.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <SheetClose asChild>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                        ring,
                        active
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-700 hover:bg-neutral-100",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>

          <div className="border-t p-3">
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60",
                ring,
              )}
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PillLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(roundBtn, "shadow-none", ring)}
    >
      <Icon className="h-5 w-5" />
    </Link>
  );
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition",
        ring,
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-600 hover:bg-white hover:text-neutral-900",
      )}
    >
      {label}
    </Link>
  );
}
