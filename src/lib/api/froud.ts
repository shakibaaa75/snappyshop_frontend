/**
 * Data layer for the fraud check.
 *
 * Seller side: the seller is identified by the auth cookie, and the check is
 * always run for one of THEIR orders (the API reads the phone number from the
 * order, so a seller cannot look up arbitrary numbers).
 * Admin side: the provider API key is write-only. The API never sends it
 * back, only whether one is saved and its last 4 characters.
 */
import { apiFetch } from "@/lib/api/http";

export type RiskLevel = "low" | "medium" | "high" | "unknown";

/** How the courier-network part of an answer was obtained. */
export type ExternalStatus =
  | "" // our own history was enough
  | "fresh"
  | "saved"
  | "off"
  | "limit"
  | "unavailable";

export interface FraudCheckResult {
  phone: string;
  internal: {
    delivered: number;
    cancelled: number;
    failed: number;
    open: number;
    finished: number;
  } | null;
  external: {
    provider: string;
    total: number;
    success: number;
    cancel: number;
    rating?: string;
    riskLevel?: string;
    checkedAt: string;
  } | null;
  externalStatus: ExternalStatus;
  /** When this check was run (ISO). */
  checkedAt?: string;
  risk: {
    level: RiskLevel;
    sample: number;
    successRate: number | null;
    reasons: string[];
  };
}

export const FRAUD_STATUS_KEY = ["seller", "fraud", "status"] as const;
/** The saved result of one order's last check. */
export const fraudSavedKey = (orderId: string) =>
  ["seller", "fraud", "saved", orderId] as const;

export const sellerFraud = {
  /** GET /seller/fraud/status: has the admin switched the feature on? */
  async enabled(): Promise<boolean> {
    const res = await apiFetch<{ enabled: boolean }>("/seller/fraud/status");
    return res.enabled;
  },
  /** GET /seller/orders/{id}/fraud-check: the last result, or null if never checked. */
  async saved(orderId: string): Promise<FraudCheckResult | null> {
    const res = await apiFetch<{ result: FraudCheckResult | null }>(
      `/seller/orders/${encodeURIComponent(orderId)}/fraud-check`,
    );
    return res.result;
  },
  /** POST /seller/orders/{id}/fraud-check */
  async check(orderId: string): Promise<FraudCheckResult> {
    const res = await apiFetch<{ result: FraudCheckResult }>(
      `/seller/orders/${encodeURIComponent(orderId)}/fraud-check`,
      { method: "POST" },
    );
    return res.result;
  },
};

/* ------------------------------ admin side ------------------------------ */

export interface FraudSettings {
  enabled: boolean;
  providerEnabled: boolean;
  providerId: string;
  baseUrl: string;
  hasApiKey: boolean;
  apiKeyHint?: string;
  apiUsername?: string;
  keyStorageAvailable: boolean;
  minOrders: number;
  cacheDays: number;
  retentionDays: number;
  storeProviderData: boolean;
  updatedAt?: string;
}

/** Partial update: leave a field out to keep it. */
export interface FraudSettingsPatch {
  enabled?: boolean;
  providerEnabled?: boolean;
  baseUrl?: string;
  /** Blank = keep the saved key. */
  apiKey?: string;
  /** The provider account username that goes with the key. */
  apiUsername?: string;
  clearApiKey?: boolean;
  minOrders?: number;
  cacheDays?: number;
  retentionDays?: number;
  storeProviderData?: boolean;
}

export interface FraudBackfill {
  running: boolean;
  processed: number;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export const ADMIN_FRAUD_KEY = ["admin", "fraud", "settings"] as const;
export const ADMIN_FRAUD_BACKFILL_KEY = ["admin", "fraud", "backfill"] as const;

export const adminFraud = {
  async get(): Promise<FraudSettings> {
    return (await apiFetch<{ settings: FraudSettings }>("/admin/fraud/settings"))
      .settings;
  },
  async update(patch: FraudSettingsPatch): Promise<FraudSettings> {
    return (
      await apiFetch<{ settings: FraudSettings }>("/admin/fraud/settings", {
        method: "PUT",
        body: patch,
      })
    ).settings;
  },
  /** Uses one request of the provider's quota. */
  test: () =>
    apiFetch<{ ok: boolean; message: string }>("/admin/fraud/test", {
      method: "POST",
    }),
  async backfill(): Promise<FraudBackfill> {
    return (await apiFetch<{ backfill: FraudBackfill }>("/admin/fraud/backfill"))
      .backfill;
  },
  async startBackfill(): Promise<FraudBackfill> {
    return (
      await apiFetch<{ backfill: FraudBackfill }>("/admin/fraud/backfill", {
        method: "POST",
      })
    ).backfill;
  },
};