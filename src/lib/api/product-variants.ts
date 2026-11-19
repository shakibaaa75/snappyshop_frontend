import type {
  ProductAttribute,
  ProductCombination,
  ProductInput,
  ProductOption,
} from "@/lib/api/products";

export const MAX_OPTIONS = 4;
export const MAX_VALUES_PER_OPTION = 20;
export const MAX_COMBINATIONS = 100;
export const MAX_VARIANT_IMAGES = 3;
export const MAX_ATTRIBUTES = 20;

export const uid = (prefix = "id") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

type VariantFields = Pick<ProductInput, "options" | "combinations" | "variantImageMode">;

/* ------------------------------------------------------------------ */
/* Combination generation                                              */
/* ------------------------------------------------------------------ */

/** Options that take part in variants: any option that has values. */
const usable = (options: ProductOption[]) => options.filter((o) => o.values.length > 0);

export function countCombinations(options: ProductOption[]): number {
  const u = usable(options);
  return u.length === 0 ? 0 : u.reduce((n, o) => n * o.values.length, 1);
}

function cartesian(u: ProductOption[]): Record<string, string>[] {
  let rows: Record<string, string>[] = [{}];
  for (const o of u) {
    rows = rows.flatMap((r) => o.values.map((v) => ({ ...r, [o.id]: v.id })));
  }
  return rows;
}

const sameSelection = (u: ProductOption[], a: Record<string, string>, b: Record<string, string>) =>
  u.every((o) => a[o.id] === b[o.id]);

const blankCombo = (valueIds: Record<string, string>): ProductCombination => ({
  id: uid("cmb"),
  valueIds,
  stock: 0,
  imageUrls: [],
});

/**
 * Recomputes combinations after the option structure changed (a value or
 * option was added/removed). Label and colour edits don't need this.
 *
 * - Same set of options: existing rows are kept untouched, rows that contain a
 *   brand-new value are added, and rows the seller removed earlier stay removed.
 * - Option added/removed: every old variant's price, stock, SKU and images are
 *   carried over to the closest new row (each old variant is used once).
 */
export function rebuildCombinations(
  prevOptions: ProductOption[],
  nextOptions: ProductOption[],
  prevCombos: ProductCombination[],
): ProductCombination[] {
  const pu = usable(prevOptions);
  const nu = usable(nextOptions);
  if (nu.length === 0) return [];

  const rows = cartesian(nu);
  const sameSet = pu.length === nu.length && pu.every((o, i) => o.id === nu[i].id);

  if (sameSet) {
    const known = new Set(pu.flatMap((o) => o.values.map((v) => v.id)));
    const out: ProductCombination[] = [];
    for (const row of rows) {
      const hit = prevCombos.find((c) => sameSelection(nu, c.valueIds, row));
      if (hit) out.push(hit);
      else if (nu.some((o) => !known.has(row[o.id]))) out.push(blankCombo(row));
      // otherwise: the seller removed this variant on purpose, so it stays removed
    }
    return out;
  }

  const claimed = new Set<string>();
  const exact = (c: ProductCombination, row: Record<string, string>) =>
    Object.keys(c.valueIds).length === nu.length && sameSelection(nu, c.valueIds, row);
  const loose = (c: ProductCombination, row: Record<string, string>) => {
    const shared = nu.filter((o) => o.id in c.valueIds);
    return shared.length > 0 && shared.every((o) => c.valueIds[o.id] === row[o.id]);
  };

  return rows.map((row) => {
    const hit =
      prevCombos.find((c) => !claimed.has(c.id) && exact(c, row)) ??
      prevCombos.find((c) => !claimed.has(c.id) && loose(c, row));
    if (!hit) return blankCombo(row);
    claimed.add(hit.id);
    return { ...hit, valueIds: row };
  });
}

/** Brings back every variant the seller removed. Existing rows are untouched. */
export function restoreCombinations(
  options: ProductOption[],
  combos: ProductCombination[],
): ProductCombination[] {
  const u = usable(options);
  return cartesian(u).map(
    (row) => combos.find((c) => sameSelection(u, c.valueIds, row)) ?? blankCombo(row),
  );
}

/* ------------------------------------------------------------------ */
/* Validation and cleaning                                             */
/* ------------------------------------------------------------------ */

/** First problem found, or null when the variants are valid. */
export function validateVariants(
  v: Pick<ProductInput, "options" | "combinations">,
  baseSku: string,
): string | null {
  const names = new Set<string>();
  let total = 0;

  for (const o of v.options) {
    const name = o.name.trim();
    if (!name && o.values.length === 0) continue; // untouched blank option

    if (!name) return "Give every option a name, or remove the empty one.";
    if (names.has(name.toLowerCase())) return `You have two options named “${name}”.`;
    names.add(name.toLowerCase());

    if (o.values.length === 0) return `Add at least one value to “${name}”, or remove it.`;

    const labels = new Set<string>();
    for (const val of o.values) {
      const label = val.label.trim().toLowerCase();
      if (!label) return `“${name}” has an empty value. Fill it in or remove it.`;
      if (labels.has(label)) return `“${name}” has the value “${val.label.trim()}” twice.`;
      labels.add(label);
    }
    total = (total || 1) * o.values.length;
  }

  if (total > MAX_COMBINATIONS) {
    return `That makes ${total} variants. Keep it to ${MAX_COMBINATIONS} or fewer.`;
  }

  const skus = new Set<string>();
  if (baseSku.trim()) skus.add(baseSku.trim().toLowerCase());
  for (const c of v.combinations) {
    const sku = (c.sku ?? "").trim().toLowerCase();
    if (!sku) continue;
    if (skus.has(sku)) return `The SKU “${c.sku!.trim()}” is used more than once.`;
    skus.add(sku);
  }
  return null;
}

/** Tidies variants for the API without regenerating or restoring any rows. */
export function cleanVariants(v: VariantFields): VariantFields {
  const options = v.options
    .map((o) => ({
      ...o,
      name: o.name.trim(),
      values: o.values.map((x) => ({ ...x, label: x.label.trim() })).filter((x) => x.label),
    }))
    .filter((o) => o.name && o.values.length > 0);

  if (options.length === 0) {
    return { options: [], combinations: [], variantImageMode: "shared" };
  }

  const validIds = new Map(options.map((o) => [o.id, new Set(o.values.map((x) => x.id))]));
  const perVariant = v.variantImageMode === "per-variant";

  const combinations = v.combinations
    .filter((c) => options.every((o) => validIds.get(o.id)!.has(c.valueIds[o.id])))
    .map((c) => ({
      ...c,
      valueIds: Object.fromEntries(options.map((o) => [o.id, c.valueIds[o.id]])),
      price: c.price && c.price > 0 ? c.price : undefined,
      sku: c.sku?.trim() || undefined,
      imageUrls: perVariant ? c.imageUrls.filter((u) => u.trim()) : [],
    }));

  return { options, combinations, variantImageMode: v.variantImageMode };
}

export function validateAttributes(attributes: ProductAttribute[]): string | null {
  const keys = new Set<string>();
  for (const a of attributes) {
    const key = a.key.trim();
    const value = a.value.trim();
    if (!key && !value) continue;
    if (!key) return `A specification with the value “${value}” needs a name.`;
    if (!value) return `“${key}” needs a value. Fill it in or remove it.`;
    if (keys.has(key.toLowerCase())) return `“${key}” is listed twice.`;
    keys.add(key.toLowerCase());
  }
  return null;
}

export const cleanAttributes = (attributes: ProductAttribute[]): ProductAttribute[] =>
  attributes
    .map((a) => ({ key: a.key.trim(), value: a.value.trim() }))
    .filter((a) => a.key && a.value);

/** Stops Enter inside a text field from submitting the whole product form. */
export function blockEnterSubmit(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
    e.preventDefault();
  }
}

/* ------------------------------------------------------------------ */
/* Photos shared by a group of variants (e.g. every size of "Red")     */
/* ------------------------------------------------------------------ */

/** "shared" = product gallery, "each" = per combination, otherwise an option id. */
export type ImageGroup = "shared" | "each" | string;

const imgKey = (c: ProductCombination) => c.imageUrls.filter((u) => u.trim()).join("|");
const padImages = (urls: string[], len = MAX_VARIANT_IMAGES) => {
  const next = [...urls];
  while (next.length < len) next.push("");
  return next;
};

export const isColorName = (name: string) =>
  ["color", "colour"].includes(name.trim().toLowerCase());

/** Works out how an existing product's photos are grouped (used when editing). */
export function deriveImageGroup(
  options: ProductOption[],
  combos: ProductCombination[],
  mode: ProductInput["variantImageMode"],
): ImageGroup {
  if (mode !== "per-variant") return "shared";
  const u = options.filter((o) => o.values.length > 0);
  if (u.length === 0) return "shared";
  const ordered = [...u.filter((o) => isColorName(o.name)), ...u.filter((o) => !isColorName(o.name))];
  for (const o of ordered) {
    const byValue = new Map<string, Set<string>>();
    for (const c of combos) {
      const vid = c.valueIds[o.id];
      if (!vid) continue;
      const set = byValue.get(vid) ?? new Set<string>();
      set.add(imgKey(c));
      byValue.set(vid, set);
    }
    if ([...byValue.values()].every((s) => s.size <= 1)) return o.id;
  }
  return "each";
}

/** True when combinations that share a value have different photos. */
export function hasImageConflict(combos: ProductCombination[], optionId: string): boolean {
  const byValue = new Map<string, Set<string>>();
  for (const c of combos) {
    const vid = c.valueIds[optionId];
    const k = imgKey(c);
    if (!vid || !k) continue;
    const set = byValue.get(vid) ?? new Set<string>();
    set.add(k);
    byValue.set(vid, set);
  }
  return [...byValue.values()].some((s) => s.size > 1);
}

/** Gives every combination in a group the photos of the first one that has any. */
export function adoptGroupImages(combos: ProductCombination[], optionId: string): ProductCombination[] {
  const source = new Map<string, string[]>();
  for (const c of combos) {
    const vid = c.valueIds[optionId];
    if (vid && imgKey(c) && !source.has(vid)) source.set(vid, c.imageUrls);
  }
  return combos.map((c) => {
    const src = source.get(c.valueIds[optionId]);
    return src ? { ...c, imageUrls: [...src] } : c;
  });
}

/** Fills new rows (e.g. a newly added size) with their group's existing photos. */
export function syncGroupImages(combos: ProductCombination[], optionId: string): ProductCombination[] {
  const source = new Map<string, string[]>();
  for (const c of combos) {
    const vid = c.valueIds[optionId];
    if (vid && imgKey(c) && !source.has(vid)) source.set(vid, c.imageUrls);
  }
  return combos.map((c) => {
    const src = source.get(c.valueIds[optionId]);
    return src && !imgKey(c) ? { ...c, imageUrls: [...src] } : c;
  });
}

/** Sets one photo slot for every combination that has this option value. */
export function setGroupImage(
  combos: ProductCombination[],
  optionId: string,
  valueId: string,
  slot: number,
  url: string,
): ProductCombination[] {
  const current = combos.find((c) => c.valueIds[optionId] === valueId)?.imageUrls ?? [];
  const next = padImages(current);
  next[slot] = url;
  return combos.map((c) => (c.valueIds[optionId] === valueId ? { ...c, imageUrls: [...next] } : c));
}