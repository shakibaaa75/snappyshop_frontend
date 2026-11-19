"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { adminApi, type SellerReport } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/utils";

export default function AdminReportsPage() {
  const [items, setItems] = useState<SellerReport[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listReports({ status: status || undefined, limit: 50 });
      setItems(res.reports ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User reports</h1>
        <p className="mt-1 text-sm text-zinc-500">{total} report{total === 1 ? "" : "s"}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["", "new", "under_review", "resolved", "dismissed"].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              status === s ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800",
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">No reports</div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="block px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{r.category}</div>
                      <div className="mt-0.5 line-clamp-2 text-sm text-zinc-500">{r.description}</div>
                      <div className="mt-1 text-[11px] text-zinc-400">
                        Seller {r.sellerId.slice(0, 8)}… · {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium capitalize dark:bg-zinc-800">
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
