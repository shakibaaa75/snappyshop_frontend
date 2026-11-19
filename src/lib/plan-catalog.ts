import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/http";
import type { BillingInterval, PlanId } from "@/lib/subscription";
import type { PricingRules } from "@/lib/subscription-pricing";

/**
 * The plan catalog: prices, limits, feature switches and discounts. The admin
 * edits it (Admin > Plans) and the server serves it at GET /plans. The server
 * still decides the real charge and enforces every limit; this only draws it.
 */

/** A feature line an admin added. `key` is also sent in entitlements.extras. */
export type PlanExtra = { key: string; label: string; included: boolean };

export type PlanConfig = {
  id: PlanId;
  name: string;
  blurb: string;
  about: string;
  popular: boolean;
  /** Monthly list price in taka. */
  monthlyPrice: number;
  maxProducts: number;
  analytics: boolean;
  customDomain: boolean;
  metaPixel: boolean;
  pyxel: boolean;
  autoCourier: boolean;
  premiumDesign: boolean;
  /** true = every theme and template; false = only the free starter ones. */
  allDesigns: boolean;
  extras: PlanExtra[];
};

/** What the admin sends when saving. */
export type PlanCatalogInput = {
  plans: PlanConfig[];
  halfYearlyPct: number;
  yearlyPct: number;
  firstPurchasePct: number;
};

export type PlanCatalog = PlanCatalogInput & {
  durations: {
    id: BillingInterval;
    months: number;
    discountPct: number;
    label: string;
  }[];
  updatedAt?: string;
  /** Admin id. Only sent to admins. */
  updatedBy?: string;
};

/** Mirror of the server's built-in plans (backend/internal/plans). Only used
 *  until the real catalog loads, or if the request fails. */
export const DEFAULT_CATALOG: PlanCatalog = {
  halfYearlyPct: 10,
  yearlyPct: 20,
  firstPurchasePct: 5,
  durations: [
    { id: "monthly", months: 1, discountPct: 0, label: "1 month" },
    { id: "half_yearly", months: 6, discountPct: 10, label: "6 months" },
    { id: "yearly", months: 12, discountPct: 20, label: "12 months" },
  ],
  plans: [
    {
      id: "free",
      name: "Free",
      blurb: "Start selling today",
      about:
        "A free store to try ShopBD and make your first sales. You can list products, take orders and run your shop with a limit on products and designs. Upgrade whenever you outgrow it.",
      popular: false,
      monthlyPrice: 0,
      maxProducts: 20,
      analytics: false,
      customDomain: false,
      metaPixel: false,
      pyxel: false,
      autoCourier: false,
      premiumDesign: false,
      allDesigns: false,
      extras: [],
    },
    {
      id: "pro",
      name: "Pro",
      blurb: "For growing stores",
      about:
        "Everything you need to grow: more products, every theme and template, a premium storefront design, ad tracking and automatic courier booking, plus an analytics dashboard to see what works.",
      popular: true,
      monthlyPrice: 299,
      maxProducts: 500,
      analytics: true,
      customDomain: false,
      metaPixel: true,
      pyxel: true,
      autoCourier: true,
      premiumDesign: true,
      allDesigns: true,
      extras: [],
    },
    {
      id: "business",
      name: "Business",
      blurb: "For large catalogs",
      about:
        "Built for big catalogs and established brands. You get everything in Pro, a much higher product limit, and your own custom domain so your store looks like your brand.",
      popular: false,
      monthlyPrice: 499,
      maxProducts: 1500,
      analytics: true,
      customDomain: true,
      metaPixel: true,
      pyxel: true,
      autoCourier: true,
      premiumDesign: true,
      allDesigns: true,
      extras: [],
    },
  ],
};

export const planCatalogApi = {
  /** Public: the pricing page reads it. */
  get: () => apiFetch<PlanCatalog>("/plans"),
};

export const PLAN_CATALOG_QUERY_KEY = ["plan-catalog"] as const;

/** The live catalog. Falls back to the built-in plans if the request fails. */
export function usePlanCatalog(): {
  catalog: PlanCatalog;
  isLoading: boolean;
} {
  const q = useQuery({
    queryKey: PLAN_CATALOG_QUERY_KEY,
    queryFn: planCatalogApi.get,
    staleTime: 60_000,
    retry: 1,
  });
  return { catalog: q.data ?? DEFAULT_CATALOG, isLoading: q.isLoading };
}

export const pricingOf = (c: PlanCatalog): PricingRules => ({
  firstPurchasePct: c.firstPurchasePct,
  durations: c.durations.map((d) => ({
    id: d.id,
    months: d.months,
    discountPct: d.discountPct,
    label: d.label,
  })),
});

/* ------------------------------------------------------------------ */
/* Display lines for the pricing cards                                 */
/* ------------------------------------------------------------------ */

type Switch =
  | "analytics"
  | "customDomain"
  | "metaPixel"
  | "pyxel"
  | "autoCourier"
  | "premiumDesign";

/** The built-in switches, in the order they are listed. */
const SWITCHES: { key: Switch; label: string }[] = [
  { key: "metaPixel", label: "Meta Pixel" },
  { key: "pyxel", label: "Pyxel" },
  { key: "autoCourier", label: "Automatic courier integration" },
  { key: "analytics", label: "Analytics dashboard" },
  {
    key: "premiumDesign",
    label:
      "Premium design: gallery grid card, image gallery section, arrange homepage sections",
  },
  { key: "customDomain", label: "Custom domain" },
];

export type PlanCard = {
  id: PlanId;
  name: string;
  blurb: string;
  about: string;
  popular: boolean;
  monthly: number;
  features: string[];
  /** What this plan does NOT include (but another plan does). */
  locked: string[];
};

const number = (n: number) => n.toLocaleString("en-US");

/** Label lines for some switches. Meta Pixel and Pyxel become one line when
 *  both are in the list. */
function labelsFor(keys: Switch[]): string[] {
  const set = new Set(keys);
  const out: string[] = [];
  for (const s of SWITCHES) {
    if (!set.has(s.key)) continue;
    if (s.key === "metaPixel" && set.has("pyxel")) {
      out.push("Meta Pixel and Pyxel");
      continue;
    }
    if (s.key === "pyxel" && set.has("metaPixel")) continue;
    out.push(s.label);
  }
  return out;
}

/** Turns the catalog into the cards the pricing page draws. */
export function planCards(c: PlanCatalog): PlanCard[] {
  return c.plans.map((p) => {
    const offeredElsewhere = (key: Switch) =>
      c.plans.some((o) => o.id !== p.id && o[key]);
    const features: string[] = [`Up to ${number(p.maxProducts)} products`];
    if (p.allDesigns) features.push("All store themes and templates");
    else features.push("First 3 store themes", "Starter store templates");
    features.push(
      ...labelsFor(SWITCHES.filter((s) => p[s.key]).map((s) => s.key)),
    );
    features.push(...p.extras.filter((e) => e.included).map((e) => e.label));
    features.push("Order management");

    const locked: string[] = [];
    if (!p.allDesigns && c.plans.some((o) => o.allDesigns))
      locked.push("Other store themes");
    // Only list what some other plan really offers.
    locked.push(
      ...labelsFor(
        SWITCHES.filter((s) => !p[s.key] && offeredElsewhere(s.key)).map(
          (s) => s.key,
        ),
      ),
    );
    locked.push(...p.extras.filter((e) => !e.included).map((e) => e.label));

    return {
      id: p.id,
      name: p.name,
      blurb: p.blurb,
      about: p.about,
      popular: p.popular,
      monthly: p.monthlyPrice,
      features,
      locked,
    };
  });
}
