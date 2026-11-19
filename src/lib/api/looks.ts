import { apiFetch } from "@/lib/api/http";
import type { ProductInput } from "@/lib/api/products";

export const MAX_LOOK_ITEMS = 30;

export type LookGender = "male" | "female";
export type LookStatus = "draft" | "published";
/** available / out_of_stock are shown to buyers; removed / unpublished are not. */
export type LookItemStatus =
  | "available"
  | "out_of_stock"
  | "unpublished"
  | "removed";

export type LookItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  imageUrl: string;
  stock: number;
  inStock: boolean;
  status: LookItemStatus;
};

export type Look = {
  id: string;
  title: string;
  gender?: LookGender;
  modelImageUrl: string;
  status: LookStatus;
  items: LookItem[];
  maxItems: number;
  /** Items that are removed or unpublished. Buyers don't see them. */
  needsAttention: number;
  createdAt: string;
  updatedAt: string;
};

export type LookSummary = Omit<Look, "items" | "maxItems" | "createdAt"> & {
  itemCount: number;
};

export type LookInput = {
  title: string;
  gender: LookGender | "";
  modelImageUrl: string;
};

const base = (id: string) => `/seller/looks/${encodeURIComponent(id)}`;
const one = (r: { look: Look }) => r.look;

export const sellerLooks = {
  list: () =>
    apiFetch<{ looks: LookSummary[] }>("/seller/looks").then((r) => r.looks),
  get: (id: string) => apiFetch<{ look: Look }>(base(id)).then(one),
  create: (input: LookInput) =>
    apiFetch<{ look: Look }>("/seller/looks", {
      method: "POST",
      body: input,
    }).then(one),
  update: (id: string, input: LookInput) =>
    apiFetch<{ look: Look }>(base(id), { method: "PUT", body: input }).then(
      one,
    ),
  remove: (id: string) => apiFetch<void>(base(id), { method: "DELETE" }),
  publish: (id: string) =>
    apiFetch<{ look: Look }>(`${base(id)}/publish`, { method: "POST" }).then(
      one,
    ),
  unpublish: (id: string) =>
    apiFetch<{ look: Look }>(`${base(id)}/unpublish`, { method: "POST" }).then(
      one,
    ),
  /** Connect a product that is already published. Nothing is copied. */
  addExisting: (id: string, productId: string) =>
    apiFetch<{ look: Look }>(`${base(id)}/items`, {
      method: "POST",
      body: { productId },
    }).then(one),
  /** Create a normal published product, then connect it to the look. */
  addNew: (id: string, product: ProductInput) =>
    apiFetch<{ look: Look }>(`${base(id)}/items/new`, {
      method: "POST",
      body: { product },
    }).then(one),
  removeItem: (id: string, productId: string) =>
    apiFetch<{ look: Look }>(
      `${base(id)}/items/${encodeURIComponent(productId)}`,
      { method: "DELETE" },
    ).then(one),
  replaceItem: (id: string, productId: string, newProductId: string) =>
    apiFetch<{ look: Look }>(
      `${base(id)}/items/${encodeURIComponent(productId)}`,
      { method: "PUT", body: { productId: newProductId } },
    ).then(one),
  reorder: (id: string, productIds: string[]) =>
    apiFetch<{ look: Look }>(`${base(id)}/items/order`, {
      method: "PUT",
      body: { productIds },
    }).then(one),
};

export const looksKey = {
  all: ["seller", "looks"] as const,
  list: () => ["seller", "looks", "list"] as const,
  detail: (id: string) => ["seller", "looks", "detail", id] as const,
};
