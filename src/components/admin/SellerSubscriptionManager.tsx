"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Gift,
  Loader2,
  Lock,
  Power,
  Trash2,
  CalendarPlus,
} from "lucide-react";
import { adminApi, type AdminSubscription } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const box =
  "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";
const selectCls =
  "mt-1 block h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const SOURCE: Record<string, string> = {
  payment: "Paid online",
  admin_free: "Granted free by admin",
  admin_paid: "Paid plan set by admin",
};

const STATUS_STYLE: Record<AdminSubscription["status"], string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-zinc-200 text-zinc-700",
  expired: "bg-amber-100 text-amber-800",
  none: "bg-zinc-100 text-zinc-600",
};

function daysLeft(iso?: string) {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return d;
}

/**
 * Admin control for one seller's real subscription: assign (free or paid),
 * activate / deactivate, extend, remove. Every action needs a reason and is
 * written to the activity log by the server. A paid plan applies at once; a
 * FREE plan is only offered: the seller is notified (with your reason) and the
 * plan starts when they claim it.
 */
export function SellerSubscriptionManager({
  sellerId,
  onChanged,
}: {
  sellerId: string;
  /** Called after any change so the page can refresh its history list. */
  onChanged?: () => void;
}) {
  const [sub, setSub] = useState<AdminSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState<"pro" | "business">("pro");
  const [interval, setIntervalValue] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [free, setFree] = useState(true);
  const [customDays, setCustomDays] = useState("");
  const [extendDays, setExtendDays] = useState(30);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setSub(await adminApi.getSellerSubscription(sellerId));
    } catch (e) {
      setMsg({
        ok: false,
        text: e instanceof ApiError ? e.message : "Could not load subscription",
      });
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(
    fn: () => Promise<AdminSubscription>,
    success: string,
    reasonRequired = true,
  ) {
    if (reasonRequired && !reason.trim()) {
      setMsg({ ok: false, text: "Reason is required for this action." });
      return;
    }
    try {
      setBusy(true);
      setMsg(null);
      setSub(await fn());
      setMsg({ ok: true, text: success });
      setReason("");
      setConfirmRemove(false);
      onChanged?.();
    } catch (e) {
      setMsg({
        ok: false,
        text: e instanceof ApiError ? e.message : "Action failed",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className={cn(box, "flex items-center gap-2 text-sm text-zinc-500")}>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
      </div>
    );
  }

  const hasRecord = !!sub && sub.status !== "none";
  const left = daysLeft(sub?.currentPeriodEnd);
  const e = sub?.entitlements;
  const days = customDays.trim() === "" ? undefined : Number(customDays);
  const daysInvalid =
    days !== undefined && (!Number.isInteger(days) || days < 1 || days > 3650);

  return (
    <div className="space-y-4">
      {/* ---------- Current state ---------- */}
      <section className={box}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4" /> Current subscription
            </h3>
            <p className="mt-2 text-2xl font-bold capitalize tracking-tight">
              {sub?.status === "active" ? sub.plan : "free"}
              {sub && hasRecord && sub.status !== "active" && (
                <span className="ml-2 text-sm font-normal capitalize text-zinc-500">
                  (was {sub.plan})
                </span>
              )}
            </p>
            {hasRecord && (
              <p className="mt-1 text-xs text-zinc-500">
                {sub?.status === "active"
                  ? `Expires ${fmt(sub.currentPeriodEnd)}${
                      left !== null
                        ? ` · ${left} day${left === 1 ? "" : "s"} left`
                        : ""
                    }`
                  : sub?.status === "inactive"
                    ? `Switched off · period ends ${fmt(sub.currentPeriodEnd)}`
                    : `Expired ${fmt(sub?.currentPeriodEnd)}`}
                {sub?.source && ` · ${SOURCE[sub.source] ?? sub.source}`}
                {sub?.interval && ` · ${sub.interval}`}
              </p>
            )}
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium capitalize",
              STATUS_STYLE[sub?.status ?? "none"],
            )}
          >
            {sub?.status === "none" ? "Free (no subscription)" : sub?.status}
          </span>
        </div>

        {e && (
          <ul className="mt-4 grid gap-1.5 text-xs sm:grid-cols-3">
            {(
              [
                [`${e.maxProducts.toLocaleString()} products`, true],
                [
                  e.themes === null
                    ? "All themes"
                    : `${e.themes.length} themes`,
                  true,
                ],
                ["Meta Pixel", e.metaPixel],
                ["Pyxel", e.pyxel],
                ["Auto courier", e.autoCourier],
                ["Analytics", e.analytics],
              ] as [string, boolean][]
            ).map(([label, on]) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-1.5",
                  !on && "text-zinc-400",
                )}
              >
                {on ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {label}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Offers waiting for the seller to claim ---------- */}
      {sub?.pendingGrants && sub.pendingGrants.length > 0 && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            <Gift className="h-4 w-4" /> Waiting for the seller to claim
          </h3>
          <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
            The seller was notified. These give no access until they claim them.
          </p>
          <ul className="mt-3 space-y-2">
            {sub.pendingGrants.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm dark:bg-zinc-900"
              >
                <span className="min-w-0">
                  <span className="font-medium">
                    Free {g.planName} · {g.durationLabel}
                  </span>
                  <span className="block break-words text-xs text-zinc-500">
                    Offered {fmt(g.createdAt)} · {g.reason}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="border text-red-600"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        adminApi.revokeSubscriptionOffer(
                          sellerId,
                          g.id,
                          reason.trim(),
                        ),
                      "Offer withdrawn. The seller can no longer claim it.",
                      false,
                    )
                  }
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Withdraw
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {msg && (
        <p
          role="status"
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            msg.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {msg.text}
        </p>
      )}

      {/* ---------- Shared reason ---------- */}
      <section className={box}>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Reason (required, saved in the activity log)
        </label>
        <Input
          className="mt-1"
          value={reason}
          maxLength={300}
          onChange={(ev) => setReason(ev.target.value)}
          placeholder="e.g. Launch promo, paid by bank transfer #123, support compensation"
        />
      </section>

      {/* ---------- Assign ---------- */}
      <section className={box}>
        <h3 className="text-sm font-semibold">Assign a plan</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Free (gift): the seller gets a notification with your reason and the
          plan starts when they claim it. Paid: use it when the seller paid you
          outside the online checkout; it replaces the current subscription and
          unlocks features right away.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-zinc-500">Plan</label>
            <select
              className={selectCls}
              value={plan}
              onChange={(ev) => setPlan(ev.target.value as "pro" | "business")}
            >
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Billing period</label>
            <select
              className={selectCls}
              value={interval}
              onChange={(ev) =>
                setIntervalValue(ev.target.value as "monthly" | "yearly")
              }
            >
              <option value="monthly">Monthly (1 month)</option>
              <option value="yearly">Yearly (12 months)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">
              Custom days (optional)
            </label>
            <Input
              type="number"
              min={1}
              max={3650}
              className="mt-1 h-9 w-28"
              value={customDays}
              onChange={(ev) => setCustomDays(ev.target.value)}
              placeholder="auto"
              aria-invalid={daysInvalid}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Billing</label>
            <select
              className={selectCls}
              value={free ? "free" : "paid"}
              onChange={(ev) => setFree(ev.target.value === "free")}
            >
              <option value="free">Free (gift)</option>
              <option value="paid">Paid plan</option>
            </select>
          </div>
          <Button
            size="sm"
            disabled={busy || daysInvalid}
            onClick={() =>
              run(
                () =>
                  adminApi.assignSubscription(sellerId, {
                    plan,
                    interval,
                    days,
                    free,
                    reason: reason.trim(),
                  }),
                free
                  ? `Free ${plan === "pro" ? "Pro" : "Business"} plan offered. The seller was notified and must claim it.`
                  : `${plan === "pro" ? "Pro" : "Business"} plan assigned`,
              )
            }
          >
            {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {free ? "Offer free plan" : "Assign plan"}
          </Button>
        </div>
        {daysInvalid && (
          <p className="mt-2 text-xs text-red-600">
            Custom days must be a whole number from 1 to 3650.
          </p>
        )}
      </section>

      {/* ---------- Manage ---------- */}
      <section className={box}>
        <h3 className="text-sm font-semibold">Manage current subscription</h3>
        {!hasRecord ? (
          <p className="mt-2 text-xs text-zinc-500">
            This seller has no subscription record yet. Assign a plan above.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex items-end gap-2">
              <div>
                <label className="text-xs text-zinc-500">
                  Extend by (days)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={3650}
                  className="mt-1 h-9 w-24"
                  value={extendDays}
                  onChange={(ev) => setExtendDays(Number(ev.target.value) || 0)}
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="border"
                disabled={busy || extendDays < 1 || extendDays > 3650}
                onClick={() =>
                  run(
                    () =>
                      adminApi.extendSubscription(
                        sellerId,
                        extendDays,
                        reason.trim(),
                      ),
                    `Extended by ${extendDays} days`,
                  )
                }
              >
                <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Extend
              </Button>
            </div>

            {sub?.status === "active" ? (
              <Button
                size="sm"
                variant="ghost"
                className="border"
                disabled={busy}
                onClick={() =>
                  run(
                    () =>
                      adminApi.setSubscriptionActive(
                        sellerId,
                        false,
                        reason.trim(),
                      ),
                    "Subscription deactivated. Seller is on Free limits.",
                  )
                }
              >
                <Power className="mr-1.5 h-3.5 w-3.5" /> Deactivate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="border"
                disabled={busy || sub?.status === "expired"}
                title={
                  sub?.status === "expired"
                    ? "Expired: extend it to activate it again"
                    : undefined
                }
                onClick={() =>
                  run(
                    () =>
                      adminApi.setSubscriptionActive(
                        sellerId,
                        true,
                        reason.trim(),
                      ),
                    "Subscription activated",
                  )
                }
              >
                <Power className="mr-1.5 h-3.5 w-3.5" /> Activate
              </Button>
            )}

            {confirmRemove ? (
              <span className="flex items-center gap-2 text-xs">
                End it now?
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        adminApi.removeSubscription(sellerId, reason.trim()),
                      "Subscription removed. Seller is on Free.",
                    )
                  }
                >
                  Yes, remove
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirmRemove(false)}
                >
                  Cancel
                </Button>
              </span>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="border text-red-600"
                disabled={busy}
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          Deactivating keeps the record and end date, so you can switch it back
          on. Extending an inactive subscription turns it on again. Products
          above the Free limit are never deleted; the seller just can&apos;t add
          more.
        </p>
      </section>
    </div>
  );
}
