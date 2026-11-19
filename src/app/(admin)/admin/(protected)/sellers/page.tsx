"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { adminApi, type AdminUser } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "restricted", label: "Restricted" },
  { value: "banned", label: "Banned" },
];

function statusBadge(status: string) {
  return cn(
    "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
    status === "active" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    status === "suspended" && "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    status === "restricted" && "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    status === "banned" && "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  );
}

function AdminSellersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "";
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [sellers, setSellers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listSellers({
        q: q.trim() || undefined,
        status: status || undefined,
        limit,
        skip,
      });
      setSellers(res.sellers ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  }, [q, status, skip]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setStatus(initialStatus);
    setSkip(0);
  }, [initialStatus]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sellers</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total} registered seller{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-9"
            placeholder="Search name or email…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSkip(0);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setStatus(f.value);
                setSkip(0);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                status === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && sellers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No sellers found
                  </td>
                </tr>
              )}
              {!loading &&
                sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/sellers/${s.id}`} className="block hover:text-blue-600">
                        <div className="font-medium">{s.name || "—"}</div>
                        <div className="text-xs text-zinc-500">{s.email}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.storeName || "—"}</div>
                      {s.storeSlug && (
                        <div className="text-xs text-zinc-500">/{s.storeSlug}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {s.plan || "free"}
                      {s.isPromotionalPlan && (
                        <span className="ml-1 text-[10px] text-amber-600">promo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {s.publishedProducts ?? 0}
                      <span className="text-zinc-400"> / {s.totalProducts ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {s.deliveredOrders ?? 0}
                      <span className="text-zinc-400"> / {s.totalOrders ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(s.status)}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">
              Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - limit))}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={skip + limit >= total}
                onClick={() => setSkip(skip + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSellersPage() {
  return (
    <Suspense fallback={null}>
      <AdminSellersContent />
    </Suspense>
  );
}
