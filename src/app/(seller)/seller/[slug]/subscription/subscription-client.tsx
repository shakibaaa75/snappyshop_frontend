"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CalendarClock,
  ChevronDown,
  CreditCard,
  Gift,
  Loader2,
  Lock,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import { formatBDT } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/http";
import {
  FREE_ENTITLEMENTS,
  sellerSubscription,
  type BillingInterval,
  type CheckoutInput,
  type PayMethod,
  type PlanId,
} from "@/lib/subscription";
import {
  durationLabel,
  quoteFor,
  type Duration,
} from "@/lib/subscription-pricing";
import { planCards, pricingOf, usePlanCatalog } from "@/lib/plan-catalog";
import { SUBSCRIPTION_QUERY_KEY } from "@/lib/query/entitlements";
import { qk } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

type PaidPlanId = Exclude<PlanId, "free">;

// The plans (names, prices, limits, feature lists) and the discount
// percentages are set by an admin and come from GET /plans: see
// usePlanCatalog(). The server still holds the real prices and enforces the
// limits.

const METHODS: {
  id: PayMethod;
  label: string;
  hint: string;
  logo: string;
  color: string;
}[] = [
  {
    id: "bkash",
    label: "bKash",
    hint: "Pay with your bKash wallet",
    logo: "https://pub-26505cd19886412c924eeb2ebb98afb2.r2.dev/logs/bkash.jpg",
    color: "#e2136e",
  },
  {
    id: "nagad",
    label: "Nagad",
    hint: "Pay with your Nagad wallet",
    logo: "https://pub-26505cd19886412c924eeb2ebb98afb2.r2.dev/logs/c43e6d712c93e777c116df19a926085b.jpg",
    color: "#f6921e",
  },
  {
    id: "card",
    label: "Card",
    hint: "Visa, Mastercard, AmEx",
    logo: "https://pub-26505cd19886412c924eeb2ebb98afb2.r2.dev/logs/f901a15cdcc01dc9c6006e1ba7826027.jpg",
    color: "#2563eb",
  },
];

const methodLabel = (id: PayMethod) =>
  METHODS.find((m) => m.id === id)?.label ?? id;
const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export default function SubscriptionClient() {
  const params = useSearchParams();
  const returned = params.get("status"); // set by the backend after the gateway redirects back

  // ?plan=pro&interval=yearly comes from the Pricing / choose-plan steps.
  const planParam = params.get("plan");
  const intervalParam = params.get("interval");
  const [billing, setBilling] = useState<BillingInterval>(
    intervalParam === "half_yearly" || intervalParam === "yearly"
      ? intervalParam
      : "monthly",
  );
  const [selected, setSelected] = useState<PaidPlanId | null>(
    planParam === "pro" || planParam === "business" ? planParam : null,
  );
  const [method, setMethod] = useState<PayMethod>("bkash");
  // Bring the checkout into view when a plan is picked.
  const checkoutRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected) {
      checkoutRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selected]);

  const { catalog, isLoading: catalogLoading } = usePlanCatalog();
  const PLANS = planCards(catalog);
  const pricing = pricingOf(catalog);
  const planName = (id: PlanId) => PLANS.find((p) => p.id === id)?.name ?? id;

  const { data, isLoading, isError } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: sellerSubscription.get,
    retry: false,
    // Always check the server when the page opens, so a plan an admin just
    // gave (or an offer waiting to be claimed) shows up without waiting for
    // the 5 minute cache to expire.
    refetchOnMount: "always",
  });

  // A plan link (?plan=) for a plan they already have, or one below it, is
  // dropped: you can't buy the plan you have or a lower one while it is active.
  useEffect(() => {
    if (!selected || !data || data.status !== "active" || data.plan === "free")
      return;
    const order = catalog.plans.map((p) => p.id);
    if (order.indexOf(selected) <= order.indexOf(data.plan)) setSelected(null);
  }, [selected, data, catalog]);

  const qc = useQueryClient();
  const [claimedPlan, setClaimedPlan] = useState<PlanId | null>(null);

  // Claim a free plan an admin offered. The server answers with the updated
  // subscription, so every plan lock in the app opens immediately.
  const claim = useMutation({
    mutationFn: (grantId: string) => sellerSubscription.claimGrant(grantId),
    onSuccess: (view) => {
      qc.setQueryData(SUBSCRIPTION_QUERY_KEY, view);
      void qc.invalidateQueries({ queryKey: qk.seller.notifications.list() });
      setClaimedPlan(view.plan);
    },
    onError: () => {
      // The offer may have been claimed elsewhere or withdrawn: reload it.
      void qc.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
    },
  });
  const claimError = claim.error
    ? claim.error instanceof ApiError
      ? claim.error.message
      : "Could not claim the free plan. Please try again."
    : null;

  const pay = useMutation({
    mutationFn: async (input: CheckoutInput) => {
      const res = await sellerSubscription.checkout(input);
      if (!/^https:\/\//.test(res.paymentUrl)) {
        throw new Error("Invalid payment link");
      }
      return res;
    },
    onSuccess: (res) => {
      window.location.href = res.paymentUrl;
    },
  });

  if (isLoading || catalogLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const ent = data?.entitlements ?? FREE_ENTITLEMENTS;
  const currentPlan: PlanId = data?.plan ?? "free";
  const isActive = data?.status === "active";
  const payments = data?.payments ?? [];
  // You can't buy the plan you have, or a lower one, while it is active.
  const planRank = (id: PlanId) => PLANS.findIndex((x) => x.id === id);
  const ownsPlan = (id: PlanId) =>
    isActive && currentPlan !== "free" && planRank(id) <= planRank(currentPlan);
  const pendingGrants = data?.pendingGrants ?? [];
  const selectedPlan = PLANS.find((p) => p.id === selected) ?? null;
  // First paid purchase gets an extra discount. The server decides; this only
  // draws it, using the flag it sends.
  const firstEligible = data?.firstPurchaseEligible === true;
  const quote =
    selectedPlan && selectedPlan.monthly > 0
      ? quoteFor(selectedPlan.monthly, billing, firstEligible, pricing)
      : null;
  const amount = quote?.amount ?? 0;
  // Discount amounts in taka. The first-purchase line is what is left, so the
  // lines always add up to the total shown.
  const periodSave = quote
    ? Math.round((quote.listAmount * quote.periodPct) / 100)
    : 0;
  const firstSave = quote ? quote.listAmount - quote.amount - periodSave : 0;
  // Buying the same plan while it is still active extends it from its end date.
  const extendsCurrent =
    !!selectedPlan &&
    selected === currentPlan &&
    isActive &&
    !!data?.currentPeriodEnd;
  const validUntil = quote
    ? (() => {
        const d = new Date(
          extendsCurrent && data?.currentPeriodEnd
            ? data.currentPeriodEnd
            : Date.now(),
        );
        d.setMonth(d.getMonth() + quote.months);
        return d.toISOString();
      })()
    : "";

  const payError = pay.error
    ? pay.error instanceof ApiError
      ? pay.error.message
      : "Could not start the payment. Please try again."
    : null;

  const currentCard = PLANS.find((p) => p.id === ent.plan) ?? PLANS[0];
  const onTopPlan = currentPlan === PLANS[PLANS.length - 1]?.id && isActive;
  const statusText =
    currentPlan === "free"
      ? "No payment needed"
      : isActive
        ? `Active until ${fmtDate(data?.currentPeriodEnd)}`
        : data?.status === "expired"
          ? `Expired on ${fmtDate(data?.currentPeriodEnd)}`
          : data?.status === "inactive"
            ? "Switched off. You are on Free limits right now."
            : "Waiting for payment";
  const statusLabel =
    currentPlan === "free"
      ? "Free"
      : isActive
        ? "Active"
        : data?.status === "expired"
          ? "Expired"
          : data?.status === "inactive"
            ? "Inactive"
            : "Pending";
  const statusGood = currentPlan === "free" || isActive;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Subscription
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          See what your plan includes, compare plans and pay with bKash, Nagad
          or card.
        </p>
      </header>

      {/* ---------- Result banner (after returning from the gateway) ---------- */}
      {returned === "success" && (
        <Banner tone="ok" icon={CheckCircle2}>
          Payment received. If your plan doesn&apos;t show as active yet,
          refresh in a minute.
        </Banner>
      )}
      {returned === "failed" && (
        <Banner tone="bad" icon={AlertCircle}>
          The payment failed and you were not charged. Please try again.
        </Banner>
      )}
      {returned === "cancelled" && (
        <Banner tone="warn" icon={AlertCircle}>
          Payment cancelled. Your plan hasn&apos;t changed.
        </Banner>
      )}
      {isError && (
        <Banner tone="warn" icon={AlertCircle}>
          Couldn&apos;t load your subscription, so you&apos;re shown as Free for
          now.
        </Banner>
      )}

      {/* ---------- Free plan waiting to be claimed ---------- */}
      {claimedPlan && pendingGrants.length === 0 && (
        <Banner tone="ok" icon={CheckCircle2}>
          Your free {planName(claimedPlan)} plan is now active. All of its
          features are unlocked.
        </Banner>
      )}
      {pendingGrants.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <Gift className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h2 className="text-base font-semibold">
                  {pendingGrants.length === 1
                    ? "You received a free subscription"
                    : `You received ${pendingGrants.length} free subscriptions`}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Claim it to unlock everything in the plan. Nothing changes
                  until you claim it.
                </p>
              </div>

              {pendingGrants.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Free {g.planName} plan for {g.durationLabel}
                    </p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      Reason: {g.reason}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => claim.mutate(g.id)}
                    disabled={claim.isPending}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    {claim.isPending && claim.variables === g.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Gift className="h-4 w-4" />
                    )}
                    Claim plan
                  </button>
                </div>
              ))}

              {claimError && (
                <p role="alert" className="text-sm font-medium text-red-700">
                  {claimError}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Current plan ---------- */}
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                {planName(currentPlan)} plan
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  statusGood
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    statusGood ? "bg-emerald-600" : "bg-amber-600",
                  )}
                />
                {statusLabel}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {statusText}
              {data?.source && data.source !== "payment" && isActive
                ? data.source === "admin_free"
                  ? ". Provided free by ShopBD."
                  : ". Assigned by ShopBD."
                : ""}
            </p>
          </div>
          {!onTopPlan && (
            <a
              href="#plans"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {currentPlan === "free" ? "See plans" : "Renew or upgrade"}
            </a>
          )}
        </div>

        <div className="border-t bg-muted/30 px-5 py-5 sm:px-6">
          <p className="mb-3 text-sm font-medium">What you can use now</p>
          <ul className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            {currentCard.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{f}</span>
              </li>
            ))}
            {currentCard.locked.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-muted-foreground"
              >
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Plans ---------- */}
      <section
        id="plans"
        aria-labelledby="plans-title"
        className="scroll-mt-24"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="plans-title"
              className="text-xl font-semibold tracking-tight"
            >
              Choose a plan
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Pay once for the period you pick and renew when it ends. Longer
              periods cost less per month.
            </p>
          </div>
          <DurationPicker
            value={billing}
            onChange={setBilling}
            durations={pricing.durations}
          />
        </div>

        {firstEligible && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <Tag className="h-4 w-4 shrink-0" />
            First purchase? You get an extra {pricing.firstPurchasePct}% off
            whichever period you pick.
          </p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3 md:items-stretch">
          {PLANS.map((p) => {
            const isCurrent =
              p.id === currentPlan && (p.id === "free" || isActive);
            const isPicked = selected === p.id;
            const dark = p.popular;
            const q =
              p.monthly > 0
                ? quoteFor(p.monthly, billing, firstEligible, pricing)
                : null;
            const disabled = isCurrent || p.id === "free" || ownsPlan(p.id);
            return (
              <div
                key={p.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 transition-shadow",
                  dark
                    ? "border-emerald-950 bg-emerald-950 text-white"
                    : "bg-card",
                  isPicked &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  {p.popular && (
                    <span className="rounded-full bg-emerald-400 px-2.5 py-0.5 text-xs font-semibold text-emerald-950">
                      Most popular
                    </span>
                  )}
                  {isCurrent && !p.popular && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Your plan
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    dark ? "text-emerald-100/75" : "text-muted-foreground",
                  )}
                >
                  {p.blurb}
                </p>

                <div className="mt-6 min-h-[92px]">
                  {q ? (
                    <>
                      <p className="text-4xl font-semibold tracking-tight tabular-nums">
                        {formatBDT(q.amount)}
                      </p>
                      <p
                        className={cn(
                          "mt-1.5 text-sm",
                          dark
                            ? "text-emerald-100/75"
                            : "text-muted-foreground",
                        )}
                      >
                        for {durationLabel(billing)}, about{" "}
                        {formatBDT(Math.round(q.amount / q.months))} a month
                      </p>
                      {q.totalPct > 0 && (
                        <p
                          className={cn(
                            "mt-1 text-sm font-medium",
                            dark ? "text-emerald-300" : "text-primary",
                          )}
                        >
                          Save {q.totalPct}% off{" "}
                          <span className="font-normal line-through opacity-70">
                            {formatBDT(q.listAmount)}
                          </span>
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-semibold tracking-tight">
                        Free
                      </p>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        No payment needed
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={isPicked}
                  onClick={() => {
                    if (p.id !== "free") {
                      pay.reset();
                      setSelected(p.id);
                    }
                  }}
                  className={cn(
                    "mt-5 h-11 w-full rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    disabled
                      ? "cursor-not-allowed bg-muted text-muted-foreground"
                      : dark
                        ? "bg-card text-emerald-950 hover:bg-muted"
                        : "bg-primary text-white hover:bg-primary/90",
                  )}
                >
                  {isCurrent
                    ? "Current plan"
                    : p.id === "free" || ownsPlan(p.id)
                      ? "Included in your plan"
                      : isPicked
                        ? "Selected"
                        : `Choose ${p.name}`}
                </button>

                <ul
                  className={cn(
                    "mt-6 space-y-2.5 border-t pt-6 text-sm",
                    dark && "border-white/15",
                  )}
                >
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          dark ? "text-emerald-300" : "text-emerald-600",
                        )}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                  {p.locked.map((f) => (
                    <li
                      key={f}
                      className={cn(
                        "flex items-start gap-2.5",
                        dark ? "text-emerald-100/55" : "text-muted-foreground",
                      )}
                    >
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {p.about && (
                  <details className="group mt-5 text-sm">
                    <summary
                      className={cn(
                        "flex cursor-pointer list-none items-center gap-1 font-medium [&::-webkit-details-marker]:hidden",
                        dark ? "text-emerald-200" : "text-primary",
                      )}
                    >
                      About {p.name}
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <p
                      className={cn(
                        "mt-2 leading-relaxed",
                        dark ? "text-emerald-100/75" : "text-muted-foreground",
                      )}
                    >
                      {p.about}
                    </p>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- Checkout ---------- */}
      {selectedPlan && quote && (
        <section
          ref={checkoutRef}
          aria-labelledby="co-title"
          className="scroll-mt-24 overflow-hidden rounded-2xl border bg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2
                id="co-title"
                className="text-lg font-semibold tracking-tight"
              >
                Checkout
              </h2>
              <div
                role="group"
                aria-label="Plan"
                className="inline-flex rounded-lg bg-muted p-0.5"
              >
                {PLANS.filter((p) => p.id !== "free" && !ownsPlan(p.id)).map(
                  (p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={selected === p.id}
                      onClick={() => {
                        pay.reset();
                        setSelected(p.id as PaidPlanId);
                      }}
                      className={cn(
                        "rounded-md px-3 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        selected === p.id
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {p.name}
                    </button>
                  ),
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                pay.reset();
                setSelected(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* ---- Left: choices ---- */}
            <div className="space-y-9 p-5 sm:p-6">
              {/* Step 1: billing period */}
              <section aria-labelledby="co-period">
                <StepHeading n={1} id="co-period" title="Billing period" />
                <div
                  role="radiogroup"
                  aria-labelledby="co-period"
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {pricing.durations.map((d) => {
                    const dq = quoteFor(
                      selectedPlan.monthly,
                      d.id,
                      firstEligible,
                      pricing,
                    );
                    const on = billing === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setBilling(d.id)}
                        className={cn(
                          "flex flex-col rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          on
                            ? "border-primary bg-emerald-50 ring-1 ring-primary dark:bg-emerald-950/40"
                            : "hover:border-foreground/30 hover:bg-muted/40",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">
                            {d.label}
                          </span>
                          <Radio on={on} color="#059669" />
                        </span>
                        <span className="mt-3 text-xl font-semibold tracking-tight tabular-nums">
                          {formatBDT(dq.amount)}
                        </span>
                        <span
                          className={cn(
                            "text-xs tabular-nums text-muted-foreground",
                            dq.totalPct > 0 ? "line-through" : "invisible",
                          )}
                        >
                          {formatBDT(dq.listAmount)}
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground">
                          about {formatBDT(Math.round(dq.amount / dq.months))} a
                          month
                        </span>
                        <span className="mt-2 flex min-h-[22px] flex-wrap gap-1.5">
                          {dq.totalPct > 0 && (
                            <span className="inline-flex rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                              Save {dq.totalPct}%
                            </span>
                          )}
                          {d.id === "yearly" && (
                            <span className="inline-flex rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              Best value
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {firstEligible && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
                    <Tag className="h-4 w-4 shrink-0" />
                    Prices include your extra {pricing.firstPurchasePct}%
                    first-purchase discount.
                  </p>
                )}
              </section>

              {/* Step 2: payment method */}
              <section aria-labelledby="co-method">
                <StepHeading n={2} id="co-method" title="Payment method" />
                <div
                  role="radiogroup"
                  aria-labelledby="co-method"
                  className="space-y-2.5"
                >
                  {METHODS.map((m) => {
                    const on = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setMethod(m.id)}
                        className="flex w-full items-center gap-4 rounded-xl p-3.5 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-4"
                        style={{
                          boxShadow: on
                            ? `0 0 0 2px ${m.color}`
                            : "0 0 0 1px hsl(var(--border))",
                        }}
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card p-1.5 ring-1 ring-black/5">
                          {/* Plain <img>: the logos are on an external host, so no
                              next/image remotePatterns setting is needed. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.logo}
                            alt=""
                            width={48}
                            height={48}
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">
                            {m.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {m.hint}
                          </span>
                        </span>
                        <Radio on={on} color={m.color} />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  You finish paying on the gateway&apos;s secure page, then come
                  straight back here. We never see your card or wallet PIN.
                </p>
              </section>
            </div>

            {/* ---- Right: order summary ---- */}
            <aside
              aria-label="Order summary"
              className="border-t bg-muted/30 p-5 sm:p-6 lg:border-l lg:border-t-0"
            >
              <div className="lg:sticky lg:top-24">
                <h3 className="text-base font-semibold">Order summary</h3>

                <div className="mt-4 rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {selectedPlan.name} plan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {durationLabel(billing)}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums">
                      {formatBDT(quote.listAmount)}
                    </span>
                  </div>

                  {(periodSave > 0 || firstSave > 0) && (
                    <dl className="mt-3 space-y-2 border-t border-dashed pt-3 text-sm">
                      {periodSave > 0 && (
                        <div className="flex justify-between gap-3 text-primary dark:text-emerald-400">
                          <dt>
                            {durationLabel(billing)} discount ({quote.periodPct}
                            %)
                          </dt>
                          <dd className="tabular-nums">
                            −{formatBDT(periodSave)}
                          </dd>
                        </div>
                      )}
                      {firstSave > 0 && (
                        <div className="flex justify-between gap-3 text-primary dark:text-emerald-400">
                          <dt>First purchase ({quote.firstPurchasePct}%)</dt>
                          <dd className="tabular-nums">
                            −{formatBDT(firstSave)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                  <div className="mt-3 flex items-end justify-between gap-3 border-t pt-3">
                    <span className="text-sm font-medium">Total due today</span>
                    <span className="text-3xl font-semibold tracking-tight tabular-nums">
                      {formatBDT(amount)}
                    </span>
                  </div>
                  {quote.totalPct > 0 && (
                    <p className="mt-1 text-right text-xs font-medium text-primary dark:text-emerald-400">
                      You save {formatBDT(quote.listAmount - quote.amount)} (
                      {quote.totalPct}%)
                    </p>
                  )}
                </div>

                <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {extendsCurrent
                        ? "Adds time after your current period. Valid until "
                        : "Starts today. Valid until "}
                      <span className="font-medium text-foreground">
                        {fmtDate(validUntil)}
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Paying with{" "}
                      <span className="font-medium text-foreground">
                        {methodLabel(method)}
                      </span>
                    </span>
                  </li>
                </ul>

                {payError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300"
                  >
                    {payError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={pay.isPending}
                  onClick={() =>
                    selected &&
                    pay.mutate({ plan: selected, interval: billing, method })
                  }
                  className={cn(
                    "mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    pay.isPending && "cursor-not-allowed opacity-70",
                  )}
                >
                  {pay.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Redirecting…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" /> Pay {formatBDT(amount)} with{" "}
                      {methodLabel(method)}
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                  By paying you agree to our{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/refund-policy"
                    target="_blank"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Return &amp; Refund Policy
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* ---------- Payment history ---------- */}
      <Panel title="Payment history">
        {payments.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No payments yet. Your receipts will appear here after you subscribe.
          </p>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium sm:px-3">Date</th>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 font-medium">Method</th>
                  <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 text-right font-medium sm:px-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 sm:px-3">
                      {fmtDate(p.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      {planName(p.plan)}, {durationLabel(p.interval)}
                    </td>
                    <td className="px-3 py-3">{methodLabel(p.method)}</td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {formatBDT(p.amount)}
                    </td>
                    <td className="px-5 py-3 text-right sm:px-3">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                          p.status === "paid" &&
                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
                          p.status === "pending" &&
                            "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                          p.status === "failed" &&
                            "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

/** Billing period as one segmented control. */
function DurationPicker({
  value,
  onChange,
  durations,
}: {
  value: BillingInterval;
  onChange: (v: BillingInterval) => void;
  durations: Duration[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className="inline-flex max-w-full flex-wrap rounded-xl bg-muted p-1"
    >
      {durations.map((d) => {
        const on = value === d.id;
        return (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(d.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              on
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {d.label}
            {d.discountPct > 0 && (
              <span className="text-xs font-semibold text-primary dark:text-emerald-400">
                Save {d.discountPct}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Radio dot used inside the option buttons (the button itself is the radio). */
function Radio({ on, color }: { on: boolean; color: string }) {
  return (
    <span
      aria-hidden
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
      style={{
        background: on ? color : "transparent",
        border: on ? "none" : "1.5px solid hsl(var(--border))",
      }}
    >
      {on && <Check className="h-3 w-3 text-white" />}
    </span>
  );
}

function StepHeading({
  n,
  id,
  title,
}: {
  n: number;
  id: string;
  title: string;
}) {
  return (
    <h3
      id={id}
      className="mb-3 flex items-center gap-2.5 text-sm font-semibold"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
        {n}
      </span>
      {title}
    </h3>
  );
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "ok" | "bad" | "warn";
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
        tone === "ok" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200",
        tone === "bad" &&
          "border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-200",
        tone === "warn" &&
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Panel({
  title,
  sub,
  action,
  children,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
