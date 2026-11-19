/** Admin "Plans & pricing" — GET/PUT /api/v1/admin/plans */
import { apiFetch } from "./http";
import type { PlanCatalog, PlanCatalogInput } from "@/lib/plan-catalog";

export const adminPlansApi = {
  get: () => apiFetch<PlanCatalog>("/admin/plans"),
  /** Send only the editable fields: the server rejects unknown ones. */
  update: (input: PlanCatalogInput) =>
    apiFetch<PlanCatalog>("/admin/plans", { method: "PUT", body: input }),
  /** Back to the built-in plans and discounts. */
  reset: () => apiFetch<PlanCatalog>("/admin/plans/reset", { method: "POST" }),
};
