import type { TemplateId } from "./types";

type Display = {
  gap: number;
  rowGap: number;
  feature?: "first" | "every-five" | "last";
  stagger?: number;
};

// Collection arrangements are separate from productLayout (the detail page).
// Keep this exhaustive so new templates must choose their collection treatment.
export const PRODUCT_DISPLAYS = {
  minimal: { gap: 28, rowGap: 40 },
  premium: { gap: 24, rowGap: 40, feature: "first" },
  promo: { gap: 12, rowGap: 20, feature: "every-five" },
  fashion: { gap: 20, rowGap: 36, stagger: 48 },
  marketplace: { gap: 8, rowGap: 12 },
  sport: { gap: 4, rowGap: 24 },
  urban: { gap: 8, rowGap: 32, feature: "last" },
  boutique: { gap: 28, rowGap: 44, stagger: 28 },
  grocery: { gap: 12, rowGap: 16 },
  tech: { gap: 16, rowGap: 16, feature: "first" },
  beauty: { gap: 32, rowGap: 48 },
  living: { gap: 24, rowGap: 48, feature: "every-five" },
  kids: { gap: 18, rowGap: 28, stagger: 20 },
  "bangla-bazaar": { gap: 6, rowGap: 16 },
  "night-sale": { gap: 10, rowGap: 20, feature: "first" },
  lookbook: { gap: 32, rowGap: 56, stagger: 64 },
  skincare: { gap: 24, rowGap: 44, feature: "last" },
  edge: { gap: 12, rowGap: 24, feature: "every-five" },
  casual: { gap: 16, rowGap: 32 },
  streetwear: { gap: 4, rowGap: 32 },
  yokai: { gap: 0, rowGap: 24 },
} satisfies Record<TemplateId, Display>;

export function productDisplay(template: TemplateId, mobile: boolean) {
  const look: Display = PRODUCT_DISPLAYS[template] ?? PRODUCT_DISPLAYS.minimal;
  return mobile
    ? { ...look, gap: Math.min(look.gap, 12), rowGap: Math.min(look.rowGap, 24), stagger: 0 }
    : look;
}

export function productSpan(look: Display, index: number, count: number, columns: number, mobile: boolean) {
  if (mobile || columns < 3 || count < columns) return 1;
  const featured = look.feature === "first" ? index === 0
    : look.feature === "last" ? index === count - 1
    : look.feature === "every-five" ? index % 5 === 0 : false;
  return featured ? 2 : 1;
}
