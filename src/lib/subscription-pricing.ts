import type { BillingInterval } from "@/lib/subscription";

/**
 * Display copy of the server's price rules (plans.QuoteFor in the Go backend).
 * The server decides the real charge; this only draws the numbers.
 *
 * The prices and percentages are set by an admin (Admin > Plans) and come from
 * GET /plans (see lib/plan-catalog.ts). The values below are only the built-in
 * defaults, used until that loads:
 *
 *   1 month   : list price
 *   6 months  : 10% off
 *   12 months : 20% off
 *   first purchase: extra 5% off (added to the above)
 */
export const FIRST_PURCHASE_DISCOUNT_PCT = 5;

export type Duration = {
  id: BillingInterval;
  months: number;
  discountPct: number;
  label: string;
};

/** The discount rules a quote is calculated with. */
export type PricingRules = {
  durations: Duration[];
  firstPurchasePct: number;
};

export const DURATIONS: Duration[] = [
  { id: "monthly", months: 1, discountPct: 0, label: "1 month" },
  { id: "half_yearly", months: 6, discountPct: 10, label: "6 months" },
  { id: "yearly", months: 12, discountPct: 20, label: "12 months" },
];

export const DEFAULT_PRICING: PricingRules = {
  durations: DURATIONS,
  firstPurchasePct: FIRST_PURCHASE_DISCOUNT_PCT,
};

export const durationOf = (
  id: BillingInterval,
  rules: PricingRules = DEFAULT_PRICING,
) => rules.durations.find((d) => d.id === id) ?? rules.durations[0];

/** The period names never change, so the label does not need the rules. */
export const durationLabel = (id: BillingInterval) => durationOf(id).label;

export type Quote = {
  months: number;
  listAmount: number;
  periodPct: number;
  firstPurchasePct: number;
  totalPct: number;
  amount: number;
};

/** monthlyPrice is the plan's monthly list price in taka. */
export function quoteFor(
  monthlyPrice: number,
  interval: BillingInterval,
  firstPurchase: boolean,
  rules: PricingRules = DEFAULT_PRICING,
): Quote {
  const d = durationOf(interval, rules);
  const firstPurchasePct = firstPurchase ? rules.firstPurchasePct : 0;
  const totalPct = d.discountPct + firstPurchasePct;
  const listAmount = monthlyPrice * d.months;
  // Same integer rounding as the server: round half up to whole taka.
  const amount = Math.floor((listAmount * (100 - totalPct) + 50) / 100);
  return {
    months: d.months,
    listAmount,
    periodPct: d.discountPct,
    firstPurchasePct,
    totalPct,
    amount,
  };
}
