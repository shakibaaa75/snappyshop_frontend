import type { BillingInterval, PlanId } from "@/lib/subscription";

/**
 * The plan a visitor picked on the Pricing page (or on the "choose your plan"
 * step after registering). It is remembered for this browser tab only, so it
 * survives the register -> plan -> store setup steps.
 */
const KEY = "shopbd:plan-intent";

export type PlanIntent = { plan: PlanId; interval: BillingInterval };

const PLANS: PlanId[] = ["free", "pro", "business"];
const INTERVALS: BillingInterval[] = ["monthly", "half_yearly", "yearly"];

export function savePlanIntent(intent: PlanIntent) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    /* Storage blocked: the seller just picks the plan again. */
  }
}

export function readPlanIntent(): PlanIntent | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<PlanIntent>;
    if (!v.plan || !PLANS.includes(v.plan)) return null;
    return {
      plan: v.plan,
      interval:
        v.interval && INTERVALS.includes(v.interval) ? v.interval : "monthly",
    };
  } catch {
    return null;
  }
}

export function clearPlanIntent() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Where a seller who already has a store goes to buy the picked plan. */
export function subscriptionUrl(slug: string, intent: PlanIntent | null) {
  const base = `/seller/${slug}/subscription`;
  if (!intent || intent.plan === "free") return base;
  return `${base}?plan=${intent.plan}&interval=${intent.interval}`;
}