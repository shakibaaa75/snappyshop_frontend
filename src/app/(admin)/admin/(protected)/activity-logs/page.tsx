"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminApi, type AdminActivityLog } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listActivityLogs({ limit: 50 });
      setLogs(res.logs ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity logs</h1>
        <p className="mt-1 text-sm text-zinc-500">{total} event{total === 1 ? "" : "s"} · immutable audit trail</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">No activity yet</div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {logs.map((l) => (
              <li key={l.id} className="px-4 py-3 text-sm">
                <div className="font-medium">{l.action}</div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {l.targetType}
                  {l.targetId ? ` · ${l.targetId}` : ""}
                  {l.reason ? ` · ${l.reason}` : ""}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  Admin {l.adminId.slice(0, 8)}… · {new Date(l.createdAt).toLocaleString()}
                  {l.ip ? ` · ${l.ip}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
