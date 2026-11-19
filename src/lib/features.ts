import { apiFetch } from "@/lib/api/http";
import type { PayMethod } from "@/lib/subscription";

/** One-time premium features. Keys match the server (models.Feature*). */
export type FeatureKey = "try_the_look";

/** URL form of a key: the server accepts "try-the-look" in paths. */
const slugOf = (k: FeatureKey) => k.replace(/_/g, "-");

export type FeatureStatus = "locked" | "active" | "disabled" | "revoked";

export type FeaturePaymentRow = {
  id: string;
  amount: number;
  method: PayMethod;
  status: "paid" | "pending" | "failed" | "cancelled";
  createdAt: string; // ISO
};

export type FeatureInfo = {
  feature: FeatureKey;
  name: string;
  /** Whole taka, charged once. Display only; the server sets the real price. */
  price: number;
  status: FeatureStatus;
  /** True only when the seller can use the feature right now. */
  unlocked: boolean;
  source?: "purchased" | "admin_granted";
  note?: string;
  purchasedAt?: string;
  grantedAt?: string;
  payments: FeaturePaymentRow[];
};

export const sellerFeatures = {
  get: (key: FeatureKey) =>
    apiFetch<FeatureInfo>(`/seller/features/${slugOf(key)}`),
  // The server decides the price; never send an amount.
  checkout: (key: FeatureKey, input: { method: PayMethod }) =>
    apiFetch<{ paymentUrl: string }>(`/seller/features/${slugOf(key)}/checkout`, {
      method: "POST",
      body: input,
    }),
};

export const featureQueryKey = (key: FeatureKey) =>
  ["seller", "features", key] as const;
