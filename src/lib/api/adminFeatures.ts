import { apiFetch } from "@/lib/api/http";
import type { FeatureInfo, FeatureKey } from "@/lib/features";

const slugOf = (k: FeatureKey) => k.replace(/_/g, "-");
const base = (sellerId: string, k: FeatureKey) =>
  `/admin/sellers/${encodeURIComponent(sellerId)}/features/${slugOf(k)}`;

/** Admin controls for one-time premium features (Try the Look). */
export const adminFeatures = {
  get: (sellerId: string, k: FeatureKey) => apiFetch<FeatureInfo>(base(sellerId, k)),
  /** Give it for free, or switch it back on after disable/revoke. */
  grant: (sellerId: string, k: FeatureKey, reason: string) =>
    apiFetch<FeatureInfo>(`${base(sellerId, k)}/grant`, { method: "POST", body: { reason } }),
  setStatus: (sellerId: string, k: FeatureKey, status: "disabled" | "revoked", reason: string) =>
    apiFetch<FeatureInfo>(`${base(sellerId, k)}/status`, { method: "POST", body: { status, reason } }),
};
