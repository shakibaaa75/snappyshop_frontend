/**
 * Data layer for the seller's custom domain.
 *
 * The seller is identified by the auth cookie on the Go API; no seller ID is
 * ever sent from the browser. One seller has at most one domain.
 */
import { apiFetch } from "@/lib/api/http";

export type CustomDomainStatus = "" | "pending" | "verified";

export interface CustomDomainRecord {
  type: "TXT" | "CNAME" | "A" | string;
  /** Host name the record is added on. */
  name: string;
  value: string;
  purpose: "ownership" | "routing" | string;
  note?: string;
}

export interface CustomDomain {
  /** Empty string when the seller has not added a domain. */
  domain: string;
  status: CustomDomainStatus;
  verified: boolean;
  /** Whether the domain pointed at the platform at the last check. */
  dnsOk: boolean;
  lastError?: string;
  verifiedAt?: string;
  lastCheckedAt?: string;
  /** Set once verified. */
  url?: string;
  records: CustomDomainRecord[];
  /** False when the seller's plan does not include custom domains. */
  planAllowed: boolean;
  planMessage?: string;
}

export const sellerCustomDomain = {
  /** GET /seller/custom-domain */
  get(): Promise<CustomDomain> {
    return apiFetch<CustomDomain>("/seller/custom-domain");
  },

  /** PUT /seller/custom-domain — adds or replaces the domain. */
  set(domain: string): Promise<CustomDomain> {
    return apiFetch<CustomDomain>("/seller/custom-domain", {
      method: "PUT",
      body: { domain },
    });
  },

  /** POST /seller/custom-domain/verify — checks the DNS records now. */
  verify(): Promise<CustomDomain> {
    return apiFetch<CustomDomain>("/seller/custom-domain/verify", {
      method: "POST",
    });
  },

  /** DELETE /seller/custom-domain */
  async remove(): Promise<void> {
    await apiFetch("/seller/custom-domain", { method: "DELETE" });
  },
};
