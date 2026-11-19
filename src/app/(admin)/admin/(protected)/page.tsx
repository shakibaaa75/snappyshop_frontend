"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const body = (
    <div className="rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminApi.dashboard,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error instanceof ApiError
          ? error.message
          : "Could not load the dashboard."}
      </div>
    );
  }

  const s = data.stats;
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total users" value={s.TotalUsers} />
        <Stat label="Sellers" value={s.TotalSellers} href="/admin/sellers" />
        <Stat label="Active sellers" value={s.ActiveSellers} />
        <Stat
          label="Customers"
          value={s.TotalCustomers}
          href="/admin/customers"
        />
        <Stat label="Published products" value={s.PublishedProducts} />
        <Stat label="Inactive products" value={s.InactiveProducts} />
        <Stat label="Orders" value={s.TotalOrders} />
        <Stat label="Delivered orders" value={s.DeliveredOrders} />
        <Stat
          label="Subscription revenue"
          value={`৳${s.SubscriptionRevenueTaka.toLocaleString("en-BD")}`}
        />
        <Stat label="Paid subscriptions" value={s.ActivePaidSubscriptions} />
        <Stat
          label="Pending verifications"
          value={s.PendingVerifications}
          href="/admin/verifications"
        />
        <Stat
          label="Open reports"
          value={s.OpenReports}
          href="/admin/reports"
        />
        <Stat label="Suspended sellers" value={s.SuspendedSellers} />
        <Stat label="Restricted sellers" value={s.RestrictedSellers} />
        <Stat label="Banned sellers" value={s.BannedSellers} />
        <Stat label="Promo subscriptions" value={s.ActivePromoSubscriptions} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">New sellers</h2>
            <Link
              href="/admin/sellers"
              className="text-xs text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y text-sm">
            {(data.recentSellers ?? []).map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <Link
                  href={`/admin/sellers/${u.id}`}
                  className="min-w-0 hover:underline"
                >
                  <span className="block truncate font-medium">
                    {u.storeName || u.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {u.email}
                  </span>
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("en-GB")}
                </span>
              </li>
            ))}
            {!data.recentSellers?.length && (
              <li className="py-2 text-muted-foreground">Nothing yet.</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent admin activity</h2>
            <Link
              href="/admin/activity-logs"
              className="text-xs text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y text-sm">
            {(data.recentAdminLogs ?? []).map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="min-w-0 truncate font-medium">{l.action}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(l.createdAt).toLocaleString("en-GB")}
                </span>
              </li>
            ))}
            {!data.recentAdminLogs?.length && (
              <li className="py-2 text-muted-foreground">Nothing yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
