"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { adminApi, type SlugChangeRow } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { formatSlugDate, slugSourceLabel } from "@/lib/slug-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LIMIT = 30;

export default function AdminSlugHistoryPage() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [skip, setSkip] = useState(0);
  const [rows, setRows] = useState<SlugChangeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce typing so every keystroke is not a request.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input.trim());
      setSkip(0);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listSlugHistory({ q: q || undefined, limit: LIMIT, skip });
      setRows(res.changes ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load slug history");
    } finally {
      setLoading(false);
    }
  }, [q, skip]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Store slug history</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total} change{total === 1 ? "" : "s"} · each seller has one profile that always uses its
          latest slug; old slugs are retired and return 404.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          className="pl-9"
          placeholder="Search slug, seller name or email…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Previous slug</th>
                <th className="px-4 py-3 font-medium" aria-label="changed to" />
                <th className="px-4 py-3 font-medium">New slug</th>
                <th className="px-4 py-3 font-medium">Changed on</th>
                <th className="px-4 py-3 font-medium">Current slug</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    {q ? "No slug changes match your search" : "No slug changes yet"}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/sellers/${r.sellerId}`} className="block hover:text-blue-600">
                        <div className="font-medium">{r.sellerName || "—"}</div>
                        <div className="text-xs text-zinc-500">{r.sellerEmail}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500 line-through decoration-zinc-300">
                      /{r.oldSlug}
                    </td>
                    <td className="px-1 py-3 text-zinc-400">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-medium">/{r.newSlug}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{formatSlugDate(r.changedAt)}</div>
                      <div className="text-[11px] text-zinc-400">{slugSourceLabel(r.source)}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.currentSlug ? `/${r.currentSlug}` : "—"}
                      {r.currentSlug && r.currentSlug !== r.newSlug && (
                        <span className="ml-1 text-[10px] text-zinc-400">(changed again)</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {total > LIMIT && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">
              Showing {skip + 1}–{Math.min(skip + LIMIT, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - LIMIT))}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={skip + LIMIT >= total}
                onClick={() => setSkip(skip + LIMIT)}
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
