"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  Bell,
  CreditCard,
  Flag,
  FolderTree,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { adminApi } from "@/lib/api/admin";
import { NewCategoriesBadge } from "@/components/admin/NewCategoriesBadge";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "People",
    items: [
      { href: "/admin/sellers", label: "Sellers", icon: Store },
      { href: "/admin/customers", label: "Customers", icon: Users },
      {
        href: "/admin/verifications",
        label: "Verifications",
        icon: BadgeCheck,
      },
      { href: "/admin/reports", label: "User reports", icon: Flag },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/admin/reviews", label: "Product reviews", icon: BadgeCheck },
      { href: "/admin/plans", label: "Plans & pricing", icon: CreditCard },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      {
        href: "/admin/orders/suspicious",
        label: "Suspicious orders",
        icon: ShoppingBag,
      },
      { href: "/admin/fraud", label: "Fraud check", icon: ShieldAlert },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/slug-history", label: "Slug history", icon: History },
      {
        href: "/admin/activity-logs",
        label: "Activity logs",
        icon: ScrollText,
      },
      { href: "/admin/system", label: "System health", icon: Activity },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin navigation" className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {g.title}
          </p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.href === "/admin/categories" && (
                      <NewCategoriesBadge />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * Admin chrome. The server layout (./layout.tsx) has already verified the
 * admin session and 2FA gate, so this only renders navigation and logout.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    try {
      await adminApi.adminLogout();
    } catch {
      /* the cookies may already be gone; go to login either way */
    } finally {
      qc.clear();
      router.replace("/admin/login");
      router.refresh();
    }
  }

  const logoutButton = (
    <button
      type="button"
      onClick={logout}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
    >
      <LogOut className="h-4 w-4" /> Log out
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-white lg:flex">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <ShieldCheck className="h-5 w-5 text-neutral-900" />
          <span className="text-base font-bold tracking-tight">
            Admin Panel
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t p-3">{logoutButton}</div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 font-bold">
          <ShieldCheck className="h-5 w-5" /> Admin Panel
        </span>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-100"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            aria-describedby={undefined}
            className="w-[min(85vw,320px)] p-0"
          >
            <div className="flex h-full flex-col">
              <div className="border-b px-5 py-4">
                <SheetTitle className="flex items-center gap-2 text-base font-bold">
                  <ShieldCheck className="h-5 w-5" /> Admin Panel
                </SheetTitle>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <NavLinks
                  pathname={pathname}
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>
              <div className="border-t p-3">{logoutButton}</div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:pl-[calc(16rem+2rem)] lg:pr-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
