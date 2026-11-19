"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { adminFeatures } from "@/lib/api/adminFeatures";
import type { FeatureInfo, FeatureKey } from "@/lib/features";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEY: FeatureKey = "try_the_look";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  locked: "bg-zinc-100 text-zinc-600",
  disabled: "bg-amber-100 text-amber-800",
  revoked: "bg-red-100 text-red-700",
};

const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

/** Grant, disable, revoke and re-enable "Try the Look" for one seller. */
export function SellerFeatureManager({ sellerId }: { sellerId: string }) {
  const [info, setInfo] = useState<FeatureInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      setInfo(await adminFeatures.get(sellerId, KEY));
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Failed to load feature access",
      );
    }
  }, [sellerId]);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<FeatureInfo>, done: string) => {
    if (!reason.trim()) {
      setError("Please enter a reason. It is saved in the activity log.");
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      setInfo(await fn());
      setReason("");
      setMsg(done);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!info && !error)
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );

  const status = info?.status ?? "locked";
  const on = status === "active";

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" /> Try the Look
        </h3>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium capitalize",
            STATUS_STYLE[status],
          )}
        >
          {status}
        </span>
      </div>

      {info && (
        <dl className="grid gap-2 text-xs text-zinc-600 sm:grid-cols-3 dark:text-zinc-400">
          <div>
            <dt className="text-zinc-400">One-time price</dt>
            <dd className="font-medium">৳{info.price}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Source</dt>
            <dd className="font-medium">
              {info.source === "purchased"
                ? "Purchased by seller"
                : info.source === "admin_granted"
                  ? "Granted by admin"
                  : "None"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Since</dt>
            <dd className="font-medium">
              {fmt(info.purchasedAt ?? info.grantedAt) || "-"}
            </dd>
          </div>
        </dl>
      )}
      {info?.note && <p className="text-xs text-zinc-500">Note: {info.note}</p>}

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      {msg && <p className="text-xs font-medium text-emerald-700">{msg}</p>}

      <div>
        <label className="text-xs text-zinc-500" htmlFor="feat-reason">
          Reason (saved in the activity log)
        </label>
        <input
          id="feat-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 block h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {!on && (
          <Button
            disabled={busy}
            onClick={() =>
              act(
                () => adminFeatures.grant(sellerId, KEY, reason.trim()),
                status === "locked" ? "Granted for free." : "Switched back on.",
              )
            }
          >
            {status === "locked" ? "Grant for free" : "Switch back on"}
          </Button>
        )}
        {on && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              act(
                () =>
                  adminFeatures.setStatus(
                    sellerId,
                    KEY,
                    "disabled",
                    reason.trim(),
                  ),
                "Disabled. Looks are hidden from buyers.",
              )
            }
          >
            Disable
          </Button>
        )}
        {(on || status === "disabled") && (
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() =>
              act(
                () =>
                  adminFeatures.setStatus(
                    sellerId,
                    KEY,
                    "revoked",
                    reason.trim(),
                  ),
                "Revoked. Looks are hidden from buyers.",
              )
            }
          >
            Revoke
          </Button>
        )}
      </div>
      <p className="text-xs text-zinc-500">
        Disabled or revoked sellers can still see and unpublish their looks, but
        buyers no longer see them and the seller can&apos;t pay again.
      </p>
    </section>
  );
}
