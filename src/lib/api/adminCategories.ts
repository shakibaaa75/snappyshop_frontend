import { apiFetch } from "@/lib/api/http";

/*
 * Client for /admin/categories (Part 3). Response shapes are read leniently in
 * the to* helpers below. If a field name differs from the backend, fix it here
 * and nowhere else.
 */

export interface AdminCat {
  id: string;
  name: string;
  imageUrl: string;
  products: number;
  isNew: boolean;
}
export interface AdminMain {
  id: string;
  name: string;
  imageUrl: string;
  products: number;
  categories: AdminCat[];
}
export interface NewCat {
  id: string;
  name: string;
  mainId: string;
  mainName: string;
  createdAt: string;
  seller: string;
  store: string;
  source: string;
  typed: string;
  similar: { id: string; name: string }[];
}

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const num = (v: unknown) => (typeof v === "number" ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");

const toCat = (c: Raw): AdminCat => ({
  id: str(c.id),
  name: str(c.name),
  imageUrl: str(c.imageUrl),
  products: num(c.productCount ?? c.products ?? c.count),
  isNew: !!(c.isNew ?? c.unseen ?? c.adminSeen === false),
});

const toMain = (m: Raw): AdminMain => {
  const categories = ((m.categories ?? m.children ?? []) as Raw[]).map(toCat);
  return {
    id: str(m.id),
    name: str(m.name),
    imageUrl: str(m.imageUrl),
    products: num(m.productCount ?? m.products) || categories.reduce((n, c) => n + c.products, 0),
    categories,
  };
};

const toNew = (c: Raw): NewCat => ({
  id: str(c.id),
  name: str(c.name),
  mainId: str(c.mainId ?? c.parentId),
  mainName: str(c.mainName ?? c.parentName),
  createdAt: str(c.createdAt),
  seller: str(c.sellerName ?? c.createdByName ?? c.createdBy),
  store: str(c.storeName ?? c.storeSlug ?? c.storeId),
  source: str(c.source ?? c.createdFrom),
  typed: str(c.typedText ?? c.rawInput ?? c.typed),
  similar: ((c.similar ?? c.suggestions ?? []) as Raw[]).map((s) => ({
    id: str(s.id ?? s.node?.id),
    name: str(s.name ?? s.node?.name),
  })),
});

const BASE = "/admin/categories";

export const adminCategories = {
  list: async (): Promise<AdminMain[]> => {
    const r = await apiFetch<Raw>(BASE);
    return ((r.mainTypes ?? r.mains ?? r.groups ?? r.categories ?? []) as Raw[]).map(toMain);
  },
  listNew: async (): Promise<NewCat[]> => {
    const r = await apiFetch<Raw>(`${BASE}/new`);
    return ((r.categories ?? r.items ?? []) as Raw[]).map(toNew);
  },
  markSeen: (ids: string[] = []) =>
    apiFetch<void>(`${BASE}/seen`, { method: "POST", body: { ids } }),
  /** Set (or, with "", remove) the picture of a main type or a category. */
  setImage: (id: string, imageUrl: string) =>
    apiFetch<{ id: string; imageUrl: string }>(`${BASE}/${encodeURIComponent(id)}/image`, {
      method: "PUT",
      body: { imageUrl },
    }),
  rename: (id: string, name: string) =>
    apiFetch<void>(`${BASE}/${id}`, { method: "PUT", body: { name } }),
  merge: (id: string, targetId: string) =>
    apiFetch<void>(`${BASE}/${id}/merge`, { method: "POST", body: { intoId: targetId } }),
  move: (id: string, mainId: string) =>
    apiFetch<void>(`${BASE}/${id}/move`, { method: "POST", body: { mainId } }),
  remove: (id: string, moveTo?: string) =>
    apiFetch<void>(`${BASE}/${id}${moveTo ? `?moveTo=${encodeURIComponent(moveTo)}` : ""}`, {
      method: "DELETE",
    }),
};