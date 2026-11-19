import type {
  ProductCombination,
  ProductInput,
  ProductOption,
  ProductOptionValue,
} from "@/lib/api/products";
import {
  MAX_COMBINATIONS,
  MAX_VALUES_PER_OPTION,
  MAX_VARIANT_IMAGES,
  countCombinations,
  isColorName,
  rebuildCombinations,
  uid,
} from "@/lib/api/product-variants";

/**
 * One combined gallery for the seller.
 *
 * Nothing changes in what is saved: the main image, the gallery and the
 * photos of each variant still live where they always did. This file only
 * reads them as ONE list of images, and writes a change ("this photo belongs
 * to Red") back to the right place, so the same file is never uploaded twice.
 */

export type PhotoSlice = Pick<
  ProductInput,
  "mainImageUrl" | "imageUrls" | "options" | "combinations" | "variantImageMode"
>;

/** "This image belongs to <valueId> of <optionId>" (for example Color = Red). */
export interface ImageAssignment {
  optionId: string;
  valueId: string;
}

export type ImageVariantInfo =
  | {
      kind: "value";
      optionId: string;
      valueId: string;
      optionName: string;
      label: string;
      colorHex?: string;
    }
  /** Photo is on some variants, but not on a whole color/size group. */
  | { kind: "custom"; count: number };

const clean = (u?: string) => (u ?? "").trim();
const unique = (urls: string[]) => [...new Set(urls.map(clean).filter(Boolean))];

/** Options that actually have values, Color first. */
export function orderedOptions(options: ProductOption[]): ProductOption[] {
  const used = options.filter((o) => o.values.length > 0);
  return [
    ...used.filter((o) => isColorName(o.name)),
    ...used.filter((o) => !isColorName(o.name)),
  ];
}

const perVariant = (s: PhotoSlice) => s.variantImageMode === "per-variant";

/** Main image, gallery and every variant photo: one list, main first, no repeats. */
export function allPhotoUrls(s: PhotoSlice): string[] {
  return unique([
    s.mainImageUrl,
    ...s.imageUrls,
    ...(perVariant(s) ? s.combinations.flatMap((c) => c.imageUrls) : []),
  ]);
}

/**
 * Puts every photo in the product gallery (variant-only photos from older
 * products included), so there is a single list to manage.
 */
export function normalizePhotos(s: PhotoSlice): {
  mainImageUrl: string;
  imageUrls: string[];
} {
  const all = allPhotoUrls(s);
  const main = clean(s.mainImageUrl) || all[0] || "";
  return { mainImageUrl: main, imageUrls: all.filter((u) => u !== main) };
}

/** url -> the color/size/etc. value it belongs to (only whole-group matches). */
export function readAssignments(s: PhotoSlice): Map<string, ImageAssignment> {
  const out = new Map<string, ImageAssignment>();
  if (!perVariant(s)) return out;
  const opts = orderedOptions(s.options);
  const combos = s.combinations;

  for (const url of unique(combos.flatMap((c) => c.imageUrls))) {
    const holders = combos.filter((c) =>
      c.imageUrls.some((x) => clean(x) === url),
    );
    for (const o of opts) {
      const ids = new Set(holders.map((c) => c.valueIds[o.id]));
      if (ids.size !== 1) continue;
      const valueId = [...ids][0];
      if (!valueId) continue;
      const group = combos.filter((c) => c.valueIds[o.id] === valueId);
      if (group.every((c) => holders.includes(c))) {
        out.set(url, { optionId: o.id, valueId });
        break;
      }
    }
  }
  return out;
}

/** What to show on an image: its variant, "n variants", or nothing. */
export function variantInfoFor(
  s: PhotoSlice,
  url: string,
  assignments = readAssignments(s),
): ImageVariantInfo | null {
  const key = clean(url);
  const a = assignments.get(key);
  if (a) {
    const option = s.options.find((o) => o.id === a.optionId);
    const value = option?.values.find((v) => v.id === a.valueId);
    if (option && value) {
      return {
        kind: "value",
        optionId: option.id,
        valueId: value.id,
        optionName: option.name.trim() || "Option",
        label: value.label.trim() || "Unnamed",
        colorHex: value.colorHex,
      };
    }
  }
  if (perVariant(s)) {
    const count = s.combinations.filter((c) =>
      c.imageUrls.some((x) => clean(x) === key),
    ).length;
    if (count > 0) return { kind: "custom", count };
  }
  return null;
}

const byOrder = (urls: string[], order: string[]) =>
  [...urls].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia < 0 ? 9999 : ia) - (ib < 0 ? 9999 : ib);
  });

/** Photos of one variant value, in gallery order (for previews). */
export function valueImageUrls(
  s: PhotoSlice,
  optionId: string,
  valueId: string,
  order: string[] = allPhotoUrls(s),
): string[] {
  if (!perVariant(s)) return [];
  const urls = unique(
    s.combinations
      .filter((c) => c.valueIds[optionId] === valueId)
      .flatMap((c) => c.imageUrls),
  );
  return byOrder(urls, order);
}

/**
 * Links a photo to a variant value (or unlinks it with `null`).
 * Every combination of that value gets the photo; it is removed from all
 * the others, so a photo belongs to one variant at a time.
 */
export function assignImage(
  s: PhotoSlice,
  url: string,
  target: ImageAssignment | null,
  order: string[] = allPhotoUrls(s),
):
  | { combinations: ProductCombination[]; variantImageMode: ProductInput["variantImageMode"] }
  | { error: string } {
  const u = clean(url);
  // Photos typed into a product that is not in "per-variant" mode are not
  // saved, so start from a clean slate when switching it on.
  const base = perVariant(s)
    ? s.combinations
    : s.combinations.map((c) => ({ ...c, imageUrls: [] as string[] }));

  let combos = base.map((c) => ({
    ...c,
    imageUrls: c.imageUrls.filter((x) => clean(x) !== u),
  }));

  if (target) {
    const targets = combos.filter(
      (c) => c.valueIds[target.optionId] === target.valueId,
    );
    if (targets.length === 0) {
      return {
        error:
          "That variant has no combinations yet. Add it in the Variants section first.",
      };
    }
    if (
      targets.some(
        (c) => c.imageUrls.filter((x) => clean(x)).length >= MAX_VARIANT_IMAGES,
      )
    ) {
      return {
        error: `A variant can have up to ${MAX_VARIANT_IMAGES} photos. Move one to another variant first.`,
      };
    }
    const ids = new Set(targets.map((c) => c.id));
    combos = combos.map((c) =>
      ids.has(c.id)
        ? {
            ...c,
            imageUrls: byOrder(
              [...c.imageUrls.filter((x) => clean(x)), u],
              order,
            ),
          }
        : c,
    );
  }

  return {
    combinations: combos,
    variantImageMode: target ? "per-variant" : s.variantImageMode,
  };
}

/** Removes a photo everywhere in the variants (used when it is deleted). */
export function dropImage(
  combos: ProductCombination[],
  url: string,
): ProductCombination[] {
  const u = clean(url);
  return combos.map((c) =>
    c.imageUrls.some((x) => clean(x) === u)
      ? { ...c, imageUrls: c.imageUrls.filter((x) => clean(x) !== u) }
      : c,
  );
}

/** Swaps one photo for another everywhere in the variants (used by Replace). */
export function swapImage(
  combos: ProductCombination[],
  from: string,
  to: string,
): ProductCombination[] {
  const f = clean(from);
  return combos.map((c) =>
    c.imageUrls.some((x) => clean(x) === f)
      ? { ...c, imageUrls: c.imageUrls.map((x) => (clean(x) === f ? to : x)) }
      : c,
  );
}

/**
 * After variants were rebuilt (a new size was added, say), new rows get the
 * photos of their color/size group, so nothing has to be assigned twice.
 */
export function inheritScopedImages(
  prev: PhotoSlice,
  nextCombos: ProductCombination[],
): ProductCombination[] {
  const map = readAssignments(prev);
  if (map.size === 0) return nextCombos;
  return nextCombos.map((c) => {
    const add = [...map]
      .filter(
        ([url, a]) =>
          c.valueIds[a.optionId] === a.valueId &&
          !c.imageUrls.some((x) => clean(x) === url),
      )
      .map(([url]) => url);
    return add.length
      ? { ...c, imageUrls: [...c.imageUrls.filter((x) => clean(x)), ...add] }
      : c;
  });
}

/**
 * Adds a new value (for example "Green") under an existing option and
 * rebuilds the variants, keeping everything already set.
 * If the value already exists, its id is returned and nothing changes.
 */
export function createValue(
  s: PhotoSlice,
  optionId: string,
  rawLabel: string,
  colorHex?: string,
):
  | {
      options: ProductOption[];
      combinations: ProductCombination[];
      valueId: string;
    }
  | { error: string } {
  const option = s.options.find((o) => o.id === optionId);
  const label = rawLabel.trim();
  if (!option) return { error: "Choose an option first." };
  if (!label) return { error: "Type a name, like “Green”." };

  const existing = option.values.find(
    (v) => v.label.trim().toLowerCase() === label.toLowerCase(),
  );
  if (existing) {
    return { options: s.options, combinations: s.combinations, valueId: existing.id };
  }
  if (option.values.length >= MAX_VALUES_PER_OPTION) {
    return { error: `An option can have up to ${MAX_VALUES_PER_OPTION} values.` };
  }

  const value: ProductOptionValue = {
    id: uid("val"),
    label,
    ...(colorHex ? { colorHex } : {}),
  };
  const options = s.options.map((o) =>
    o.id === optionId ? { ...o, values: [...o.values, value] } : o,
  );
  if (countCombinations(options) > MAX_COMBINATIONS) {
    return {
      error: `That would create more than ${MAX_COMBINATIONS} variants. Remove some values first.`,
    };
  }

  const combinations = inheritScopedImages(
    s,
    rebuildCombinations(s.options, options, s.combinations),
  );
  return { options, combinations, valueId: value.id };
}
