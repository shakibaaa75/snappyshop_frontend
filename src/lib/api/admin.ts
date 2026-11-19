/**
 * Super Admin API client — talks to /api/v1/admin/* on the Go backend.
 */
import { apiFetch } from "./http";

export interface DashboardStats {
  TotalUsers: number;
  TotalSellers: number;
  ActiveSellers: number;
  SuspendedSellers: number;
  RestrictedSellers: number;
  BannedSellers: number;
  TotalCustomers: number;
  PublishedProducts: number;
  InactiveProducts: number;
  TotalOrders: number;
  DeliveredOrders: number;
  SubscriptionRevenueTaka: number;
  ActivePaidSubscriptions: number;
  ActivePromoSubscriptions: number;
  PendingVerifications: number;
  OpenReports: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  role: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  storeSlug?: string;
  storeName?: string;
  totalProducts?: number;
  publishedProducts?: number;
  totalOrders?: number;
  deliveredOrders?: number;
  plan?: string;
  planExpiresAt?: string;
  isPromotionalPlan?: boolean;
  verificationStatus?: string;
}

export interface SellerSummary {
  SellerID: string;
  TotalProducts: number;
  PublishedProducts: number;
  TotalOrders: number;
  DeliveredOrders: number;
  CancelledOrders: number;
  StoreSlug: string;
  StoreName: string;
  Plan: string;
  PlanExpiresAt?: string;
  IsPromotionalPlan: boolean;
  VerificationStatus: string;
  RestrictionKind: string;
}

export interface Restriction {
  id: string;
  sellerId: string;
  kind: string;
  reason: string;
  adminId: string;
  startsAt: string;
  endsAt?: string;
  active: boolean;
  createdAt: string;
}

export interface AdminNote {
  id: string;
  targetType: string;
  targetId: string;
  adminId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionOverride {
  id: string;
  sellerId: string;
  plan: string;
  startsAt: string;
  endsAt: string;
  discountPct?: number;
  discountFixed?: number;
  isPromotional: boolean;
  reason: string;
  adminId: string;
  active: boolean;
  createdAt: string;
}

/** A free plan offered to a seller that they have not claimed yet. */
export interface PendingSubscriptionGrant {
  id: string;
  plan: "pro" | "business";
  planName: string;
  interval: "monthly" | "yearly";
  days: number;
  durationLabel: string;
  reason: string;
  createdAt: string;
}

/** A seller's real subscription (what the plan checks read). */
export interface AdminSubscription {
  plan: "free" | "pro" | "business";
  status: "active" | "expired" | "inactive" | "none";
  interval?: "monthly" | "yearly";
  currentPeriodEnd?: string;
  source?: "payment" | "admin_free" | "admin_paid";
  entitlements: {
    plan: string;
    maxProducts: number;
    themes: string[] | null;
    templates: string[] | null;
    analytics: boolean;
    customDomain: boolean;
    metaPixel: boolean;
    pyxel: boolean;
    autoCourier: boolean;
  };
  payments: {
    id: string;
    plan: string;
    interval: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  }[];
  /** Free plans offered but not claimed yet. They give no access. */
  pendingGrants?: PendingSubscriptionGrant[];
}

export interface AssignSubscriptionPayload {
  plan: "pro" | "business";
  interval: "monthly" | "yearly";
  /** Custom length in days. Omit to use one full interval. */
  days?: number;
  /** true = granted for free, false = paid plan billed outside the gateway */
  free: boolean;
  /** add to the current period when the plan is unchanged and active */
  extend?: boolean;
  reason: string;
}

export interface SellerPromotion {
  id: string;
  sellerId: string;
  kind: string;
  priority?: number;
  startsAt: string;
  endsAt?: string;
  adminId: string;
  reason?: string;
  active: boolean;
  createdAt: string;
}

export interface SellerReport {
  id: string;
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  sellerId: string;
  productId?: string;
  category: string;
  description: string;
  evidenceUrls?: string[];
  status: string;
  assignedTo?: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerVerification {
  id: string;
  sellerId: string;
  status: string;
  fullName?: string;
  businessName?: string;
  businessType?: string;
  phone?: string;
  phoneVerified?: boolean;
  documentUrls?: string[];
  notes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** One store-address change. `changedAt` is missing for old changes made before history was recorded. */
export interface SlugChange {
  id: string;
  sellerId: string;
  oldSlug: string;
  newSlug: string;
  /** "address" = address edited, "rename" = moved with a shop rename, "legacy" = rebuilt from old data */
  source: "address" | "rename" | "legacy" | string;
  storeName?: string;
  changedAt?: string;
}

/** A slug change in the platform-wide list, with the seller it belongs to. */
export interface SlugChangeRow extends SlugChange {
  sellerName: string;
  sellerEmail: string;
  sellerStatus: string;
  /** The seller's current store address. */
  currentSlug: string;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
  ip?: string;
  createdAt: string;
}

export const adminApi = {
  /** Step 1: env email+password → OTP emailed */
  adminLogin: (email: string, password: string) =>
    apiFetch<{ ok: boolean; message: string }>("/admin/auth/login", {
      method: "POST",
      body: { email, password },
      skipRefresh: true,
    }),

  /** Step 2: OTP → session cookies */
  adminStatus: () =>
    apiFetch<{ ok: boolean; required: boolean }>("/admin/auth/status", {
      skipRefresh: true,
    }),

  adminLogout: () =>
    apiFetch<{ status: string }>("/admin/auth/logout", {
      method: "POST",
      skipRefresh: true,
    }),

  adminVerifyOTP: (email: string, code: string) =>
    apiFetch<{ user: { id: string; name: string; email: string; role: string } }>(
      "/admin/auth/verify-otp",
      {
        method: "POST",
        body: { email, code },
        skipRefresh: true,
      },
    ),


  dashboard: () =>
    apiFetch<{
      stats: DashboardStats;
      recentSellers: AdminUser[];
      recentReports: SellerReport[];
      recentAdminLogs: AdminActivityLog[];
    }>("/admin/dashboard"),

  listSellers: (params?: {
    q?: string;
    status?: string;
    limit?: number;
    skip?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.status) sp.set("status", params.status);
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.skip != null) sp.set("skip", String(params.skip));
    const qs = sp.toString();
    return apiFetch<{ sellers: AdminUser[]; total: number; limit: number; skip: number }>(
      `/admin/sellers${qs ? `?${qs}` : ""}`,
    );
  },

  getSeller: (id: string) =>
    apiFetch<{
      seller: AdminUser;
      summary: SellerSummary;
      restrictionHistory: Restriction[];
      notes: AdminNote[];
      promotions: SellerPromotion[];
      subscriptionHistory: SubscriptionOverride[];
      slugHistory: SlugChange[];
    }>(`/admin/sellers/${id}`),

  suspendSeller: (id: string, reason: string, durationDays?: number) =>
    apiFetch<{ status: string }>(`/admin/sellers/${id}/suspend`, {
      method: "POST",
      body: { kind: "suspend", reason, durationDays },
    }),

  restrictSeller: (id: string, reason: string, durationDays?: number) =>
    apiFetch<{ status: string }>(`/admin/sellers/${id}/restrict`, {
      method: "POST",
      body: { kind: "restrict", reason, durationDays },
    }),

  banSeller: (id: string, reason: string) =>
    apiFetch<{ status: string }>(`/admin/sellers/${id}/ban`, {
      method: "POST",
      body: { kind: "ban", reason },
    }),

  restoreSeller: (id: string, reason: string) =>
    apiFetch<{ status: string }>(`/admin/sellers/${id}/restore`, {
      method: "POST",
      body: { reason },
    }),

  listSellerNotes: (id: string) =>
    apiFetch<{ notes: AdminNote[] }>(`/admin/sellers/${id}/notes`),

  addSellerNote: (id: string, body: string) =>
    apiFetch<{ note: AdminNote }>(`/admin/sellers/${id}/notes`, {
      method: "POST",
      body: { body },
    }),

  grantSubscription: (
    id: string,
    payload: {
      plan: string;
      durationDays: number;
      discountPct?: number;
      discountFixed?: number;
      isPromotional?: boolean;
      reason: string;
    },
  ) =>
    // A free plan (isPromotional) comes back as { offered: true, grant }: the
    // seller must claim it. A discounted plan applies at once ({ override }).
    apiFetch<{
      offered: boolean;
      grant?: { id: string; plan: string; days: number; reason: string };
      override?: SubscriptionOverride;
    }>(`/admin/sellers/${id}/subscription/grant`, {
      method: "POST",
      body: payload,
    }),

  /** Withdraw a free plan the seller has not claimed yet. */
  revokeSubscriptionOffer: (id: string, grantId: string, reason: string) =>
    apiFetch<AdminSubscription>(
      `/admin/sellers/${id}/subscription/grants/${encodeURIComponent(grantId)}/revoke`,
      { method: "POST", body: { reason } },
    ),

  getSellerSubscription: (id: string) =>
    apiFetch<AdminSubscription>(`/admin/sellers/${id}/subscription`),

  assignSubscription: (id: string, payload: AssignSubscriptionPayload) =>
    apiFetch<AdminSubscription>(`/admin/sellers/${id}/subscription`, {
      method: "POST",
      body: payload,
    }),

  setSubscriptionActive: (id: string, active: boolean, reason: string) =>
    apiFetch<AdminSubscription>(`/admin/sellers/${id}/subscription/active`, {
      method: "POST",
      body: { active, reason },
    }),

  extendSubscription: (id: string, days: number, reason: string) =>
    apiFetch<AdminSubscription>(`/admin/sellers/${id}/subscription/extend`, {
      method: "POST",
      body: { days, reason },
    }),

  removeSubscription: (id: string, reason: string) =>
    apiFetch<AdminSubscription>(`/admin/sellers/${id}/subscription/remove`, {
      method: "POST",
      body: { reason },
    }),

  featureSeller: (
    id: string,
    payload: {
      kind?: string;
      priority?: number;
      durationDays?: number;
      reason?: string;
    },
  ) =>
    apiFetch<{ promotion: SellerPromotion }>(`/admin/sellers/${id}/feature`, {
      method: "POST",
      body: payload,
    }),

  unfeatureSeller: (id: string, kind?: string) =>
    apiFetch<{ status: string }>(`/admin/sellers/${id}/unfeature`, {
      method: "POST",
      body: { kind },
    }),

  listCustomers: (params?: {
    q?: string;
    status?: string;
    limit?: number;
    skip?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.status) sp.set("status", params.status);
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.skip != null) sp.set("skip", String(params.skip));
    const qs = sp.toString();
    return apiFetch<{ customers: AdminUser[]; total: number }>(
      `/admin/customers${qs ? `?${qs}` : ""}`,
    );
  },

  customerAction: (id: string, kind: string, reason: string) =>
    apiFetch<{ status: string }>(`/admin/customers/${id}/action`, {
      method: "POST",
      body: { kind, reason },
    }),

  listVerifications: (params?: {
    status?: string;
    limit?: number;
    skip?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.skip != null) sp.set("skip", String(params.skip));
    const qs = sp.toString();
    return apiFetch<{ verifications: SellerVerification[]; total: number }>(
      `/admin/verifications${qs ? `?${qs}` : ""}`,
    );
  },

  reviewVerification: (id: string, status: string, reason?: string) =>
    apiFetch<{ status: string }>(`/admin/verifications/${id}/review`, {
      method: "POST",
      body: { status, reason },
    }),

  listReports: (params?: {
    status?: string;
    sellerId?: string;
    limit?: number;
    skip?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.sellerId) sp.set("sellerId", params.sellerId);
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.skip != null) sp.set("skip", String(params.skip));
    const qs = sp.toString();
    return apiFetch<{ reports: SellerReport[]; total: number }>(
      `/admin/reports${qs ? `?${qs}` : ""}`,
    );
  },

  getReport: (id: string) =>
    apiFetch<{ report: SellerReport }>(`/admin/reports/${id}`),

  resolveReport: (id: string, status: string, resolution?: string) =>
    apiFetch<{ status: string }>(`/admin/reports/${id}`, {
      method: "PATCH",
      body: { status, resolution },
    }),

  listSlugHistory: (params?: {
    q?: string;
    sellerId?: string;
    limit?: number;
    skip?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.sellerId) sp.set("sellerId", params.sellerId);
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.skip != null) sp.set("skip", String(params.skip));
    const qs = sp.toString();
    return apiFetch<{ changes: SlugChangeRow[]; total: number; limit: number; skip: number }>(
      `/admin/slug-history${qs ? `?${qs}` : ""}`,
    );
  },

  listActivityLogs: (params?: {
    adminId?: string;
    targetType?: string;
    targetId?: string;
    action?: string;
    limit?: number;
    skip?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.adminId) sp.set("adminId", params.adminId);
    if (params?.targetType) sp.set("targetType", params.targetType);
    if (params?.targetId) sp.set("targetId", params.targetId);
    if (params?.action) sp.set("action", params.action);
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.skip != null) sp.set("skip", String(params.skip));
    const qs = sp.toString();
    return apiFetch<{ logs: AdminActivityLog[]; total: number }>(
      `/admin/activity-logs${qs ? `?${qs}` : ""}`,
    );
  },
};