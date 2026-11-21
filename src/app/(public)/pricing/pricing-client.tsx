"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { PlanCards } from "@/components/pricing/PlanCards";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { formatBDT } from "@/lib/api/orders";
import { qk } from "@/lib/query/keys";
import { SUBSCRIPTION_QUERY_KEY } from "@/lib/query/entitlements";
import { planCards, pricingOf, usePlanCatalog } from "@/lib/plan-catalog";
import {
  clearPlanIntent,
  readPlanIntent,
  savePlanIntent,
} from "@/lib/plan-intent";
import {
  sellerSubscription,
  type BillingInterval,
  type CheckoutInput,
  type PayMethod,
  type PlanId,
} from "@/lib/subscription";
import { quoteFor } from "@/lib/subscription-pricing";
import { cn } from "@/lib/utils";

type PaidPlanId = Exclude<PlanId, "free">;
const isPaid = (p: PlanId): p is PaidPlanId => p === "pro" || p === "business";

const METHODS: { id: PayMethod; label: string; hint: string; logo: string }[] =
  [
    {
      id: "bkash",
      label: "bKash",
      hint: "Pay with your bKash wallet",
      logo: "https://pub-26505cd19886412c924eeb2ebb98afb2.r2.dev/logs/bkash.jpg",
    },
    {
      id: "nagad",
      label: "Nagad",
      hint: "Pay with your Nagad wallet",
      logo: "https://pub-26505cd19886412c924eeb2ebb98afb2.r2.dev/logs/c43e6d712c93e777c116df19a926085b.jpg",
    },
    {
      id: "card",
      label: "Card",
      hint: "Visa, Mastercard, AmEx",
      logo: "https://pub-26505cd19886412c924eeb2ebb98afb2.r2.dev/logs/f901a15cdcc01dc9c6006e1ba7826027.jpg",
    },
  ];

export function PricingClient() {
  const router = useRouter();
  const [pending, setPending] = useState<PlanId | null>(null);
  // Not a signed-in seller: sign in or create a seller account first.
  const [askAccount, setAskAccount] = useState<PlanId | null>(null);
  // Signed-in seller: buy right here on this page.
  const [buy, setBuy] = useState<{
    plan: PaidPlanId;
    interval: BillingInterval;
  } | null>(null);

  const { data: me } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
  });
  const isSeller = me?.role === "SELLER";

  // The plan they have right now. A plan that is not active (expired, waiting
  // for payment, switched off) counts as Free, so they can buy again.
  const { catalog } = usePlanCatalog();
  const { data: sub, isFetched: subFetched } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: sellerSubscription.get,
    retry: false,
    enabled: isSeller,
  });
  const order = catalog.plans.map((p) => p.id);
  const currentPlan: PlanId = sub?.status === "active" ? sub.plan : "free";
  // You can't buy the plan you have, or one below it.
  const owned = (id: PlanId) =>
    isSeller && order.indexOf(id) <= order.indexOf(currentPlan);
  const checking = isSeller && !subFetched;

  // Coming back from sign in: open the purchase for the plan they picked.
  useEffect(() => {
    if (!isSeller || !subFetched) return;
    const intent = readPlanIntent();
    if (!intent) return;
    clearPlanIntent();
    if (
      isPaid(intent.plan) &&
      order.indexOf(intent.plan) > order.indexOf(currentPlan)
    ) {
      setBuy({ plan: intent.plan, interval: intent.interval });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller, subFetched, currentPlan]);

  useEffect(() => {
    if (!askAccount && !buy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAskAccount(null);
        setBuy(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [askAccount, buy]);

  const choose = (plan: PlanId, interval: BillingInterval) => {
    if (owned(plan)) return;
    if (me?.role === "SELLER") {
      if (isPaid(plan)) {
        // Buy it here, on the home site. No trip to the seller area.
        setBuy({ plan, interval });
        return;
      }
      // Free needs no payment.
      setPending(plan);
      router.push(
        me.storeSlug ? `/seller/${me.storeSlug}/dashboard` : "/seller/plan",
      );
      return;
    }
    // Everyone else must be a seller first.
    savePlanIntent({ plan, interval });
    setAskAccount(plan);
  };

  return (
    <div className="mx-auto w-full max-w-[var(--market-width)] px-[var(--gutter)] py-10 sm:py-16 [&_.bg-card]:shadow-none [&_.border-accent]:border-primary">
      <header className="mx-auto mb-[42px] max-w-3xl text-center">
        <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold tracking-[-.035em]">
          Simple pricing for every seller
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Start free and upgrade whenever you outgrow it. Pick a plan to become
          a seller. You can change it any time.
        </p>
      </header>

      <PlanCards
        onChoose={choose}
        pendingPlan={pending}
        isDisabled={(p) => checking || owned(p.id)}
        ctaFor={(p) =>
          owned(p.id)
            ? p.id === currentPlan
              ? "Your current plan"
              : "Included in your plan"
            : p.monthly > 0
              ? isSeller
                ? `Buy ${p.name}`
                : `Get ${p.name}`
              : "Start for free"
        }
      />

      {askAccount && (
        <Overlay onClose={() => setAskAccount(null)} label="Sell on ShopBD">
          <h2 className="text-lg font-semibold tracking-tight">
            Sell on ShopBD
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {me
              ? "Plans are for seller accounts. Sign in with your seller account, or create one."
              : "Sign in if you already have a seller account, or create a new one to continue."}
          </p>
          <div className="mt-5 space-y-2.5">
            <Link
              href="/login?next=/pricing"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              I have an account: Sign in
            </Link>
            <Link
              href="/register?role=seller"
              className="inline-flex h-11 w-full items-center justify-center rounded-full border text-sm font-semibold hover:bg-muted"
            >
              Create a seller account
            </Link>
            <button
              type="button"
              onClick={() => setAskAccount(null)}
              className="h-10 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </Overlay>
      )}

      {buy && (
        <BuyDialog
          plan={buy.plan}
          interval={buy.interval}
          onClose={() => setBuy(null)}
        />
      )}

      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">
        Paying with bKash, Nagad or card. 6 and 12 month packs cost less per
        month, and your first purchase gets an extra discount at checkout.
      </p>
    </div>
  );
}

function Overlay({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

/** Pick how to pay and go to the payment page, all from the Pricing page. */
function BuyDialog({
  plan,
  interval: initialInterval,
  onClose,
}: {
  plan: PaidPlanId;
  interval: BillingInterval;
  onClose: () => void;
}) {
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  const [method, setMethod] = useState<PayMethod>("bkash");
  const { catalog } = usePlanCatalog();
  const rules = pricingOf(catalog);
  const card = planCards(catalog).find((p) => p.id === plan);

  const { data: sub, isLoading } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: sellerSubscription.get,
    retry: false,
  });

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

  if (!card) return null;
  const q = quoteFor(
    card.monthly,
    interval,
    sub?.firstPurchaseEligible === true,
    rules,
  );
  const error = pay.error
    ? pay.error instanceof ApiError
      ? pay.error.message
      : "Could not start the payment. Please try again."
    : null;

  return (
    <Overlay onClose={onClose} label={`Buy ${card.name}`}>
      <h2 className="text-lg font-semibold tracking-tight">
        {`Buy ${card.name}`}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{card.blurb}</p>

      <div
        role="radiogroup"
        aria-label="Billing period"
        className="mt-5 grid grid-cols-3 gap-1 rounded-full border bg-muted/40 p-1"
      >
        {rules.durations.map((d) => (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={interval === d.id}
            onClick={() => setInterval(d.id)}
            className={cn(
              "flex min-h-10 flex-col items-center justify-center rounded-full px-1 text-xs font-semibold transition-colors",
              interval === d.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {d.label}
            {d.discountPct > 0 && (
              <span className="text-[10px] font-medium opacity-80">
                {`Save ${d.discountPct}%`}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-1.5 rounded-xl border bg-muted/30 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {q.months === 1
              ? `${card.name} × 1 month`
              : `${card.name} × ${q.months} months`}
          </span>
          <span className="tabular-nums">{formatBDT(q.listAmount)}</span>
        </div>
        {q.periodPct > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>{`${q.periodPct}% period discount`}</span>
            <span className="tabular-nums">
              −{formatBDT(Math.round((q.listAmount * q.periodPct) / 100))}
            </span>
          </div>
        )}
        {q.firstPurchasePct > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>{`${q.firstPurchasePct}% first purchase discount`}</span>
            <span className="tabular-nums">
              −
              {formatBDT(
                q.listAmount -
                  q.amount -
                  Math.round((q.listAmount * q.periodPct) / 100),
              )}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <span>{"Total"}</span>
          <span className="tabular-nums">{formatBDT(q.amount)}</span>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium">{"Pay with"}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            aria-pressed={method === m.id}
            title={m.hint}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs font-medium transition",
              method === m.id
                ? "border-accent ring-2 ring-accent/40"
                : "hover:bg-muted",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.logo}
              alt=""
              className="h-6 w-auto max-w-full rounded object-contain"
            />
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={pay.isPending || isLoading}
        onClick={() => pay.mutate({ plan, interval, method })}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-base font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {(pay.isPending || isLoading) && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {`Pay ${formatBDT(q.amount)}`}
      </button>
    </Overlay>
  );
}
