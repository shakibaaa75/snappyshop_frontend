"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { formatBDT } from "@/lib/api/orders";
import { qk } from "@/lib/query/keys";
import { planCards, pricingOf, usePlanCatalog } from "@/lib/plan-catalog";
import { quoteFor } from "@/lib/subscription-pricing";
import { createStoreFromOnboarding } from "@/lib/store-design/create-store";
import {
  clearPlanIntent,
  readPlanIntent,
  savePlanIntent,
  subscriptionUrl,
  type PlanIntent,
} from "@/lib/plan-intent";
import type { BillingInterval, PlanId } from "@/lib/subscription";
import { cn } from "@/lib/utils";

const FEATURES_SHOWN = 6;

/**
 * Last step of seller sign-up (/register/plan). A focused page in the sign-up
 * look: pick a plan from a short list, then continue.
 *
 * Continuing creates the store from the details typed in the sign-up wizard,
 * so there is no extra setup form. A paid pack is paid for on the Subscription
 * page as soon as the store exists, with the plan already selected.
 */
export function PlanClient() {
  const router = useRouter();
  const qc = useQueryClient();
  const busy = useRef(false);
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [period, setPeriod] = useState<BillingInterval>("monthly");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<PlanIntent | null>(null);

  const { data: me, isLoading } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
  });
  const { catalog } = usePlanCatalog();
  const plans = planCards(catalog);
  const rules = pricingOf(catalog);

  // A plan picked earlier on the public Pricing page is preselected.
  useEffect(() => {
    const saved = readPlanIntent();
    setIntent(saved);
    if (saved) setPeriod(saved.interval);
  }, []);

  useEffect(() => {
    if (isLoading || busy.current) return;
    if (!me) router.replace("/login?next=/register/plan");
    else if (me.role !== "SELLER") router.replace("/account");
    // A seller who already has a store buys plans from the dashboard.
    else if (me.storeSlug)
      router.replace(subscriptionUrl(me.storeSlug, readPlanIntent()));
  }, [me, isLoading, router]);

  if (
    isLoading ||
    !me ||
    me.role !== "SELLER" ||
    (me.storeSlug && !busy.current)
  ) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {"Loading…"}
      </div>
    );
  }

  const chosenId: PlanId = selected ?? intent?.plan ?? plans[0]?.id ?? "free";
  const chosen = plans.find((p) => p.id === chosenId) ?? plans[0];
  const chosenPaid = !!chosen && chosen.monthly > 0;

  const submit = async () => {
    if (busy.current || !chosen) return;
    busy.current = true;
    setError(null);
    setPending(true);
    const pick: PlanIntent | null = chosenPaid
      ? { plan: chosen.id, interval: period }
      : null;
    if (pick) savePlanIntent(pick);
    else clearPlanIntent();

    try {
      const slug = await createStoreFromOnboarding(me.id);
      if (!slug) {
        // No sign-up details were kept (for example browser storage is
        // blocked): the setup form asks for the store name and address.
        router.push("/seller/setup");
        return;
      }
      await qc.invalidateQueries({ queryKey: qk.auth.me });
      clearPlanIntent();
      router.replace(
        pick ? subscriptionUrl(slug, pick) : `/seller/${slug}/store-design`,
      );
    } catch (err) {
      busy.current = false;
      setPending(false);
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't create your store. Please try again.",
      );
    }
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl border border-[#dce2eb] bg-white p-6 shadow-sm sm:p-10">
      <div className="border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0C68F6]">
          Last step
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#17233a]">
          Choose your plan
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Start free, or pick a pack for more products and features. You can
          change your plan any time.
        </p>
      </div>

      {/* Billing period */}
      <div
        role="radiogroup"
        aria-label="Billing period"
        className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-[#f2f5fa] p-1"
      >
        {rules.durations.map((d) => (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={period === d.id}
            disabled={pending}
            onClick={() => setPeriod(d.id)}
            className={cn(
              "flex min-h-10 flex-col items-center justify-center rounded-full px-2 text-xs font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2 sm:text-sm motion-reduce:transition-none",
              period === d.id
                ? "bg-[#0C68F6] text-white shadow-sm"
                : "text-[#0C68F6]/70 hover:text-[#0C68F6]",
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

      {/* Plan list */}
      <div role="radiogroup" aria-label="Plan" className="mt-5 space-y-3">
        {plans.map((plan) => {
          const paid = plan.monthly > 0;
          const q = paid ? quoteFor(plan.monthly, period, false, rules) : null;
          const perMonth = q ? Math.round(q.amount / q.months) : 0;
          const active = chosenId === plan.id;
          const shown = plan.features.slice(0, FEATURES_SHOWN);
          const more = plan.features.length - shown.length;
          const pick = () => {
            if (!pending) setSelected(plan.id);
          };
          return (
            <div
              key={plan.id}
              role="radio"
              aria-checked={active}
              tabIndex={0}
              onClick={pick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  pick();
                }
              }}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2 sm:p-5 motion-reduce:transition-none",
                active
                  ? "border-[#0C68F6] bg-[#0C68F6]/5 ring-1 ring-[#0C68F6]"
                  : "border-[#dce2eb] bg-white hover:border-[#0C68F6]/50",
              )}
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className={cn(
                    "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    active
                      ? "border-[#0C68F6] bg-[#0C68F6] text-white"
                      : "border-[#c5cdd9]",
                  )}
                >
                  {active && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[#17233a]">
                      {plan.name}
                    </h2>
                    {plan.popular && (
                      <span className="rounded-full bg-[#0C68F6] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {plan.blurb}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {paid && q ? (
                    <>
                      <p className="text-xl font-extrabold tabular-nums tracking-tight text-[#17233a]">
                        {formatBDT(perMonth)}
                        <span className="text-xs font-normal text-muted-foreground">
                          {" / mo"}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {period === "monthly"
                          ? "Billed monthly"
                          : `${formatBDT(q.amount)} for ${q.months} months`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-extrabold tracking-tight text-[#17233a]">
                        Free
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        No payment needed
                      </p>
                    </>
                  )}
                </div>
              </div>

              <ul className="mt-4 grid gap-x-6 gap-y-1.5 pl-9 text-[13px] sm:grid-cols-2">
                {shown.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0C68F6]" />
                    <span>{f}</span>
                  </li>
                ))}
                {more > 0 && (
                  <li className="pl-5 text-muted-foreground">
                    {`+ ${more} more`}
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}{" "}
          <Link href="/seller/setup" className="font-semibold underline">
            Change store details
          </Link>
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="max-w-sm text-sm text-muted-foreground">
          {chosenPaid
            ? "You pay for this pack right after your store is created."
            : "No payment needed. You can upgrade any time."}
        </p>
        <Button
          type="button"
          variant="accent"
          className="h-12 rounded-full px-10 text-base"
          disabled={pending || !chosen}
          onClick={submit}
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating your
              store...
            </>
          ) : chosenPaid ? (
            `Continue with ${chosen?.name}`
          ) : (
            "Start for free"
          )}
        </Button>
      </div>
    </div>
  );
}
