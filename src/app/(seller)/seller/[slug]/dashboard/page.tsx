"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarDays,
  Package,
  Plus,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { qk } from "@/lib/query/keys";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";
import { authApi } from "@/lib/api/auth";
import { sellerProducts } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import {
  sellerOrders,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  formatBDT,
} from "@/lib/api/orders";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type OrderLike = { createdAt: string; total: number; status: string };

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-amber-500",
  "bg-sky-600",
  "bg-rose-500",
  "bg-violet-600",
  "bg-teal-600",
];

function avatarColor(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Order counts for the last 7 days or the last 6 months. */
function buildBars(orders: OrderLike[], mode: "weekly" | "monthly") {
  const now = new Date();
  const buckets: { label: string; value: number }[] = [];

  if (mode === "weekly") {
    const today = startOfDay(now);
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const value = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= day.getTime() && t < next.getTime();
      }).length;
      buckets.push({ label: DAYS[day.getDay()], value });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return (
          d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth()
        );
      }).length;
      buckets.push({ label: MONTHS[m.getMonth()], value });
    }
  }
  return buckets;
}

/** Delivered revenue per day over the last 30 days. */
function buildRevenueSeries(orders: OrderLike[]) {
  const today = startOfDay(new Date());
  const series: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    series.push(
      orders
        .filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return (
            o.status === "delivered" && t >= day.getTime() && t < next.getTime()
          );
        })
        .reduce((sum, o) => sum + o.total, 0),
    );
  }
  return series;
}

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10;
  return step * pow;
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted", className)}
      style={style}
    />
  );
}

function RecentOrdersSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl px-1 py-2">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueCardSkeleton() {
  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl bg-primary p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20 bg-white/20" />
        <Skeleton className="h-4 w-4 rounded bg-white/20" />
      </div>
      <Skeleton className="mt-5 h-3 w-14 bg-white/20" />
      <Skeleton className="mt-2 h-8 w-36 max-w-full bg-white/25" />
      <div className="mt-5 flex justify-between">
        <Skeleton className="h-3 w-16 bg-white/20" />
        <Skeleton className="h-3 w-14 bg-white/20" />
      </div>
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div className="mt-6 flex h-52 items-end justify-between gap-2 px-1 sm:h-64 sm:gap-4">
      {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
        <Skeleton
          key={i}
          className="w-full max-w-[52px] rounded-full"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function SalesTrendSkeleton() {
  return (
    <div className="mt-3 space-y-4">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-3 w-20" />
        <Skeleton className="mx-auto h-8 w-28" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl sm:h-28" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-2xl" />
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SellerDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [range, setRange] = useState<"weekly" | "monthly">("monthly");

  const { data: me } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 30_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: qk.seller.stats(),
    queryFn: () => sellerOrders.stats(),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: qk.seller.orders.list("all"),
    queryFn: () => sellerOrders.list({ status: "all", limit: 100 }),
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: qk.seller.products.list(),
    queryFn: sellerProducts.list,
  });

  const allOrders = useMemo(() => orders ?? [], [orders]);
  const recent = allOrders.slice(0, 5);
  const bars = useMemo(() => buildBars(allOrders, range), [allOrders, range]);
  const series = useMemo(() => buildRevenueSeries(allOrders), [allOrders]);

  const firstName = (me?.name || "").trim().split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const recentCustomers = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const o of allOrders) {
      if (!seen.has(o.customerName)) {
        seen.add(o.customerName);
        out.push(o.customerName);
      }
      if (out.length >= 5) break;
    }
    return out;
  }, [allOrders]);

  const inventory = useMemo(() => {
    const list = products ?? [];
    let value = 0;
    let units = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const p of list) {
      const stock = p.stock ?? 0;
      value += (p.price ?? 0) * stock;
      units += stock;
      if (stock === 0) outOfStock++;
      else if (stock <= 5) lowStock++;
    }
    return {
      count: list.length,
      value,
      units,
      lowStock,
      outOfStock,
    };
  }, [products]);

  return (
    <div className="w-full min-w-0 max-w-full space-y-5">
      {/* Welcome row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">
          Welcome Back,{" "}
          <span className="break-words text-muted-foreground">{firstName}</span>
        </h1>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-card px-3 py-2 text-sm shadow-sm sm:inline-flex sm:px-4 sm:py-2.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {today}
          </span>
          <Link
            href={`/seller/${slug}/products/new`}
            className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-primary/90 hover:text-white sm:px-4 sm:py-2.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Messages from the ShopBD team (only when there is something unread) */}
      <NotificationBanner />

      {/* ---------- Recent Orders + Total Revenue ---------- */}
      {/* grid-cols-1 = minmax(0,1fr): stops the implicit "auto" column from
          growing wider than the screen on mobile. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        {/* Recent Orders */}
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Recent Orders</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The 5 most recent orders at your store
              </p>
            </div>
            <ArrowButton href={`/seller/${slug}/orders`} />
          </div>

          {ordersLoading ? (
            <RecentOrdersSkeleton />
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Package className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No orders yet. When someone buys from your store, it shows up
                here.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: stacked cards */}
              <div className="mt-4 min-w-0 space-y-3 md:hidden">
                {recent.map((o) => {
                  const c = ORDER_STATUS_COLOR[o.status];
                  const d = new Date(o.createdAt);
                  return (
                    <Link
                      key={o.id}
                      href={`/seller/${slug}/orders/${o.id}`}
                      className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-muted/50 p-3 transition active:bg-muted"
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                          avatarColor(o.customerName),
                        )}
                      >
                        {o.customerName.trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {o.number} · {o.customerName}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {d.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          · {PAYMENT_LABEL[o.paymentMethod]}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="whitespace-nowrap text-sm font-semibold">
                          {formatBDT(o.total)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            c.bg,
                            c.text,
                          )}
                        >
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full", c.dot)}
                          />
                          {ORDER_STATUS_LABEL[o.status]}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Tablet / desktop: table */}
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-normal">Order</th>
                      <th className="px-3 py-2 font-normal">Date</th>
                      <th className="px-3 py-2 font-normal">Time</th>
                      <th className="px-3 py-2 font-normal">Status</th>
                      <th className="px-3 py-2 text-right font-normal">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((o) => {
                      const c = ORDER_STATUS_COLOR[o.status];
                      const d = new Date(o.createdAt);
                      return (
                        <tr key={o.id} className="group">
                          <td className="rounded-l-2xl px-3 py-3 transition group-hover:bg-muted">
                            <Link
                              href={`/seller/${slug}/orders/${o.id}`}
                              className="flex items-center gap-3"
                            >
                              <span
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                                  avatarColor(o.customerName),
                                )}
                              >
                                {o.customerName.trim().charAt(0).toUpperCase()}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-medium">
                                  {o.number} · {o.customerName}
                                </span>
                                <span className="block text-[11px] text-emerald-600">
                                  {PAYMENT_LABEL[o.paymentMethod]}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3 transition group-hover:bg-muted">
                            {d.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-3 py-3 transition group-hover:bg-muted">
                            {d.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-3 py-3 transition group-hover:bg-muted">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                c.bg,
                                c.text,
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  c.dot,
                                )}
                              />
                              {ORDER_STATUS_LABEL[o.status]}
                            </span>
                          </td>
                          <td className="rounded-r-2xl px-3 py-3 text-right font-medium transition group-hover:bg-muted">
                            {formatBDT(o.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        {/* Total Revenue + Avg order */}
        <div className="grid min-w-0 grid-cols-1 content-start gap-5 md:grid-cols-2 lg:grid-cols-1">
          <Card>
            <CardHead
              title="Total Revenue"
              sub="From delivered orders"
              href={`/seller/${slug}/analytics`}
            />
            {statsLoading ? (
              <RevenueCardSkeleton />
            ) : (
              <div className="relative mt-4 overflow-hidden rounded-2xl bg-primary p-5 text-white">
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-10 right-6 h-28 w-28 rounded-full bg-white/10" />
                <p className="relative flex items-center justify-between gap-3 text-sm font-semibold italic">
                  <span className="min-w-0 truncate">{slug}</span>
                  <Wallet className="h-4 w-4 shrink-0 opacity-80" />
                </p>
                <p className="relative mt-5 text-xs text-white/70">Revenue</p>
                <p className="relative mt-0.5 break-words text-2xl font-medium tracking-tight sm:text-3xl">
                  {stats ? formatBDT(stats.revenue) : "—"}
                </p>
                <div className="relative mt-5 flex items-center justify-between gap-3 text-xs text-white/80">
                  <span className="truncate">
                    {stats ? `${stats.orderCount} orders` : "—"}
                  </span>
                  <span className="truncate">
                    {stats ? `${stats.unitsSold} units` : "—"}
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card className="flex flex-col justify-center">
            <p className="text-xs text-muted-foreground">Avg order value</p>
            {statsLoading ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 break-words text-xl font-semibold tracking-tight sm:text-2xl">
                  {stats ? formatBDT(Math.round(stats.avgOrderValue)) : "—"}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                  <TrendingUp className="h-3 w-3" /> All time
                </span>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ---------- Needs attention + Orders Overview + Sales Trend ---------- */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,300px)]">
        {/* Needs attention */}
        <Card className="md:col-span-1">
          <CardHead
            title="Needs attention"
            sub="Orders waiting on you"
            href={`/seller/${slug}/orders`}
          />
          {statsLoading ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-end gap-2">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="mb-1 h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-end gap-2">
                <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {stats ? stats.pendingCount : "—"}
                </p>
                <span className="mb-1.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  pending
                </span>
              </div>
              <div className="mt-4 rounded-2xl bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Recent customers
                </p>
                <div className="mt-2 flex items-center">
                  {recentCustomers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No customers yet
                    </p>
                  ) : (
                    recentCustomers.map((name, i) => (
                      <span
                        key={name}
                        title={name}
                        className={cn(
                          "-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-border first:ml-0 sm:h-10 sm:w-10",
                          avatarColor(name),
                        )}
                        style={{ zIndex: 10 - i }}
                      >
                        {name.trim().charAt(0).toUpperCase()}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Orders Overview */}
        <Card className="min-h-[360px] md:col-span-1 xl:min-h-[420px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted sm:h-10 sm:w-10">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="text-sm font-medium">Orders Overview</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full bg-muted p-1 text-sm">
                {(["weekly", "monthly"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={cn(
                      "rounded-full px-3 py-1.5 font-medium capitalize transition sm:px-4",
                      range === r
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r === "weekly" ? "Weekly" : "Monthly"}
                  </button>
                ))}
              </div>
              <ArrowButton href={`/seller/${slug}/orders`} />
            </div>
          </div>
          {ordersLoading ? <BarChartSkeleton /> : <BarChart bars={bars} />}
        </Card>

        {/* Sales Trend */}
        <Card className="min-h-[360px] md:col-span-2 xl:col-span-1 xl:min-h-[420px]">
          <CardHead
            title="Sales Trend"
            sub="Delivered revenue · 30 days"
            href={`/seller/${slug}/analytics`}
          />
          {ordersLoading || productsLoading ? (
            <SalesTrendSkeleton />
          ) : (
            <>
              <div className="mt-3 text-center">
                <p className="text-xs text-muted-foreground">Inventory value</p>
                <p className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                  {formatBDT(Math.round(inventory.value))}
                </p>
              </div>
              <AreaChart series={series} />

              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-2xl bg-muted px-3 py-2.5">
                  <p className="text-[11px] text-muted-foreground">Products</p>
                  <p className="text-sm font-semibold">{inventory.count}</p>
                </div>
                <div className="rounded-2xl bg-muted px-3 py-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    Units in stock
                  </p>
                  <p className="text-sm font-semibold">{inventory.units}</p>
                </div>
                <div className="rounded-2xl bg-muted px-3 py-2.5">
                  <p className="text-[11px] text-muted-foreground">Low stock</p>
                  <p className="text-sm font-semibold text-amber-600">
                    {inventory.lowStock}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted px-3 py-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    Out of stock
                  </p>
                  <p className="text-sm font-semibold text-red-600">
                    {inventory.outOfStock}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Link
                  href={`/seller/${slug}/orders`}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  View orders
                </Link>
                <Link
                  href={`/seller/${slug}/analytics`}
                  className="rounded-full bg-muted px-5 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  Analytics
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ---------- Status strip ---------- */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-full" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatusTile
            label="Pending"
            count={stats.pendingCount}
            status="pending"
          />
          <StatusTile
            label="Confirmed"
            count={stats.confirmedCount}
            status="confirmed"
          />
          <StatusTile
            label="Shipped"
            count={stats.shippedCount}
            status="shipped"
          />
          <StatusTile
            label="Delivered"
            count={stats.deliveredCount}
            status="delivered"
          />
          <StatusTile
            label="Cancelled"
            count={stats.cancelledCount}
            status="cancelled"
          />
        </div>
      ) : null}

      {/* ---------- Quick links ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          href={`/seller/${slug}/products/new`}
          title="Add a product"
          text="List something new on your store."
        />
        <QuickLink
          href={`/seller/${slug}/analytics`}
          title="View analytics"
          text="See your sales over time."
        />
        <QuickLink
          href={`/seller/${slug}/store-design`}
          title="Customize store"
          text="Colors, layout, homepage."
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full rounded-2xl bg-card p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function ArrowButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Open"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-primary/90 hover:text-white sm:h-10 sm:w-10"
    >
      <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

function CardHead({
  title,
  sub,
  href,
}: {
  title: string;
  sub: string;
  href: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
      <ArrowButton href={href} />
    </div>
  );
}

function BarChart({ bars }: { bars: { label: string; value: number }[] }) {
  const max = Math.max(...bars.map((b) => b.value), 0);
  const top = niceMax(max);
  const ticks = [4, 3, 2, 1, 0].map((i) => Math.round((top / 4) * i));
  const peakIndex = max > 0 ? bars.findIndex((b) => b.value === max) : -1;

  let delta: string | null = null;
  if (peakIndex > 0 && bars[peakIndex - 1].value > 0) {
    const pct =
      ((max - bars[peakIndex - 1].value) / bars[peakIndex - 1].value) * 100;
    delta = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  } else if (peakIndex >= 0) {
    delta = `${max} orders`;
  }

  return (
    <div className="mt-6 min-w-0">
      <div className="flex gap-2 sm:gap-3">
        <div className="flex h-52 flex-col justify-between text-right text-[11px] text-muted-foreground sm:h-64">
          {ticks.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-52 flex-col justify-between sm:h-64">
            {ticks.map((_, i) => (
              <div key={i} className="border-t border-dashed border-border" />
            ))}
          </div>
          <div className="relative flex h-52 items-end justify-between gap-1.5 sm:h-64 sm:gap-2 md:gap-4">
            {bars.map((b, i) => {
              const h =
                top > 0
                  ? Math.max((b.value / top) * 100, b.value > 0 ? 6 : 3)
                  : 3;
              const peak = i === peakIndex;
              return (
                <div
                  key={b.label + i}
                  className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                >
                  {peak && delta && (
                    <div
                      className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1"
                      style={{ bottom: `${h}%` }}
                    >
                      <span className="block whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white sm:px-2.5 sm:py-1 sm:text-[11px]">
                        {delta}
                      </span>
                      <span className="mx-auto mt-1 block h-2 w-2 rounded-full border-2 border-white bg-primary sm:h-2.5 sm:w-2.5" />
                    </div>
                  )}
                  <div
                    title={`${b.label}: ${b.value} orders`}
                    className={cn(
                      "w-full max-w-[52px] rounded-full transition-all duration-500",
                      peak
                        ? "bg-primary [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.14)_0,rgba(255,255,255,0.14)_2px,transparent_2px,transparent_6px)]"
                        : "bg-primary/45 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_6px)]",
                    )}
                    style={{ height: `${h}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between gap-1.5 sm:gap-2 md:gap-4">
            {bars.map((b, i) => (
              <span
                key={b.label + i}
                className="min-w-0 flex-1 text-center text-[10px] tracking-wide text-muted-foreground sm:text-[11px]"
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      {max === 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          No orders in this period yet.
        </p>
      )}
    </div>
  );
}

function AreaChart({ series }: { series: number[] }) {
  const id = useId().replace(/:/g, "");
  const W = 300;
  const H = 110;
  const max = Math.max(...series, 1);
  const step = W / (series.length - 1);
  const pts = series.map(
    (v, i) => [i * step, H - 8 - (v / max) * (H - 24)] as const,
  );

  const line = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, "");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-2 h-24 w-full sm:h-28"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${id})`} />
      <path
        d={line}
        fill="none"
        stroke="#047857"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StatusTile({
  label,
  count,
  status,
}: {
  label: string;
  count: number;
  status: keyof typeof ORDER_STATUS_COLOR;
}) {
  const c = ORDER_STATUS_COLOR[status];
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-full bg-card px-4 py-2.5 shadow-sm sm:px-5 sm:py-3">
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", c.dot)} />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-sm font-semibold">{count}</span>
    </div>
  );
}

function QuickLink({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm transition hover:ring-2 hover:ring-primary/40 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{title}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary/90 group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{text}</p>
    </Link>
  );
}
