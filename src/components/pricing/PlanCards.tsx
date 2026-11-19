"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { formatBDT } from "@/lib/api/orders";
import {
  planCards,
  pricingOf,
  usePlanCatalog,
  type PlanCard,
} from "@/lib/plan-catalog";
import { quoteFor } from "@/lib/subscription-pricing";
import type { BillingInterval, PlanId } from "@/lib/subscription";
import { cn } from "@/lib/utils";

/**
 * The plan cards with the 1 / 6 / 12 month switch. Used by the public Pricing
 * page and by the "choose your plan" step after a seller registers. What
 * happens on click is up to the page (onChoose).
 */
export function PlanCards({
  onChoose,
  ctaFor,
  isDisabled,
  pendingPlan,
  highlightPlan,
  defaultInterval = "monthly",
}: {
  onChoose: (plan: PlanId, interval: BillingInterval) => void;
  ctaFor: (plan: PlanCard) => string;
  /** Plans the visitor can't pick (e.g. the one they already have). */
  isDisabled?: (plan: PlanCard) => boolean;
  /** Shows a spinner on this plan's button. */
  pendingPlan?: PlanId | null;
  /** A plan to ring (e.g. the one picked earlier on the Pricing page). */
  highlightPlan?: PlanId | null;
  defaultInterval?: BillingInterval;
}) {
  const { catalog, isLoading } = usePlanCatalog();
  // Feature lines are built in English from the admin's plan settings.
  const feature = (f: string) => {
    const m = f.match(/^Up to ([\d,]+) products$/);
    return m ? `Up to ${m[1]} products` : f;
  };
  const [interval, setInterval] = useState<BillingInterval>(defaultInterval);
  const plans = planCards(catalog);
  const rules = pricingOf(catalog);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {"Loading plans…"}
      </div>
    );
  }

  return (
    <div>
      {/* Duration switch */}
      <div className="mx-auto mb-8 flex w-full max-w-md justify-center">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className="grid w-full grid-cols-3 gap-1 rounded-full border bg-muted/40 p-1"
        >
          {rules.durations.map((d) => (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={interval === d.id}
              onClick={() => setInterval(d.id)}
              className={cn(
                "flex min-h-10 flex-col items-center justify-center rounded-full px-2 text-xs font-semibold transition-colors sm:text-sm",
                interval === d.id
                  ? "bg-foreground text-background shadow-sm"
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
      </div>

      <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const paid = plan.monthly > 0;
          const q = paid
            ? quoteFor(plan.monthly, interval, false, rules)
            : null;
          const perMonth = q ? Math.round(q.amount / q.months) : 0;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                plan.popular && "border-accent shadow-md",
                highlightPlan === plan.id && "ring-2 ring-accent ring-offset-2",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
                  Most popular
                </span>
              )}

              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.blurb}
              </p>

              <div className="mt-5">
                {paid && q ? (
                  <>
                    <p className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight tabular-nums">
                        {formatBDT(perMonth)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / month
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {interval === "monthly" ? (
                        "Billed monthly"
                      ) : (
                        <>
                          {`${formatBDT(q.amount)} for ${q.months} months`}{" "}
                          <span className="line-through">
                            {formatBDT(q.listAmount)}
                          </span>
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-extrabold tracking-tight">
                      Free
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      No payment needed
                    </p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onChoose(plan.id, interval)}
                disabled={!!pendingPlan || !!isDisabled?.(plan)}
                className={cn(
                  "mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
                  isDisabled?.(plan)
                    ? "border bg-muted text-muted-foreground"
                    : plan.popular || paid
                      ? "bg-accent text-accent-foreground hover:opacity-90"
                      : "border bg-background hover:bg-muted",
                )}
              >
                {pendingPlan === plan.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {ctaFor(plan)}
              </button>

              <ul className="mt-6 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature(f)}</span>
                  </li>
                ))}
                {plan.locked.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <X className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
                    <span>{feature(f)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
