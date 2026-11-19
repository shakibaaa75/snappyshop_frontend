"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminApi, type SellerVerification } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<SellerVerification[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listVerifications({
        status: status || undefined,
        limit: 50,
      });
      setItems(res.verifications ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, next: string) {
    if ((next === "rejected" || next === "revoked") && !reason.trim()) {
      setError("Reason required for reject/revoke");
      return;
    }
    try {
      setBusyId(id);
      setError(null);
      await adminApi.reviewVerification(id, next, reason || undefined);
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Review failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seller verifications</h1>
        <p className="mt-1 text-sm text-zinc-500">{total} record{total === 1 ? "" : "s"}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["pending", "approved", "rejected", "revoked", ""].map((s) => (
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

      <div className="max-w-md">
        <Input
          placeholder="Rejection / revoke reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">No verifications</div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((v) => (
              <li key={v.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">{v.businessName || v.fullName || v.sellerId}</div>
                  <div className="text-xs text-zinc-500">
                    {v.status} · submitted {new Date(v.submittedAt).toLocaleString()}
                  </div>
                  {v.phone && <div className="text-xs text-zinc-500">{v.phone}</div>}
                </div>
                {v.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busyId === v.id} onClick={() => review(v.id, "approved")}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="border border-red-200 text-red-700"
                      disabled={busyId === v.id}
                      onClick={() => review(v.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
