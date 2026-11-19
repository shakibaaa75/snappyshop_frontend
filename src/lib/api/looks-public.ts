import { apiFetch } from "@/lib/api/http";

/** What a buyer sees. Items are already filtered: only products that can be shown. */
export type PublicLookItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  imageUrl: string;
  stock: number;
  inStock: boolean;
  status: "available" | "out_of_stock";
};

export type PublicLook = {
  id: string;
  title: string;
  gender?: "male" | "female";
  modelImageUrl: string;
  storeSlug: string;
  items: PublicLookItem[];
};

export type PublicLookCard = {
  id: string;
  title: string;
  gender?: "male" | "female";
  modelImageUrl: string;
  storeSlug: string;
  itemCount: number;
  thumbs: string[];
};

export const publicLooks = {
  get: (id: string) =>
    apiFetch<{ look: PublicLook }>(
      `/looks/${encodeURIComponent(id)}`,
    ).then((r) => r.look),
  list: (opts: { store?: string; gender?: "male" | "female"; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (opts.store) q.set("store", opts.store);
    if (opts.gender) q.set("gender", opts.gender);
    if (opts.limit) q.set("limit", String(opts.limit));
    const qs = q.toString();
    return apiFetch<{ looks: PublicLookCard[] }>(
      `/looks${qs ? `?${qs}` : ""}`,
    ).then((r) => r.looks);
  },
};

export const publicLooksKey = {
  one: (id: string) => ["public-look", id] as const,
  list: (store = "", gender = "", limit = 12) =>
    ["public-looks", store, gender, limit] as const,
};
