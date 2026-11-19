"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COURIER_STATUS_COLOR,
  COURIER_STATUS_LABEL,
  type CourierConnection,
} from "@/lib/api/couriers";
import { CourierLogo } from "@/components/seller/courier-logo";

/**
 * "Choose a courier" step shown before any parcel is booked (one order or a
 * bulk selection). Lists connected couriers to pick from, greys out the ones
 * that are not working, and shows booking errors inline.
 */
export function ShipCourierModal({
  subtitle,
  count,
  couriers,
  loading,
  selectedId,
  onSelect,
  pending,
  error,
  couriersHref,
  onSubmit,
  onClose,
}: {
  /** Line under the title, e.g. "Order SB-1001 · Collect ৳1,250 on delivery". */
  subtitle: string;
  /** How many parcels will be booked. */
  count: number;
  couriers: CourierConnection[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  pending: boolean;
  error: string | null;
  couriersHref: string;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const usable = couriers.filter((c) => c.status === "connected");
  const unusable = couriers.filter((c) => c.status !== "connected");
  const chosen = usable.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-[26px] bg-white shadow-xl sm:rounded-[26px]"
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-medium tracking-tight">
              Choose a courier
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={pending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 pt-2">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-neutral-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
              couriers…
            </div>
          )}

          {!loading && usable.length === 0 && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              {couriers.length === 0
                ? "No courier is connected yet."
                : "None of your couriers is working right now."}{" "}
              <Link href={couriersHref} className="font-medium underline">
                Open Courier Services
              </Link>{" "}
              to connect or reconnect one. You can also mark the order as
              shipped manually.
            </div>
          )}

          {usable.length > 0 && (
            <div role="radiogroup" aria-label="Courier" className="space-y-2">
              {usable.map((c) => {
                const on = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={pending}
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition disabled:opacity-60",
                      on
                        ? "bg-emerald-50 ring-2 ring-emerald-600"
                        : "bg-neutral-100 hover:bg-neutral-200/70",
                    )}
                  >
                    <CourierLogo provider={c.provider} name={c.providerName} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {c.providerName}
                        {c.label ? (
                          <span className="text-neutral-400"> · {c.label}</span>
                        ) : null}
                      </span>
                      <span className="block truncate text-[11px] text-neutral-500">
                        {c.accountHint
                          ? `Account ${c.accountHint}`
                          : "Connected"}
                      </span>
                    </span>
                    {on && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {unusable.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-medium text-neutral-500">
                Not available
              </p>
              {unusable.map((c) => {
                const color = COURIER_STATUS_COLOR[c.status];
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 opacity-80"
                  >
                    <CourierLogo
                      provider={c.provider}
                      name={c.providerName}
                      muted
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {c.providerName}
                        {c.label ? (
                          <span className="text-neutral-400"> · {c.label}</span>
                        ) : null}
                      </span>
                      {c.statusMessage && (
                        <span className="block text-[11px] text-neutral-500">
                          {c.statusMessage}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                        color.bg,
                        color.text,
                      )}
                    >
                      {COURIER_STATUS_LABEL[c.status]}
                    </span>
                  </div>
                );
              })}
              <Link
                href={couriersHref}
                className="inline-block text-xs font-medium text-emerald-700 hover:underline"
              >
                Fix in Courier Services
              </Link>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0">{error}</span>
            </div>
          )}

          <p className="mt-4 text-xs text-neutral-500">
            {count === 1
              ? "Pressing Ship books a real parcel with the courier you choose."
              : `Pressing Ship books ${count} real parcels with the courier you choose.`}
          </p>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-60"
            >
              Not now
            </button>
            <button
              type="button"
              disabled={pending || !chosen}
              onClick={onSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              {pending
                ? "Booking parcel…"
                : chosen
                  ? count === 1
                    ? `Ship with ${chosen.providerName}`
                    : `Ship ${count} with ${chosen.providerName}`
                  : "Choose a courier"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
