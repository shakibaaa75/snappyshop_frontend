"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  ExternalLink,
  Ban,
  ShieldOff,
  Shield,
  RotateCcw,
  Star,
  CreditCard,
} from "lucide-react";
import {
  adminApi,
  type AdminUser,
  type SellerSummary,
  type Restriction,
  type AdminNote,
  type SubscriptionOverride,
  type SellerPromotion,
  type SlugChange,
} from "@/lib/api/admin";
import { formatSlugDate, slugSourceLabel } from "@/lib/slug-history";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { SellerFeatureManager } from "@/components/admin/SellerFeatureManager";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Tab =
  | "profile"
  | "performance"
  | "subscription"
  | "features"
  | "notes"
  | "history"
  | "slugs";

export default function SellerControlCenterPage() {
  const params = useParams();
  const id = String(params.id ?? "");

  const [tab, setTab] = useState<Tab>("profile");
  const [seller, setSeller] = useState<AdminUser | null>(null);
  const [summary, setSummary] = useState<SellerSummary | null>(null);
  const [history, setHistory] = useState<Restriction[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [subs, setSubs] = useState<SubscriptionOverride[]>([]);
  const [promos, setPromos] = useState<SellerPromotion[]>([]);
  const [slugHistory, setSlugHistory] = useState<SlugChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Action forms
  const [reason, setReason] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [noteBody, setNoteBody] = useState("");
  const [grantPlan, setGrantPlan] = useState("pro");
  const [grantDays, setGrantDays] = useState(30);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSeller(id);
      setSeller(data.seller);
      setSummary(data.summary);
      setHistory(data.restrictionHistory ?? []);
      setNotes(data.notes ?? []);
      setSubs(data.subscriptionHistory ?? []);
      setPromos(data.promotions ?? []);
      setSlugHistory(data.slugHistory ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load seller");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(fn: () => Promise<unknown>, success: string) {
    if (
      !reason.trim() &&
      success !== "Note added" &&
      !success.includes("Feature")
    ) {
      setActionMsg("Reason is required for this action.");
      return;
    }
    try {
      setBusy(true);
      setActionMsg(null);
      await fn();
      setActionMsg(success);
      setReason("");
      await load();
    } catch (e) {
      setActionMsg(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading seller…
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/sellers"
          className="inline-flex items-center gap-1 text-sm text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sellers
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error ?? "Seller not found"}
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "performance", label: "Performance" },
    { id: "subscription", label: "Subscription" },
    { id: "features", label: "Features" },
    { id: "notes", label: "Admin notes" },
    { id: "history", label: "Restriction history" },
    {
      id: "slugs",
      label: `Slug history${slugHistory.length ? ` (${slugHistory.length})` : ""}`,
    },
  ];

  // Suspended and banned stores are not public, so a storefront link would 404.
  const storeHidden =
    seller.status === "suspended" || seller.status === "banned";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/sellers"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Sellers
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {seller.name}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">{seller.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                seller.status === "active" && "bg-emerald-100 text-emerald-800",
                seller.status === "suspended" && "bg-amber-100 text-amber-800",
                seller.status === "restricted" &&
                  "bg-orange-100 text-orange-800",
                seller.status === "banned" && "bg-red-100 text-red-800",
              )}
            >
              {seller.status}
            </span>
            {summary?.Plan && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-blue-800">
                {summary.Plan}
                {summary.IsPromotionalPlan ? " · promo" : ""}
              </span>
            )}
            {summary?.StoreSlug && storeHidden && (
              <span className="text-xs text-zinc-500">
                Store hidden from the public
              </span>
            )}
            {summary?.StoreSlug && !storeHidden && (
              <a
                href={`/store/${summary.StoreSlug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                View storefront <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {actionMsg && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            actionMsg.toLowerCase().includes("fail") ||
              actionMsg.toLowerCase().includes("required")
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          {actionMsg}
        </div>
      )}

      {/* Quick actions */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Account actions</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Every action requires a reason and is audited.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Textarea
            placeholder="Reason (required for suspend / restrict / ban / restore)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">Duration (days)</label>
              <Input
                type="number"
                min={1}
                className="h-8 w-24"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value) || 7)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className="border border-amber-200 text-amber-800 hover:bg-amber-50"
                onClick={() =>
                  runAction(
                    () => adminApi.suspendSeller(id, reason, durationDays),
                    "Seller suspended",
                  )
                }
              >
                <ShieldOff className="mr-1.5 h-3.5 w-3.5" /> Suspend
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className="border border-orange-200 text-orange-800 hover:bg-orange-50"
                onClick={() =>
                  runAction(
                    () => adminApi.restrictSeller(id, reason, durationDays),
                    "Seller restricted",
                  )
                }
              >
                <Shield className="mr-1.5 h-3.5 w-3.5" /> Restrict
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className="border border-red-200 text-red-800 hover:bg-red-50"
                onClick={() =>
                  runAction(
                    () => adminApi.banSeller(id, reason),
                    "Seller banned",
                  )
                }
              >
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Ban
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className="border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                onClick={() =>
                  runAction(
                    () => adminApi.restoreSeller(id, reason),
                    "Seller restored",
                  )
                }
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition",
              tab === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard title="Account">
            <Row label="Name" value={seller.name} />
            <Row label="Email" value={seller.email} />
            <Row label="Status" value={seller.status} />
            <Row
              label="Joined"
              value={
                seller.createdAt
                  ? new Date(seller.createdAt).toLocaleString()
                  : "—"
              }
            />
          </InfoCard>
          <InfoCard title="Store">
            <Row label="Store name" value={summary?.StoreName || "—"} />
            <Row label="Slug" value={summary?.StoreSlug || "—"} />
            <Row
              label="Verification"
              value={summary?.VerificationStatus || "none"}
            />
            <Row
              label="Restriction"
              value={summary?.RestrictionKind || "none"}
            />
          </InfoCard>
        </div>
      )}

      {tab === "performance" && summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Total products" value={summary.TotalProducts} />
          <Metric
            label="Published products"
            value={summary.PublishedProducts}
          />
          <Metric label="Total orders" value={summary.TotalOrders} />
          <Metric
            label="Delivered orders"
            value={summary.DeliveredOrders}
            tone="success"
          />
          <Metric
            label="Cancelled orders"
            value={summary.CancelledOrders}
            tone="warn"
          />
          <Metric label="Plan" value={summary.Plan} />
        </div>
      )}

      {tab === "subscription" && (
        <div className="space-y-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4" /> Grant promotional subscription
            </h3>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-zinc-500">Plan</label>
                <select
                  className="mt-1 block h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  value={grantPlan}
                  onChange={(e) => setGrantPlan(e.target.value)}
                >
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Days</label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1 h-9 w-24"
                  value={grantDays}
                  onChange={(e) => setGrantDays(Number(e.target.value) || 30)}
                />
              </div>
              <Button
                size="sm"
                disabled={busy || !reason.trim()}
                onClick={() =>
                  runAction(
                    () =>
                      adminApi.grantSubscription(id, {
                        plan: grantPlan,
                        durationDays: grantDays,
                        isPromotional: true,
                        discountPct: 100,
                        reason,
                      }),
                    `Granted free ${grantPlan} for ${grantDays} days`,
                  )
                }
              >
                Grant free access
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className="border"
                onClick={() =>
                  runAction(
                    () =>
                      adminApi.featureSeller(id, {
                        kind: "feature",
                        priority: 10,
                        durationDays: 14,
                        reason: reason || "Featured by admin",
                      }),
                    "Seller featured",
                  )
                }
              >
                <Star className="mr-1.5 h-3.5 w-3.5" /> Feature store
              </Button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Use the reason field above. Promo grants do not count as
              subscription revenue.
            </p>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
              Subscription override history
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {subs.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-zinc-500">
                  No overrides
                </li>
              )}
              {subs.map((o) => (
                <li key={o.id} className="px-4 py-3 text-sm">
                  <div className="font-medium capitalize">
                    {o.plan} {o.isPromotional ? "(promotional)" : ""}{" "}
                    {o.active ? (
                      <span className="text-emerald-600">· active</span>
                    ) : (
                      <span className="text-zinc-400">· inactive</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {new Date(o.startsAt).toLocaleDateString()} →{" "}
                    {new Date(o.endsAt).toLocaleDateString()} · {o.reason}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {promos.length > 0 && (
            <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
                Promotions
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {promos.map((p) => (
                  <li key={p.id} className="px-4 py-3 text-sm">
                    <div className="font-medium capitalize">
                      {p.kind} {p.active ? "· active" : "· ended"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {p.reason || "—"}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === "features" && <SellerFeatureManager sellerId={id} />}

      {tab === "notes" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Private admin note (not visible to seller)"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button
              disabled={busy || !noteBody.trim()}
              onClick={async () => {
                try {
                  setBusy(true);
                  await adminApi.addSellerNote(id, noteBody);
                  setNoteBody("");
                  setActionMsg("Note added");
                  await load();
                } catch (e) {
                  setActionMsg(e instanceof ApiError ? e.message : "Failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Add
            </Button>
          </div>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {notes.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">
                No notes yet
              </li>
            )}
            {notes.map((n) => (
              <li key={n.id} className="px-4 py-3 text-sm">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "slugs" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            Current slug:{" "}
            <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
              {summary?.StoreSlug ? `/${summary.StoreSlug}` : "—"}
            </span>
            . Previous slugs are retired for good: they return 404 and cannot be
            reused.
          </p>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {slugHistory.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">
                This seller has never changed their store slug
              </li>
            )}
            {slugHistory.map((c) => (
              <li key={c.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="text-zinc-500 line-through decoration-zinc-300">
                    /{c.oldSlug}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="font-medium">/{c.newSlug}</span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  {formatSlugDate(c.changedAt)} · {slugSourceLabel(c.source)}
                  {c.storeName ? ` · new shop name “${c.storeName}”` : ""}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "history" && (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {history.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              No restriction history
            </li>
          )}
          {history.map((h) => (
            <li key={h.id} className="px-4 py-3 text-sm">
              <div className="font-medium capitalize">
                {h.kind}{" "}
                {h.active && h.kind !== "restore" ? (
                  <span className="text-amber-600">· active</span>
                ) : null}
              </div>
              <div className="text-xs text-zinc-500">{h.reason}</div>
              <div className="mt-1 text-[11px] text-zinc-400">
                {new Date(h.createdAt).toLocaleString()}
                {h.endsAt
                  ? ` · ends ${new Date(h.endsAt).toLocaleString()}`
                  : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900",
        tone === "success" && "border-emerald-200",
        tone === "warn" && "border-amber-200",
      )}
    >
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
