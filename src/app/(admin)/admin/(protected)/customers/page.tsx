"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { adminApi, type AdminUser } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminCustomersPage() {
  const [q, setQ] = useState("");
  const [customers, setCustomers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listCustomers({ q: q.trim() || undefined, limit: 50 });
      setCustomers(res.customers ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function action(id: string, kind: string) {
    if (!reason.trim()) {
      setError("Reason required");
      return;
    }
    try {
      setBusyId(id);
      await adminApi.customerAction(id, kind, reason);
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-zinc-500">{total} customer{total === 1 ? "" : "s"}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input className="pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Input placeholder="Reason for suspend/restrict/ban/restore" value={reason} onChange={(e) => setReason(e.target.value)} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">No customers</div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {customers.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">{c.name || c.email}</div>
                  <div className="text-xs text-zinc-500">{c.email}</div>
                  <span
                    className={cn(
                      "mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                      c.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["suspend", "restrict", "ban", "restore"] as const).map((k) => (
                    <Button
                      key={k}
                      size="sm"
                      variant="ghost"
                      className="border text-xs capitalize"
                      disabled={busyId === c.id}
                      onClick={() => action(c.id, k)}
                    >
                      {k}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
