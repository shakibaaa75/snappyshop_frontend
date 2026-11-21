"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import {
  FRAUD_STATUS_KEY,
  fraudSavedKey,
  sellerFraud,
  type ExternalStatus,
  type FraudCheckResult,
  type RiskLevel,
} from "@/lib/api/froud";

const RISK: Record<
  RiskLevel,
  { label: string; box: string; text: string; Icon: typeof ShieldCheck }
> = {
  low: {
    label: "Low risk",
    box: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
    text: "text-primary dark:text-emerald-300",
    Icon: ShieldCheck,
  },
  medium: {
    label: "Medium risk",
    box: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    Icon: ShieldAlert,
  },
  high: {
    label: "High risk",
    box: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    Icon: ShieldAlert,
  },
  unknown: {
    label: "Not enough data",
    box: "border-border bg-muted/40",
    text: "text-muted-foreground",
    Icon: ShieldQuestion,
  },
};

const EXTERNAL_NOTE: Partial<Record<ExternalStatus, string>> = {
  off: "Courier-network data is not connected, so this uses our own records only.",
  limit: "Courier-network data is temporarily unavailable. Try again later.",
  unavailable: "Courier-network data could not be loaded right now.",
};

function words(s?: string) {
  if (!s) return "";
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function date(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background px-2 py-1.5 text-center">
      <p className="text-base font-semibold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Result({
  r,
  onRefresh,
  refreshing,
}: {
  r: FraudCheckResult;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const risk = RISK[r.risk.level] ?? RISK.unknown;
  const Icon = risk.Icon;
  const ext = r.external;
  const note =
    r.externalStatus === "saved" && ext
      ? `Includes a saved courier-network result from ${date(ext.checkedAt)}.`
      : EXTERNAL_NOTE[r.externalStatus];

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {r.checkedAt
            ? `Last checked ${dateTime(r.checkedAt)}`
            : "Saved result"}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-60"
        >
          {refreshing && <Loader2 className="h-3 w-3 animate-spin" />}
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className={cn("rounded-xl border p-3", risk.box)}>
        <div className={cn("flex items-center gap-2 font-semibold", risk.text)}>
          <Icon className="h-5 w-5" />
          {risk.label}
          {r.risk.successRate !== null && (
            <span className="ml-auto text-sm font-medium">
              {Math.round(r.risk.successRate)}% delivered
            </span>
          )}
        </div>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
          {r.risk.reasons.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium">Our records (all sellers)</p>
        {r.internal ? (
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Delivered" value={r.internal.delivered} />
            <Stat label="Cancelled" value={r.internal.cancelled} />
            <Stat label="Failed" value={r.internal.failed} />
            <Stat label="In progress" value={r.internal.open} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            This number has no orders on the platform yet.
          </p>
        )}
      </div>

      {ext && (
        <div>
          <p className="mb-1.5 text-xs font-medium">Courier network</p>
          {ext.total > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Parcels" value={ext.total} />
              <Stat label="Delivered" value={ext.success} />
              <Stat label="Cancelled" value={ext.cancel} />
            </div>
          )}
          {ext.rating && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Courier rating: {words(ext.rating)}
            </p>
          )}
        </div>
      )}

      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <p className="text-[11px] text-muted-foreground">
        An estimate to help you decide, not proof. Consider confirming by phone
        for risky orders.
      </p>
    </div>
  );
}

function Bar({ className }: { className: string }) {
  return <div className={cn("rounded-md bg-muted", className)} />;
}

/** Placeholder shaped like the result, shown while it loads or is being checked. */
function ResultSkeleton() {
  return (
    <div
      className="mt-3 animate-pulse space-y-3"
      role="status"
      aria-busy="true"
      aria-label="Loading fraud check"
    >
      <Bar className="h-3 w-36" />
      <Bar className="h-24 w-full rounded-xl" />
      <Bar className="h-3 w-40" />
      <div className="grid grid-cols-4 gap-2">
        <Bar className="h-12" />
        <Bar className="h-12" />
        <Bar className="h-12" />
        <Bar className="h-12" />
      </div>
      <Bar className="h-3 w-28" />
      <div className="grid grid-cols-3 gap-2">
        <Bar className="h-12" />
        <Bar className="h-12" />
        <Bar className="h-12" />
      </div>
    </div>
  );
}

/**
 * "Check fraud" for one order's customer. Renders nothing while the admin has
 * the feature switched off.
 */
export function FraudCheckPanel({ orderId }: { orderId: string }) {
  const qc = useQueryClient();

  const enabled = useQuery({
    queryKey: FRAUD_STATUS_KEY,
    queryFn: sellerFraud.enabled,
    staleTime: 60_000,
  });

  // The last result for this order. It stays until the seller checks again.
  const saved = useQuery({
    queryKey: fraudSavedKey(orderId),
    queryFn: () => sellerFraud.saved(orderId),
    enabled: !!enabled.data,
    staleTime: Infinity,
    retry: false,
  });

  const check = useMutation({
    mutationFn: () => sellerFraud.check(orderId),
    onSuccess: (r) => qc.setQueryData(fraudSavedKey(orderId), r),
  });

  if (enabled.isLoading) {
    return (
      <div className="mt-4 border-t pt-4">
        <ResultSkeleton />
      </div>
    );
  }
  if (!enabled.data) return null;

  const result = saved.data ?? null;
  const error = check.error
    ? check.error instanceof ApiError
      ? check.error.message
      : "Could not run the check. Please try again."
    : saved.error
      ? saved.error instanceof ApiError
        ? `Could not load the saved result: ${saved.error.message}`
        : "Could not load the saved result."
      : null;

  return (
    <div className="mt-4 border-t pt-4">
      {saved.isLoading ? (
        <ResultSkeleton />
      ) : result ? (
        <Result
          r={result}
          onRefresh={() => check.mutate()}
          refreshing={check.isPending}
        />
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={check.isPending}
          onClick={() => check.mutate()}
        >
          {check.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="mr-2 h-4 w-4" />
          )}
          Check fraud
        </Button>
      )}
      {!saved.isLoading && !result && check.isPending && <ResultSkeleton />}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
