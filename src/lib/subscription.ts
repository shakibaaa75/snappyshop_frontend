import { apiFetch } from "@/lib/api/http";

export type PlanId = "free" | "pro" | "business";
/** monthly = 1 month, half_yearly = 6 months, yearly = 12 months. */
export type BillingInterval = "monthly" | "half_yearly" | "yearly";
export type PayMethod = "bkash" | "nagad" | "card";

export type PaymentRow = {
  id: string;
  plan: PlanId;
  interval: BillingInterval;
  amount: number;
  method: PayMethod;
  status: "paid" | "pending" | "failed";
  createdAt: string; // ISO
  /** Price breakdown. Missing on payments made before discounts existed. */
  months?: number;
  listAmount?: number;
  discountPct?: number;
};

/** What the seller's CURRENT plan allows. The server sends it and enforces
 *  the same rules itself; the UI only uses it to draw locks. */
export type Entitlements = {
  plan: PlanId;
  maxProducts: number;
  /** Allowed theme IDs. null = every theme. */
  themes: string[] | null;
  cards: string[] | null;
  /** Allowed store template IDs. null = every template. */
  templates: string[] | null;
  analytics: boolean;
  customDomain: boolean;
  metaPixel: boolean;
  pyxel: boolean;
  autoCourier: boolean;
  /** Gallery grid card and Image gallery section. Older servers omit it. */
  premiumDesign?: boolean;
  /** Keys of the extra features an admin added to this plan (Admin > Plans).
   *  Gate a screen with `extras?.includes("priority_support")`. Older servers omit it. */
  extras?: string[];
};

/** A free plan an admin offered. It gives NO access until the seller claims it. */
export type PendingGrant = {
  id: string;
  plan: Exclude<PlanId, "free">;
  planName: string;
  interval: BillingInterval;
  /** 0 = one interval */
  days: number;
  /** e.g. "30 days", "1 month" */
  durationLabel: string;
  /** The reason the admin gave */
  reason: string;
  createdAt: string; // ISO
};

export type SubscriptionInfo = {
  plan: PlanId;
  status: "active" | "expired" | "inactive" | "pending" | "none";
  interval?: BillingInterval;
  currentPeriodEnd?: string; // ISO
  /** payment = paid online, admin_free / admin_paid = set by an admin */
  source?: "payment" | "admin_free" | "admin_paid";
  entitlements: Entitlements;
  payments: PaymentRow[];
  /** Free plans waiting to be claimed. Older servers may omit it. */
  pendingGrants?: PendingGrant[];
  /** True until the seller's first paid purchase (extra 5% off). Older servers omit it. */
  firstPurchaseEligible?: boolean;
};

/** The first three themes in `themePresets` (lib/store-design/types.ts).
 *  Keep in sync with plans.FreeThemeIDs on the server. (Plan prices, product
 *  limits and feature switches are NOT hard-coded here: an admin edits them and
 *  they arrive in `Entitlements` and from GET /plans.) */
export const FREE_THEME_IDS = ["emerald", "ocean", "sunset"] as const;
/** First three templates plus "marketplace", the template new stores start on.
 *  Keep in sync with plans.FreeTemplateIDs on the server. */
export const FREE_TEMPLATE_IDS = [
  "minimal",
  "premium",
  "promo",
  "marketplace",
] as const;
export const FREE_MAX_PRODUCTS = 20;

/** Used while loading or if the request fails. Fails closed like the server. */
export const FREE_ENTITLEMENTS: Entitlements = {
  plan: "free",
  maxProducts: FREE_MAX_PRODUCTS,
  themes: [...FREE_THEME_IDS],
  cards: null,
  templates: [...FREE_TEMPLATE_IDS],
  analytics: false,
  customDomain: false,
  metaPixel: false,
  pyxel: false,
  autoCourier: false,
  premiumDesign: false,
  extras: [],
};

export const themeAllowed = (e: Entitlements, id: string) =>
  e.themes === null || e.themes.includes(id);

export type CheckoutInput = {
  plan: Exclude<PlanId, "free">;
  interval: BillingInterval;
  method: PayMethod;
};

export const sellerSubscription = {
  get: () => apiFetch<SubscriptionInfo>("/seller/subscription"),
  // The server decides the price from plan + interval; never send an amount.
  /** Claim a free plan an admin offered. Returns the updated subscription. */
  claimGrant: (id: string) =>
    apiFetch<SubscriptionInfo>(
      `/seller/subscription/grants/${encodeURIComponent(id)}/claim`,
      { method: "POST" },
    ),
  checkout: (input: CheckoutInput) =>
    apiFetch<{ paymentUrl: string }>("/seller/subscription/checkout", {
      method: "POST",
      body: input,
    }),
};

/** Free accounts must never inherit the paid-plan null (= all) permission.
 * Missing/unknown plan data fails closed to the same starter template list. */
export const templateAllowed = (e: Entitlements, id: string): boolean => {
  const starter = (FREE_TEMPLATE_IDS as readonly string[]).includes(id);
  if (e.plan !== "pro" && e.plan !== "business") return starter;
  return (
    e.templates === null ||
    (Array.isArray(e.templates) && e.templates.includes(id))
  );
};
/** True when the seller's plan includes the extra feature an admin added under this key. */
export const extraAllowed = (e: Entitlements, key: string) =>
  e.extras?.includes(key) === true;
/** Premium storefront design: Gallery grid card and Image gallery section. */
export const premiumDesignAllowed = (e: Entitlements) =>
  e.premiumDesign === true;
