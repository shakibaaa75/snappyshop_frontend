"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronRight,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Paintbrush,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { authApi, type AuthUser } from "@/lib/api/auth";
import { fetchPublicStore } from "@/lib/store-design/api";
import { qk } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import { Offcanvas } from "@/components/shared/Offcanvas";

const ring =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#FF6845] focus-visible:ring-offset-2";

type Item = { href: string; label: string; icon: LucideIcon };
type Group = { label?: string; items: Item[] };

/** Menu links, grouped, depending on who is signed in. */
function menuFor(me: AuthUser): Group[] {
  if (me.role === "ADMIN") {
    return [
      {
        items: [{ href: "/admin", label: "Admin Panel", icon: ShieldCheck }],
      },
    ];
  }
  if (me.role === "SELLER") {
    if (!me.storeSlug) {
      return [
        {
          items: [
            {
              href: "/seller/setup",
              label: "Finish store setup",
              icon: Paintbrush,
            },
          ],
        },
      ];
    }
    const s = `/seller/${me.storeSlug}`;
    return [
      {
        label: "Manage your store",
        items: [
          {
            href: `${s}/dashboard`,
            label: "Seller Dashboard",
            icon: LayoutDashboard,
          },
          {
            href: `${s}/store-design`,
            label: "Store Design",
            icon: Paintbrush,
          },
          { href: `${s}/products`, label: "Products", icon: Package },
          { href: `${s}/orders`, label: "Orders", icon: ShoppingBag },
          { href: `${s}/couriers`, label: "Couriers", icon: Truck },
          { href: `${s}/analytics`, label: "Analytics", icon: BarChart3 },
          {
            href: `${s}/subscription`,
            label: "Subscription",
            icon: CreditCard,
          },
        ],
      },
      {
        label: "Storefront",
        items: [
          {
            href: `/store/${me.storeSlug}`,
            label: "View my store",
            icon: ExternalLink,
          },
        ],
      },
    ];
  }
  return [
    {
      label: "Account",
      items: [
        { href: "/account", label: "My Account", icon: UserIcon },
        { href: "/orders", label: "My Orders", icon: ShoppingBag },
        // Light / Dark choice for the home page lives here.
        { href: "/account/settings", label: "Settings", icon: Settings },
      ],
    },
  ];
}

const roleLabel = (r: string) =>
  r === "SELLER" ? "Seller" : r === "ADMIN" ? "Admin" : "Buyer";

function Avatar({
  name,
  src,
  size = 36,
  tone = "teal",
}: {
  name: string;
  src?: string;
  size?: number;
  /** "onTeal" is for use on the teal profile card. */
  tone?: "teal" | "onTeal";
}) {
  const initial = (name.trim()[0] ?? "U").toUpperCase();
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full text-sm font-semibold text-white",
        tone === "teal"
          ? "bg-[#17645F]"
          : "bg-[#FF6845] text-lg ring-2 ring-white/40",
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
}

function useSession() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: me, isLoading } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 30_000,
  });

  // Store logo as the seller's avatar (shares cache with the seller layout).
  const { data: store } = useQuery({
    queryKey: ["public-store", me?.storeSlug],
    queryFn: () => fetchPublicStore(me!.storeSlug as string),
    enabled: me?.role === "SELLER" && !!me?.storeSlug,
    staleTime: 60_000,
    retry: false,
  });

  const [loggingOut, setLoggingOut] = useState(false);
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
    setLoggingOut(false);
  };

  const name = me?.name?.trim() || me?.email?.split("@")[0] || "Account";
  return {
    me,
    isLoading,
    name,
    logo: store?.design?.logoUrl || undefined,
    logout,
    loggingOut,
  };
}

/** One tappable row: icon tile, label, chevron. */
function Row({
  item,
  active,
  onNavigate,
}: {
  item: Item;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[52px] items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition-colors",
        ring,
        active
          ? "border-[#E6DDD0] bg-white text-[#17645F]"
          : "border-transparent text-foreground hover:bg-[#EAE2D7]",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
          active ? "bg-[#17645F] text-white" : "bg-[#EAE2D7] text-[#17645F]",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
    </Link>
  );
}

/**
 * Profile control for every screen size.
 * - Signed in: avatar button (name shows from xl up) that opens a side panel.
 * - Signed out: "Login" on phones, "Login / Sign Up" from sm up.
 */
export function ProfileMenu({ onLoggedOut }: { onLoggedOut?: () => void }) {
  const { me, isLoading, name, logo, logout, loggingOut } = useSession();
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  // Close the panel whenever the page changes.
  useEffect(() => setOpen(false), [pathname]);

  if (isLoading) {
    return (
      <span
        aria-hidden
        className="h-10 w-10 animate-pulse rounded-full bg-[#EAE2D7] sm:h-11 sm:w-11 xl:w-28"
      />
    );
  }

  if (!me) {
    return (
      <div className="sn-guest">
        <Link href="/login">Sign in</Link>
        <span> or </span>
        <Link href="/register">register</Link>
      </div>
    );
  }

  const groups = menuFor(me);
  const close = () => setOpen(false);
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Open account menu"
        className={cn(
          "flex h-10 items-center gap-2 rounded-full border border-[#E6DDD0] bg-white p-0.5 text-sm font-medium text-[#17645F] transition-colors hover:bg-[#EAE2D7] sm:h-11 sm:p-1 xl:pr-4",
          ring,
        )}
      >
        <Avatar name={name} src={logo} />
        <span className="hidden max-w-[110px] truncate xl:inline">
          {name.split(" ")[0]}
        </span>
      </button>

      <Offcanvas
        id={panelId}
        open={open}
        onClose={close}
        side="right"
        label="Account menu"
        heading="Account"
        footer={
          <button
            type="button"
            disabled={loggingOut}
            onClick={async () => {
              await logout();
              close();
              onLoggedOut?.();
            }}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#E6DDD0] bg-white text-sm font-semibold text-destructive transition-colors hover:bg-[#F3EEE8] disabled:opacity-60",
              ring,
            )}
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Log out
          </button>
        }
      >
        {/* Who is signed in */}
        <div className="m-4 flex items-center gap-3 rounded-3xl bg-[#17645F] p-4 text-white">
          <Avatar name={name} src={logo} size={56} tone="onTeal" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{name}</p>
            <p className="truncate text-xs text-white/75">{me.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
              {roleLabel(me.role)}
            </span>
          </div>
        </div>

        {/* Links */}
        <nav aria-label="Account" className="space-y-5 px-3 pb-4">
          {groups.map((g, gi) => (
            <div key={g.label ?? gi}>
              {g.label && (
                <p className="px-3 pb-1.5 text-xs font-medium text-slate-500">
                  {g.label}
                </p>
              )}
              <div className="space-y-1">
                {g.items.map((item) => (
                  <Row
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    onNavigate={close}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </Offcanvas>
    </>
  );
}

/** Kept so existing imports keep working. */
export function AuthSlot() {
  return <ProfileMenu />;
}
