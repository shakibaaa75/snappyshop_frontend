"use client";

import { useState, type ReactNode } from "react";
import {
  Eye,
  MousePointerClick,
  ShoppingBag,
  ShoppingCart,
  Target,
  type LucideIcon,
} from "lucide-react";
import type {
  PlatformDay,
  PlatformId,
  PlatformStats,
  TrackingSettings,
} from "@/lib/api/analytics";
import { formatBDT } from "@/lib/api/orders";
import { cn } from "@/lib/utils";
import {
  FacebookLogo,
  InstagramLogo,
  MetaLogo,
  TikTokLogo,
} from "@/components/seller/platform-logos";

/* ------------------------------------------------------------------ */
/* Platform registry                                                   */
/* To add a platform: add the backend def (platforms.go), then one     */
/* entry here with its pixel check and logo.                           */
/* ------------------------------------------------------------------ */

type PlatformDef = {
  id: PlatformId;
  name: string;
  tagline: string;
  pixelLabel: string;
  color: string;
  utm: string; // what the seller should put in ad links
  /** True when the seller saved this platform's pixel ID. */
  connected: (p?: TrackingSettings) => boolean;
  logo: ReactNode;
  channelLogos: Record<string, ReactNode>;
};

const PLATFORMS: PlatformDef[] = [
  {
    id: "meta",
    name: "Meta",
    tagline: "Facebook & Instagram",
    pixelLabel: "Meta Pixel",
    color: "#0866FF",
    utm: "?utm_source=facebook (or instagram)",
    connected: (p) => !!p?.metaPixelId,
    logo: <MetaLogo className="h-6 w-auto" />,
    channelLogos: {
      facebook: <FacebookLogo className="h-4 w-4" />,
      instagram: <InstagramLogo className="h-4 w-4" />,
    },
  },
  {
    id: "tiktok",
    name: "TikTok",
    tagline: "TikTok Ads",
    pixelLabel: "TikTok Pixel",
    color: "#FE2C55",
    utm: "?utm_source=tiktok",
    connected: (p) => !!p?.tiktokPixelId,
    logo: <TikTokLogo className="h-7 w-7" />,
    channelLogos: { tiktok: <TikTokLogo className="h-4 w-4" /> },
  },
];

type ChartMetric = "views" | "clicks" | "addToCart" | "purchases";

const CHART_METRICS: { id: ChartMetric; label: string }[] = [
  { id: "views", label: "Views" },
  { id: "clicks", label: "Clicks" },
  { id: "addToCart", label: "Add to cart" },
  { id: "purchases", label: "Purchases" },
];

/* ------------------------------------------------------------------ */
/* Tabs: one per CONNECTED platform                                    */
/* ------------------------------------------------------------------ */

export type ConnectedPlatform = {
  id: PlatformId;
  /** "Meta Pixel", "TikTok Pixel" */
  label: string;
  color: string;
};

/** The platforms whose pixel ID is saved. An unconnected platform is absent,
 *  so the page never draws a tab for it. */
export function connectedPlatforms(
  pixels?: TrackingSettings,
): ConnectedPlatform[] {
  return PLATFORMS.filter((d) => d.connected(pixels)).map((d) => ({
    id: d.id,
    label: d.pixelLabel,
    color: d.color,
  }));
}

/** The content of one platform's tab. Renders nothing if that platform's
 *  pixel is not connected. */
export function PlatformPanel({
  id,
  platforms,
  pixels,
}: {
  id: PlatformId;
  platforms?: PlatformStats[];
  pixels?: TrackingSettings;
}) {
  const def = PLATFORMS.find((d) => d.id === id);
  if (!def || !def.connected(pixels)) return null;
  const stats = (platforms ?? []).find((p) => p.platform === id);
  return <PlatformSection def={def} stats={stats} />;
}

/* ------------------------------------------------------------------ */
/* Container                                                           */
/* ------------------------------------------------------------------ */

/**
 * One section per ad platform the seller has connected (pixel ID saved).
 * Nothing is rendered when no pixel is connected. Numbers are the store's own
 * events that came from that platform's traffic (see the note under each
 * section), so no extra request is needed: they arrive with the overview.
 */
export function PlatformSections({
  platforms,
  pixels,
}: {
  platforms?: PlatformStats[];
  pixels?: TrackingSettings;
}) {
  const visible = PLATFORMS.filter((d) => d.connected(pixels));
  if (visible.length === 0) return null;

  const byId = new Map<PlatformId, PlatformStats>(
    (platforms ?? []).map((p) => [p.platform, p]),
  );

  return (
    <section className="space-y-4" aria-label="Ad platforms">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Ad platforms</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Store activity from visitors who arrived from each connected platform,
          last 30 days.
        </p>
      </div>
      {visible.map((def) => (
        <PlatformSection key={def.id} def={def} stats={byId.get(def.id)} />
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* One platform                                                        */
/* ------------------------------------------------------------------ */

function PlatformSection({
  def,
  stats,
}: {
  def: PlatformDef;
  stats?: PlatformStats;
}) {
  const [metric, setMetric] = useState<ChartMetric>("views");

  const t = stats?.totals;
  const hasData =
    !!t &&
    (t.visits > 0 ||
      t.views > 0 ||
      t.clicks > 0 ||
      t.addToCart > 0 ||
      t.purchases > 0);
  const channels = stats?.channels ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="h-1" style={{ background: def.color }} />

      <div className="space-y-5 p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {def.logo}
            <div>
              <h3 className="text-base font-semibold leading-tight">
                {def.name}
              </h3>
              <p className="text-xs text-muted-foreground">{def.tagline}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {def.pixelLabel} active
          </span>
        </header>

        {!hasData ? (
          <div className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
            <p>
              Your {def.pixelLabel} is connected. Nothing from {def.name} yet in
              the last 30 days.
            </p>
            <p className="mt-1 text-xs">
              Add <code className="rounded bg-muted px-1">{def.utm}</code> to
              your ad and post links so visitors are credited to {def.name}.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Stat
                icon={Eye}
                label="Views"
                value={t!.views.toLocaleString()}
              />
              <Stat
                icon={MousePointerClick}
                label="Clicks"
                value={t!.clicks.toLocaleString()}
              />
              <Stat
                icon={ShoppingCart}
                label="Add to cart"
                value={t!.addToCart.toLocaleString()}
                sub={`${t!.cartToPurchase.toFixed(1)}% buy`}
              />
              <Stat
                icon={ShoppingBag}
                label="Purchases"
                value={t!.purchases.toLocaleString()}
                sub={`${formatBDT(t!.purchaseValue)} order value`}
              />
              <Stat
                icon={Target}
                label="Conversion"
                value={`${t!.conversionRate.toFixed(1)}%`}
                sub={`Purchases ÷ ${t!.visits.toLocaleString()} visits`}
              />
            </div>

            {channels.length > 1 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {channels.map((c) => (
                  <li
                    key={c.source}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2"
                  >
                    {def.channelLogos[c.source]}
                    <span className="flex-1 text-sm font-medium">
                      {c.label}
                    </span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {c.views.toLocaleString()} views ·{" "}
                      {c.addToCart.toLocaleString()} carts ·{" "}
                      <span className="font-semibold text-foreground">
                        {c.purchases.toLocaleString()}
                      </span>{" "}
                      purchases
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Daily trend · last 14 days
                </p>
                <div
                  role="tablist"
                  aria-label={`${def.name} chart metric`}
                  className="inline-flex flex-wrap rounded-3xl bg-muted p-0.5"
                >
                  {CHART_METRICS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="tab"
                      aria-selected={metric === m.id}
                      onClick={() => setMetric(m.id)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition",
                        metric === m.id
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <TrendChart
                rows={(stats?.daily ?? []).slice(-14)}
                metric={metric}
                color={def.color}
                id={`${def.id}-${metric}`}
              />
            </div>
          </>
        )}

        <p className="text-[11px] text-muted-foreground">
          Counted from your own store events by where the visitor came from.
          Figures can differ from {def.name}&apos;s Ads Manager, which uses its
          own attribution. A purchase is an order placed at checkout.
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {sub}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compact trend chart                                                 */
/* ------------------------------------------------------------------ */

function TrendChart({
  rows,
  metric,
  color,
  id,
}: {
  rows: PlatformDay[];
  metric: ChartMetric;
  color: string;
  id: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
        No daily data yet.
      </div>
    );
  }

  const W = 600;
  const H = 160;
  const pad = { l: 32, r: 12, t: 10, b: 22 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const vals = rows.map((r) => r[metric]);
  const max = Math.max(1, ...vals);
  const x = (i: number) =>
    pad.l + (rows.length === 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;

  const line = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${x(0)},${y(0)} ${line} ${x(rows.length - 1)},${y(0)}`;
  const gid = `pc-${id}`;
  const labelEvery = rows.length > 10 ? 2 : 1;
  const day = (d: string) => new Date(d).getUTCDate().toString();

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-muted/50 to-transparent p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, max / 2, max].map((tick) => (
          <g key={tick}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(tick)}
              y2={y(tick)}
              stroke="currentColor"
              className="text-border"
            />
            <text
              x={pad.l - 6}
              y={y(tick) + 3}
              textAnchor="end"
              fontSize="10"
              className="fill-muted-foreground"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        <polygon points={area} fill={`url(#${gid})`} />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {rows.map((r, i) =>
          i % labelEvery === 0 ? (
            <text
              key={r.date}
              x={x(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize="10"
              className="fill-muted-foreground"
            >
              {day(r.date)}
            </text>
          ) : null,
        )}

        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.t}
              y2={pad.t + innerH}
              stroke="currentColor"
              className="text-muted-foreground/50"
            />
            <circle
              cx={x(hover)}
              cy={y(vals[hover])}
              r="4"
              fill="#fff"
              stroke={color}
              strokeWidth="2"
            />
          </g>
        )}

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

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg bg-[#232848] px-3 py-1.5 text-white shadow-lg"
          style={{
            left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%`,
          }}
        >
          <p className="text-[11px] text-white/80">
            {new Date(rows[hover].date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </p>
          <p className="text-sm font-semibold tabular-nums">{vals[hover]}</p>
        </div>
      )}
    </div>
  );
}
