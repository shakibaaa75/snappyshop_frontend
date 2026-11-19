import type { TemplateId } from "./types";

/** Stable category IDs are stored in the design draft, not just this browser. */
export const sellingCategories = [
  {
    id: "fashion",
    label: "Clothing & fashion",
    detail: "Everyday wear, boutiques and accessories",
    templates: ["fashion", "boutique","casual", "yokai"],
  },
  {
    id: "streetwear",
    label: "Streetwear",
    detail: "Graphic tees, sneakers and urban collections",
templates: ["streetwear", "minimal", "urban"],  },
  {
    id: "beauty",
    label: "Beauty & skincare",
    detail: "Cosmetics, skincare and personal care",
    templates: ["beauty", "skincare", "premium", "minimal"],
  },
  {
    id: "electronics",
    label: "Electronics",
    detail: "Gadgets, devices and tech accessories",
    templates: ["tech", "edge", "marketplace", "minimal"],
  },
  {
    id: "home",
    label: "Home & living",
    detail: "Furniture, decor and home essentials",
    templates: ["living", "minimal", "premium"],
  },
  {
    id: "food",
    label: "Food & groceries",
    detail: "Fresh food, pantry items and everyday needs",
    templates: ["grocery", "bangla-bazaar", "marketplace"],
  },
  {
    id: "sports",
    label: "Sports & fitness",
    detail: "Activewear, equipment and outdoor gear",
    templates: ["sport", "edge",  "minimal","lookbook"],
  },
  {
    id: "kids",
    label: "Kids & baby",
    detail: "Clothing, toys and essentials for little ones",
    templates: ["kids", "boutique", "minimal"],
  },
  {
    id: "general",
    label: "Other / mixed products",
    detail: "A little of everything, or still deciding",
    templates: ["marketplace", "minimal", "promo"],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  detail: string;
  templates: readonly TemplateId[];
}[];

export type SellingCategory = (typeof sellingCategories)[number]["id"];
export function normalizeSellingCategory(value: unknown): SellingCategory | "" {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase();
  const exact = sellingCategories.find(
    (category) =>
      category.id === normalized || category.label.toLowerCase() === normalized,
  );
  if (exact) return exact.id;
  const legacy: Record<string, SellingCategory> = {
    clothing: "fashion",
    clothes: "fashion",
    tech: "electronics",
    grocery: "food",
    groceries: "food",
    skincare: "beauty",
    sport: "sports",
    living: "home",
    other: "general",
  };
  return Object.prototype.hasOwnProperty.call(legacy, normalized)
    ? legacy[normalized]
    : "";
}
export function getSellingCategory(value: unknown) {
  return sellingCategories.find(
    (category) => category.id === normalizeSellingCategory(value),
  );
}
export function recommendedTemplates(value: unknown): readonly TemplateId[] {
  return [...new Set<TemplateId>(getSellingCategory(value)?.templates ?? [])];
}

/** Suggestions for stores created before the registration category was saved.
 * This is only a hint: never persist an inferred category without seller input.
 */
export function inferSellingCategory(
  categories: readonly { name: string }[] = [],
  products: readonly { name: string }[] = [],
): SellingCategory | "" {
  const rules: [SellingCategory, RegExp][] = [
    [
      "streetwear",
      /\b(streetwear|hoodie|hoodies|sneaker|sneakers|graphic tee|oversized)\b/i,
    ],
    [
      "beauty",
      /\b(beauty|skincare|skin care|cosmetic|cosmetics|makeup|serum|lipstick|perfume)\b/i,
    ],
    [
      "electronics",
      /\b(electronics|tech|gadget|gadgets|phone|phones|laptop|headphones|charger)\b/i,
    ],
    ["home", /\b(furniture|decor|home|living|kitchen|bedding|lamp|sofa)\b/i],
    [
      "food",
      /\b(food|grocery|groceries|coffee|tea|snack|snacks|fruit|vegetables)\b/i,
    ],
    [
      "sports",
      /\b(sport|sports|fitness|cricket|football|gym|activewear|outdoor)\b/i,
    ],
    ["kids", /\b(kids|baby|babies|children|toy|toys)\b/i],
    [
      "fashion",
      /\b(fashion|clothing|clothes|dress|dresses|shirt|shirts|tshirt|t-shirt|jeans|saree|salwar|kameez|jewelry|jewellery|accessories)\b/i,
    ],
  ];
  const scores = rules
    .map(([id, pattern]) => ({
      id,
      score:
        categories.reduce(
          (n, item) => n + (pattern.test(item.name) ? 3 : 0),
          0,
        ) +
        products.reduce((n, item) => n + (pattern.test(item.name) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);
  return scores[0]?.score > 0 ? scores[0].id : "";
}
