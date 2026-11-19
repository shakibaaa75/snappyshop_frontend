import { formatBDT } from "@/lib/api/orders";
import type { FunnelStats, SourceStatRow } from "@/lib/api/analytics";
import { Empty, Panel } from "./analytics-ui";

/** Visits -> clicks -> views -> carts -> purchases, last 30 days. */
export function FunnelPanel({ funnel }: { funnel?: FunnelStats }) {
  const steps = [
    {
      label: "Store visits",
      value: funnel?.visits ?? 0,
      color: "bg-slate-500",
    },
    {
      label: "Product clicks",
      value: funnel?.productClicks ?? 0,
      color: "bg-sky-500",
    },
    {
      label: "Product views",
      value: funnel?.productViews ?? 0,
      color: "bg-sky-600",
    },
    {
      label: "Added to cart",
      value: funnel?.addToCart ?? 0,
      color: "bg-amber-500",
    },
    {
      label: "Purchases",
      value: funnel?.purchases ?? 0,
      color: "bg-emerald-600",
    },
  ];
  const max = Math.max(1, ...steps.map((s) => s.value));
  const empty = steps.every((s) => s.value === 0);

  return (
    <Panel
      title="Conversion funnel"
      sub="Last 30 days. A purchase is an order placed at checkout."
    >
      {empty ? (
        <Empty text="No store activity recorded yet." />
      ) : (
        <ul className="space-y-3">
          {steps.map((s, i) => {
            const prev = i > 0 ? steps[i - 1].value : 0;
            const stepRate =
              i > 0 && prev > 0 ? Math.min(100, (s.value / prev) * 100) : null;
            return (
              <li key={s.label} className="min-w-0">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
                  <span className="min-w-0 truncate font-medium">
                    {s.label}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold">
                      {s.value.toLocaleString()}
                    </span>
                    {stepRate !== null && (
                      <span className="ml-2 whitespace-nowrap text-muted-foreground">
                        {stepRate.toFixed(0)}% of previous
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: `${(s.value / max) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!empty && (
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Overall conversion {(funnel?.conversionRate ?? 0).toFixed(1)}%
          (purchases ÷ visits) · cart to purchase{" "}
          {(funnel?.cartToPurchase ?? 0).toFixed(1)}%. Steps count events, so a
          product added from a product card can skip the product page.
        </p>
      )}
    </Panel>
  );
}

/** Per-source visitors and conversion (Facebook, TikTok, Google, direct, ...). */
export function SourcePerformancePanel({
  sources,
}: {
  sources?: SourceStatRow[];
}) {
  const rows = sources ?? [];
  return (
    <Panel
      title="Traffic source performance"
      sub="Visitors and conversion by where they came from (last 30 days)"
    >
      {rows.length === 0 ? (
        <Empty text="No traffic data yet. Add ?utm_source=facebook (or tiktok, google) to your ad and post links to see them here." />
      ) : (
        <>
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="sticky left-0 bg-card px-2 py-2 font-normal">
                    Source
                  </th>
                  <th className="px-2 py-2 text-right font-normal">Visitors</th>
                  <th className="px-2 py-2 text-right font-normal">Visits</th>
                  <th className="px-2 py-2 text-right font-normal">
                    Add to cart
                  </th>
                  <th className="px-2 py-2 text-right font-normal">
                    Purchases
                  </th>
                  <th className="px-2 py-2 text-right font-normal">
                    Order value
                  </th>
                  <th className="px-2 py-2 text-right font-normal">
                    Conversion
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.source} className="border-t">
                    <td className="sticky left-0 whitespace-nowrap bg-card px-2 py-2.5 font-medium">
                      {r.label}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.visitors.toLocaleString()}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.visits.toLocaleString()}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.addToCart.toLocaleString()}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.purchases.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right font-medium tabular-nums">
                      {formatBDT(r.revenue)}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.conversionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Visitors who haven&apos;t accepted tracking are counted anonymously
            and can only be recognised within one day, so repeat visitors may be
            counted more than once.
          </p>
        </>
      )}
    </Panel>
  );
}
