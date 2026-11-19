/**
 * Data layer for the seller's courier integrations.
 *
 * The seller is identified by the auth cookie on the Go API. No seller ID is
 * ever sent from the browser. Saved secrets never come back from the API:
 * a connection only carries a masked hint of the account it points to.
 */
import { apiFetch } from "@/lib/api/http";

export type CourierStatus = "connected" | "failed" | "needs_reconnection";

export interface CourierCredentialField {
  /** Key sent to the API inside `credentials`. */
  key: string;
  label: string;
  /** "password" fields are masked in the form. */
  type: "text" | "password";
  placeholder?: string;
  helpText?: string;
  required: boolean;
}

/** A provider the backend has a working adapter for. */
export interface CourierProvider {
  id: string;
  name: string;
  description?: string;
  credentialFields: CourierCredentialField[];
  /** Plain steps explaining where the seller finds these credentials. */
  credentialHelp: string[];
  docsUrl?: string;
}

export interface CourierConnection {
  id: string;
  provider: string;
  providerName: string;
  /** Seller-chosen nickname, e.g. "Dhaka warehouse". */
  label?: string;
  status: CourierStatus;
  /** Safe, human-readable reason for a failed or stale status. */
  statusMessage?: string;
  /** Masked identifier of the courier account, e.g. "••••4821". */
  accountHint?: string;
  connectedAt: string;
  lastCheckedAt?: string;
}

export type CourierCredentials = Record<string, string>;

export const COURIER_STATUS_LABEL: Record<CourierStatus, string> = {
  connected: "Connected",
  failed: "Connection Failed",
  needs_reconnection: "Needs Reconnection",
};

export const COURIER_STATUS_COLOR: Record<
  CourierStatus,
  { bg: string; text: string; dot: string }
> = {
  connected: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-600",
  },
  failed: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  needs_reconnection: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
};

export const sellerCouriers = {
  /** GET /seller/couriers/providers */
  async providers(): Promise<CourierProvider[]> {
    const res = await apiFetch<{ providers: CourierProvider[] | null }>(
      "/seller/couriers/providers",
    );
    return res.providers ?? [];
  },

  /** GET /seller/couriers */
  async list(): Promise<CourierConnection[]> {
    const res = await apiFetch<{ connections: CourierConnection[] | null }>(
      "/seller/couriers",
    );
    return res.connections ?? [];
  },

  /** POST /seller/couriers — validates against the courier before saving. */
  async connect(input: {
    provider: string;
    label?: string;
    credentials: CourierCredentials;
  }): Promise<CourierConnection> {
    const res = await apiFetch<{ connection: CourierConnection }>(
      "/seller/couriers",
      { method: "POST", body: input },
    );
    return res.connection;
  },

  /** POST /seller/couriers/:id/test */
  async test(id: string): Promise<CourierConnection> {
    const res = await apiFetch<{ connection: CourierConnection }>(
      `/seller/couriers/${encodeURIComponent(id)}/test`,
      { method: "POST" },
    );
    return res.connection;
  },

  /** PUT /seller/couriers/:id/credentials — replaces the stored secrets. */
  async updateCredentials(
    id: string,
    credentials: CourierCredentials,
  ): Promise<CourierConnection> {
    const res = await apiFetch<{ connection: CourierConnection }>(
      `/seller/couriers/${encodeURIComponent(id)}/credentials`,
      { method: "PUT", body: { credentials } },
    );
    return res.connection;
  },

  /** DELETE /seller/couriers/:id */
  async disconnect(id: string): Promise<void> {
    await apiFetch(`/seller/couriers/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};