"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Flame,
  Link2,
  Loader2,
  MousePointerClick,
  Search,
  ShoppingBag,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { qk } from "@/lib/query/keys";
import { sellerOrders, formatBDT } from "@/lib/api/orders";
import { sellerProducts } from "@/lib/api/products";
import {
  sellerAnalytics,
  sellerTracking,
  type DailyViewRow,
  type PlatformId,
} from "@/lib/api/analytics";
import { cn } from "@/lib/utils";
import { Empty, KpiTile, Panel } from "@/components/seller/analytics-ui";
import {
  FunnelPanel,
  SourcePerformancePanel,
} from "@/components/seller/funnel-panels";
import {
  connectedPlatforms,
  PlatformPanel,
} from "@/components/seller/platform-sections";
import {
  TrackingSettingsPanel,
  TRACKING_QUERY_KEY,
} from "@/components/seller/tracking-settings-panel";

type Metric = "views" | "addToCart" | "visits" | "clicks" | "purchases";

// What each chart option is called, and which field of a day it reads.
const METRICS: Record<Metric, { label: string; title: string; empty: string }> =
  {
    views: {
      label: "Product views",
      title: "Daily views",
      empty: "No view data yet.",
    },
    addToCart: {
      label: "Add to cart",
      title: "Daily add to cart",
      empty: "No add-to-cart data yet.",
    },
    visits: {
      label: "Store visits",
      title: "Daily store visits",
      empty: "No visit data yet.",
    },
    clicks: {
      label: "Product clicks",
      title: "Daily product clicks",
      empty: "No click data yet.",
    },
    purchases: {
      label: "Purchases",
      title: "Daily purchases",
      empty: "No purchase data yet.",
    },
  };

function metricValue(r: DailyViewRow, m: Metric): number {
  switch (m) {
    case "views":
      return r.views;
    case "addToCart":
      return r.addToCart;
    case "visits":
      return r.visits ?? 0;
    case "clicks":
      return r.clicks ?? 0;
    case "purchases":
      return r.purchases ?? 0;
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AnalyticsPage() {
  // Must stay above the early return below (rules of hooks).
  const [metric, setMetric] = useState<Metric>("views");
  // Which tab is open. Meta / TikTok only exist as tabs while connected.
  const [tab, setTab] = useState<"overview" | PlatformId>("overview");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: qk.seller.stats(),
    queryFn: () => sellerOrders.stats(),
  });

  const { isLoading: productsLoading } = useQuery({
    queryKey: qk.seller.products.list(),
    queryFn: sellerProducts.list,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["seller", "analytics"],
    queryFn: sellerAnalytics.overview,
  });

  // Same key as the settings panel at the bottom, so this costs no extra request.
  const { data: pixels } = useQuery({
    queryKey: TRACKING_QUERY_KEY,
    queryFn: sellerTracking.get,
  });

  const loading = statsLoading || productsLoading || analyticsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  // One tab per connected pixel. Nothing for a pixel that is not connected,
  // and no tab bar at all while none is. If the open tab's pixel gets
  // disconnected (in the settings below), fall back to Overview.
  const platformTabs = connectedPlatforms(pixels);
  const activeTab: "overview" | PlatformId =
    tab !== "overview" && platformTabs.some((t) => t.id === tab)
      ? tab
      : "overview";

  const overview = analytics?.overview;
  const traffic = analytics?.trafficSources ?? [];
  const keywords = analytics?.searchKeywords ?? [];
  const trending = analytics?.trendingProducts ?? [];
  const comparisons = analytics?.comparisons ?? [];
  const productCarts = analytics?.productCarts ?? [];
  const funnel = analytics?.funnel;
  const sources = analytics?.sources ?? [];
  // One item per day, oldest first: { date: "2026-10-10", views: 42, addToCart: 7, ... }
  const dailyViews: DailyViewRow[] = analytics?.dailyViews ?? [];

  // The chart always plots the `views` field, so we put the chosen metric in it.
  const chartRows: DailyViewRow[] = dailyViews.slice(-14).map((r) => ({
    ...r,
    views: metricValue(r, metric),
  }));
  const chartLabel = METRICS[metric].label;

  const totalTraffic = traffic.reduce((s, t) => s + t.count, 0) || 1;
  const maxKeyword = Math.max(1, ...keywords.map((k) => k.count));

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A breakdown of your store&apos;s performance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            // The settings live on the Overview tab.
            setTab("overview");
            requestAnimationFrame(() =>
              document
                .getElementById("tracking")
                ?.scrollIntoView({ behavior: "smooth", block: "start" }),
            );
          }}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Pixel settings
        </button>
      </header>

      {/* ---------- Tabs: Overview + one per connected pixel ---------- */}
      {platformTabs.length > 0 && (
        <div
          role="tablist"
          aria-label="Analytics sections"
          className="inline-flex max-w-full flex-wrap rounded-3xl bg-muted p-0.5"
        >
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setTab("overview")}
          >
            Overview
          </TabButton>
          {platformTabs.map((t) => (
            <TabButton
              key={t.id}
              active={activeTab === t.id}
              onClick={() => setTab(t.id)}
            >
              <span
                aria-hidden
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ background: t.color }}
              />
              {t.label}
            </TabButton>
          ))}
        </div>
      )}

      {activeTab !== "overview" ? (
        <PlatformPanel
          id={activeTab}
          platforms={analytics?.platforms}
          pixels={pixels}
        />
      ) : (
        <>
          {/* ---------- Top KPIs ---------- */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              icon={Eye}
              label="Product views"
              value={String(overview?.views ?? 0)}
              sub="Last 30 days"
            />
            <KpiTile
              icon={MousePointerClick}
              label="Add-to-cart rate"
              value={`${(overview?.addToCartRate ?? 0).toFixed(1)}%`}
              sub="Added to cart ÷ product views"
            />
            <KpiTile
              icon={ShoppingBag}
              label="Order confirm rate"
              value={`${(overview?.confirmRate ?? 0).toFixed(1)}%`}
              sub={`${overview?.views ?? 0} views · ${overview?.addToCartCount ?? 0} carts · ${overview?.confirmed30 ?? 0} confirmed (30 days)`}
            />
            <KpiTile
              icon={TrendingUp}
              label="Revenue"
              value={formatBDT(stats?.revenue ?? 0)}
              sub="Delivered orders"
            />
          </div>

          {/* ---------- Visitors and conversion ---------- */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              icon={Users}
              label="Unique visitors"
              value={(funnel?.visitors ?? 0).toLocaleString()}
              sub="Last 30 days"
            />
            <KpiTile
              icon={Target}
              label="Store visits"
              value={(funnel?.visits ?? 0).toLocaleString()}
              sub="One per visitor, per source, per day"
            />
            <KpiTile
              icon={ShoppingCart}
              label="Purchases"
              value={(funnel?.purchases ?? 0).toLocaleString()}
              sub={`${formatBDT(funnel?.purchaseValue ?? 0)} order value (30 days)`}
            />
            <KpiTile
              icon={TrendingUp}
              label="Conversion rate"
              value={`${(funnel?.conversionRate ?? 0).toFixed(1)}%`}
              sub="Purchases ÷ store visits"
            />
          </div>

          <h2 className="pt-2 text-lg font-semibold tracking-tight">
            Store analytics
          </h2>

          {/* ---------- Daily chart (views / add to cart / visits / clicks / purchases) + Trending ---------- */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <div className="min-w-0">
              <Panel
                title={METRICS[metric].title}
                sub="Last 14 days"
                action={<MetricToggle value={metric} onChange={setMetric} />}
              >
                {dailyViews.length === 0 ? (
                  <Empty text={METRICS[metric].empty} />
                ) : (
                  <DailyViewsChart rows={chartRows} label={chartLabel} />
                )}
              </Panel>
            </div>

            <div className="min-w-0">
              <Panel title="Trending products" sub="Fastest growing this week">
                {trending.length === 0 ? (
                  <Empty text="Nothing trending yet." />
                ) : (
                  <ul className="space-y-2">
                    {trending.slice(0, 5).map((p, i) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {p.views} views · {p.orders} orders
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            p.growth >= 0
                              ? "bg-emerald-100 text-primary"
                              : "bg-red-100 text-red-600",
                          )}
                        >
                          {p.growth >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {Math.abs(p.growth).toFixed(0)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>

          {/* ---------- Funnel + traffic source performance ---------- */}
          {/* Two columns only from 2xl: at xl the 380px funnel column left the
          7-column source table too little room. */}
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <div className="min-w-0">
              <FunnelPanel funnel={funnel} />
            </div>
            <div className="min-w-0">
              <SourcePerformancePanel sources={sources} />
            </div>
          </div>

          {/* ---------- Top added to cart ---------- */}
          <Panel title="Top added to cart" sub="Cart rate = added ÷ views">
            {productCarts.length === 0 ? (
              <Empty text="No add-to-cart data yet." />
            ) : (
              <ul className="grid gap-2 md:grid-cols-2">
                {productCarts.slice(0, 8).map((p, i) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-700 text-xs font-semibold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.addToCart} added · {p.views} views
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                      {p.rate.toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ---------- Orders & revenue ---------- */}
          <Panel title="Orders and revenue" sub="Last 6 months">
            {!overview?.monthly || overview.monthly.length === 0 ? (
              <Empty text="No order history yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-2 py-2 font-normal">Month</th>
                      <th className="px-2 py-2 text-right font-normal">
                        Orders
                      </th>
                      <th className="px-2 py-2 text-right font-normal">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.monthly.map((m) => (
                      <tr key={m.month} className="border-t">
                        <td className="px-2 py-2.5">{m.month}</td>
                        <td className="px-2 py-2.5 text-right">{m.orders}</td>
                        <td className="px-2 py-2.5 text-right font-medium">
                          {formatBDT(m.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* ---------- Traffic + Keywords ---------- */}
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="min-w-0">
              <Panel title="Traffic sources" sub="Where visitors come from">
                {traffic.length === 0 ? (
                  <Empty text="No traffic data yet." />
                ) : (
                  <ul className="space-y-3">
                    {traffic.map((t) => {
                      const pct = (t.count / totalTraffic) * 100;
                      return (
                        <li key={t.source}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className="flex min-w-0 items-center gap-2 font-medium">
                              <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">{t.label}</span>
                            </span>
                            <span className="shrink-0 font-semibold">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-sky-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="min-w-0">
              <Panel title="Search keywords" sub="What buyers search for">
                {keywords.length === 0 ? (
                  <Empty text="No search data yet." />
                ) : (
                  <ul className="space-y-2">
                    {keywords.slice(0, 8).map((k) => (
                      <li
                        key={k.term}
                        className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2"
                      >
                        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {k.term}
                        </span>
                        <div className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{
                              width: `${(k.count / maxKeyword) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-semibold">
                          {k.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>

          {/* ---------- Product comparisons ---------- */}
          <Panel
            title="Product comparisons"
            sub="Views, add-to-cart, and sales side by side"
          >
            {comparisons.length === 0 ? (
              <Empty text="Not enough product data to compare yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-2 py-2 font-normal">Product</th>
                      <th className="px-2 py-2 text-right font-normal">
                        Views
                      </th>
                      <th className="px-2 py-2 text-right font-normal">
                        Add to cart
                      </th>
                      <th className="px-2 py-2 text-right font-normal">
                        Cart rate
                      </th>
                      <th className="px-2 py-2 text-right font-normal">
                        Orders
                      </th>
                      <th className="px-2 py-2 text-right font-normal">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="flex items-center gap-2 px-2 py-2.5">
                          {c.trending && (
                            <Flame className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          )}
                          <span className="truncate font-medium">{c.name}</span>
                        </td>
                        <td className="px-2 py-2.5 text-right">{c.views}</td>
                        <td className="px-2 py-2.5 text-right">
                          {c.addToCart}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          {c.cartRate.toFixed(0)}%
                        </td>
                        <td className="px-2 py-2.5 text-right">{c.orders}</td>
                        <td className="px-2 py-2.5 text-right font-medium">
                          {formatBDT(c.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* ---------- Meta / TikTok pixels + privacy ---------- */}
          <TrackingSettingsPanel />
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Metric toggle (views / add to cart / visits / clicks / purchases)   */
/* ------------------------------------------------------------------ */

function MetricToggle({
  value,
  onChange,
}: {
  value: Metric;
  onChange: (m: Metric) => void;
}) {
  const options = (Object.keys(METRICS) as Metric[]).map((id) => ({
    id,
    label: METRICS[id].label,
  }));
  return (
    <div
      role="tablist"
      aria-label="Chart metric"
      className="inline-flex max-w-full shrink-0 flex-wrap rounded-3xl bg-muted p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition",
            value === o.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Daily line chart (used for views and add-to-cart)                   */
/* ------------------------------------------------------------------ */

function niceStep(x: number) {
  const p = 10 ** Math.floor(Math.log10(x));
  const n = x / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function DailyViewsChart({
  rows,
  label = "Views",
}: {
  rows: DailyViewRow[];
  label?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const total = rows.reduce((s, r) => s + r.views, 0);

  // growth: second half of the period vs first half
  const half = Math.floor(rows.length / 2);
  const prev = rows.slice(0, half).reduce((s, r) => s + r.views, 0);
  const curr = rows.slice(half).reduce((s, r) => s + r.views, 0);
  const growth =
    prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;

  // geometry
  const W = 600;
  const H = 240;
  const pad = { l: 36, r: 16, t: 12, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const rawMax = Math.max(1, ...rows.map((r) => r.views));
  const step = niceStep(rawMax / 4);
  const yMax = step * Math.ceil(rawMax / step);
  const ticks = Array.from(
    { length: Math.round(yMax / step) + 1 },
    (_, i) => i * step,
  );

  const x = (i: number) =>
    pad.l + (rows.length === 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / yMax) * innerH;

  const linePts = rows.map((r, i) => `${x(i)},${y(r.views)}`).join(" ");
  const areaPts = `${x(0)},${y(0)} ${linePts} ${x(rows.length - 1)},${y(0)}`;

  const BLUE = "#1f14e8";
  const gradId = `dv-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const active = hover !== null ? rows[hover] : null;
  const diff =
    hover !== null && hover > 0
      ? rows[hover].views - rows[hover - 1].views
      : null;

  const dayLabel = (d: string) => new Date(d).getDate().toString();
  const fullDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const labelEvery = rows.length > 16 ? 3 : rows.length > 10 ? 2 : 1;

  return (
    <div className="min-w-0">
      {/* Legend + total + growth */}
      <div className="mb-4">
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
          <span
            className="h-[3px] w-3 rounded-full"
            style={{ background: BLUE }}
          />
        </p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {total.toLocaleString()}
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              growth >= 0 ? "text-emerald-600" : "text-red-600",
            )}
          >
            {growth >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(growth).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative rounded-2xl bg-gradient-to-b from-muted/50 to-transparent p-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity="0.16" />
              <stop offset="100%" stopColor={BLUE} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* horizontal grid + y labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={y(t)}
                y2={y(t)}
                stroke="currentColor"
                className="text-border"
              />
              <text
                x={pad.l - 8}
                y={y(t) + 3}
                textAnchor="end"
                fontSize="10"
                className="fill-muted-foreground"
              >
                {t}
              </text>
            </g>
          ))}

          {/* vertical dotted grid */}
          {rows.map((r, i) => (
            <line
              key={r.date}
              x1={x(i)}
              x2={x(i)}
              y1={pad.t}
              y2={pad.t + innerH}
              stroke="currentColor"
              className="text-border"
              strokeDasharray="2 4"
            />
          ))}

          {/* area + line */}
          <polygon points={areaPts} fill={`url(#${gradId})`} />
          <polyline
            points={linePts}
            fill="none"
            stroke={BLUE}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* x labels (day of month) */}
          {rows.map((r, i) =>
            i % labelEvery === 0 ? (
              <text
                key={r.date}
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize="10"
                className={
                  hover === i
                    ? "fill-foreground font-semibold"
                    : "fill-muted-foreground"
                }
              >
                {dayLabel(r.date)}
              </text>
            ) : null,
          )}

          {/* hover guide + dot */}
          {hover !== null && active && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={pad.t}
                y2={pad.t + innerH}
                stroke="#1e2340"
                strokeWidth="1.5"
              />
              <circle
                cx={x(hover)}
                cy={y(active.views)}
                r="4"
                fill="#fff"
                stroke={BLUE}
                strokeWidth="2"
              />
            </g>
          )}

          {/* hit areas */}
          {rows.map((r, i) => {
            const w = rows.length === 1 ? innerW : innerW / (rows.length - 1);
            return (
              <rect
                key={r.date}
                x={x(i) - w / 2}
                y={pad.t}
                width={w}
                height={innerH + pad.b}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            );
          })}
        </svg>

        {/* tooltip */}
        {hover !== null && active && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl bg-[#232848] px-3.5 py-2.5 text-white shadow-lg"
            style={{
              left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%`,
            }}
          >
            <p className="text-[11px] text-white/90">{fullDate(active.date)}</p>
            <div className="mt-1.5 flex items-end gap-4">
              <div>
                <p className="text-lg font-semibold leading-none tabular-nums">
                  {active.views}
                </p>
                <p className="mt-1 text-[11px] text-white/70">{label}</p>
              </div>
              {diff !== null && (
                <span
                  className={cn(
                    "mb-0.5 inline-flex items-center text-[11px] font-semibold",
                    diff >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {diff >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(diff)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
