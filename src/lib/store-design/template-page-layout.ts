import type { HomeSectionId, TemplateId } from "./types";

export type PageLayout = {
  name: string;
  navigation: "top" | "left" | "right";
  width: number;
  sidebar: number;
  gap: number;
  mobileGap: number;
  profile: "above" | "inside";
  treatment: "open" | "panels" | "rules";
  radius: number;
  cartRail?: boolean;
  slots: Partial<Record<HomeSectionId, { span: number; start?: number }>>;
};
type RedesignedTemplate = Exclude<TemplateId, "streetwear" | "yokai">;

// No palette, font, header-style or content fields belong in this map.
// Streetwear and Yokai deliberately retain their existing rendering paths.
export const TEMPLATE_PAGE_LAYOUTS = {
  minimal: { name: "Quiet centered storefront", navigation: "top", width: 1120, sidebar: 0, gap: 64, mobileGap: 32, profile: "above", treatment: "open", radius: 0,
    slots: { hero: { span: 12 }, categories: { span: 10, start: 2 }, gallery: { span: 12 }, story: { span: 8, start: 3 }, newArrivals: { span: 12 } } },
  premium: { name: "Luxury salon", navigation: "right", width: 1560, sidebar: 208, gap: 52, mobileGap: 32, profile: "above", treatment: "rules", radius: 0,
    slots: { hero: { span: 12 }, featured: { span: 8 }, spotlight: { span: 4 }, newArrivals: { span: 12 }, story: { span: 8 }, trust: { span: 4 } } },
  promo: { name: "Campaign board", navigation: "top", width: 1440, sidebar: 0, gap: 20, mobileGap: 18, profile: "inside", treatment: "panels", radius: 24,
    slots: { hero: { span: 8 }, promo: { span: 4 }, trust: { span: 12 }, bestSellers: { span: 7 }, featured: { span: 5 }, categories: { span: 12 } } },
  fashion: { name: "Fashion magazine", navigation: "top", width: 1480, sidebar: 0, gap: 56, mobileGap: 32, profile: "above", treatment: "open", radius: 0,
    slots: { hero: { span: 12 }, categories: { span: 4 }, newArrivals: { span: 8 }, spotlight: { span: 7 }, featured: { span: 5 }, gallery: { span: 12 }, story: { span: 7, start: 5 } } },
  marketplace: { name: "Department catalog", navigation: "left", width: 1680, sidebar: 224, gap: 24, mobileGap: 20, profile: "inside", treatment: "panels", radius: 16, cartRail: true,
    slots: { hero: { span: 12 }, trust: { span: 12 }, categories: { span: 12 }, featured: { span: 12 }, spotlight: { span: 6 }, gallery: { span: 6 } } },
  sport: { name: "Sport campaign arena", navigation: "top", width: 1600, sidebar: 0, gap: 12, mobileGap: 20, profile: "above", treatment: "rules", radius: 0,
    slots: { hero: { span: 12 }, featured: { span: 12 }, categories: { span: 5 }, newArrivals: { span: 7 }, gallery: { span: 12 }, trust: { span: 8, start: 3 } } },
  urban: { name: "Street poster wall", navigation: "left", width: 1540, sidebar: 180, gap: 28, mobileGap: 24, profile: "above", treatment: "open", radius: 0,
    slots: { hero: { span: 12 }, countdown: { span: 4 }, newArrivals: { span: 8 }, bestSellers: { span: 12 }, categories: { span: 7 }, promo: { span: 5 }, gallery: { span: 12 } } },
  boutique: { name: "Independent atelier", navigation: "top", width: 1200, sidebar: 0, gap: 40, mobileGap: 28, profile: "above", treatment: "panels", radius: 28,
    slots: { hero: { span: 12 }, categories: { span: 5 }, featured: { span: 7 }, gallery: { span: 7 }, story: { span: 5 }, newArrivals: { span: 12 }, trust: { span: 10, start: 2 } } },
  grocery: { name: "Daily shopping aisle", navigation: "left", width: 1760, sidebar: 200, gap: 16, mobileGap: 16, profile: "inside", treatment: "open", radius: 12, cartRail: true,
    slots: { hero: { span: 12 }, trust: { span: 12 }, categories: { span: 12 }, bestSellers: { span: 8 }, promo: { span: 4 }, gallery: { span: 12 }, newArrivals: { span: 12 } } },
  tech: { name: "Modular product lab", navigation: "top", width: 1480, sidebar: 0, gap: 18, mobileGap: 18, profile: "inside", treatment: "panels", radius: 8,
    slots: { hero: { span: 8 }, featured: { span: 4 }, categories: { span: 4 }, spotlight: { span: 8 }, bestSellers: { span: 12 }, gallery: { span: 8 }, trust: { span: 4 } } },
  beauty: { name: "Beauty studio", navigation: "top", width: 1180, sidebar: 0, gap: 48, mobileGap: 28, profile: "above", treatment: "open", radius: 24,
    slots: { hero: { span: 10, start: 2 }, categories: { span: 12 }, featured: { span: 7 }, spotlight: { span: 5 }, gallery: { span: 12 }, story: { span: 6 }, newArrivals: { span: 6 } } },
  living: { name: "Room-by-room showroom", navigation: "top", width: 1660, sidebar: 0, gap: 48, mobileGap: 28, profile: "above", treatment: "rules", radius: 0,
    slots: { hero: { span: 12 }, categories: { span: 12 }, featured: { span: 8 }, spotlight: { span: 4 }, gallery: { span: 12 }, story: { span: 5 }, newArrivals: { span: 7 } } },
  kids: { name: "Playroom mosaic", navigation: "top", width: 1320, sidebar: 0, gap: 24, mobileGap: 20, profile: "inside", treatment: "panels", radius: 32,
    slots: { hero: { span: 8 }, categories: { span: 4 }, featured: { span: 12 }, promo: { span: 5 }, newArrivals: { span: 7 }, gallery: { span: 8 }, story: { span: 4 }, trust: { span: 12 } } },
  "bangla-bazaar": { name: "Local market stalls", navigation: "left", width: 1540, sidebar: 212, gap: 20, mobileGap: 18, profile: "above", treatment: "rules", radius: 0,
    slots: { hero: { span: 12 }, categories: { span: 12 }, bestSellers: { span: 7 }, featured: { span: 5 }, promo: { span: 12 }, newArrivals: { span: 8 }, trust: { span: 4 } } },
  "night-sale": { name: "Sale command center", navigation: "right", width: 1500, sidebar: 192, gap: 20, mobileGap: 18, profile: "inside", treatment: "panels", radius: 12,
    slots: { hero: { span: 8 }, countdown: { span: 4 }, promo: { span: 12 }, bestSellers: { span: 12 }, featured: { span: 8 }, categories: { span: 4 }, gallery: { span: 12 } } },
  lookbook: { name: "Editorial photo journal", navigation: "top", width: 1560, sidebar: 0, gap: 80, mobileGap: 40, profile: "above", treatment: "open", radius: 0,
    slots: { hero: { span: 12 }, gallery: { span: 12 }, categories: { span: 8, start: 3 }, featured: { span: 9, start: 1 }, newArrivals: { span: 9, start: 4 }, story: { span: 6, start: 4 }, spotlight: { span: 12 } } },
  skincare: { name: "Ritual collection", navigation: "top", width: 1080, sidebar: 0, gap: 44, mobileGap: 28, profile: "above", treatment: "panels", radius: 36,
    slots: { hero: { span: 12 }, categories: { span: 12 }, featured: { span: 6 }, spotlight: { span: 6 }, story: { span: 5 }, gallery: { span: 7 }, newArrivals: { span: 12 }, trust: { span: 8, start: 3 } } },
  edge: { name: "Asymmetric campaign grid", navigation: "right", width: 1600, sidebar: 176, gap: 12, mobileGap: 16, profile: "above", treatment: "panels", radius: 0,
    slots: { hero: { span: 9 }, categories: { span: 3 }, featured: { span: 12 }, gallery: { span: 8 }, promo: { span: 4 }, newArrivals: { span: 7 }, bestSellers: { span: 5 } } },
  casual: { name: "Weekend collection", navigation: "top", width: 1380, sidebar: 0, gap: 36, mobileGap: 24, profile: "inside", treatment: "open", radius: 12,
    slots: { hero: { span: 12 }, categories: { span: 12 }, featured: { span: 12 }, newArrivals: { span: 12 }, gallery: { span: 8 }, story: { span: 4 }, promo: { span: 6 }, trust: { span: 6 } } },
} satisfies Record<RedesignedTemplate, PageLayout>;

export function templatePageLayout(template: TemplateId): PageLayout | null {
  if (template === "streetwear" || template === "yokai") return null;
  return TEMPLATE_PAGE_LAYOUTS[template] ?? null;
}

export function templateSectionSlot(plan: PageLayout, id: HomeSectionId, compact: boolean) {
  const slot = compact ? { span: 12 } : plan.slots[id] ?? { span: 12 };
  return { span: slot.span, start: "start" in slot ? slot.start : undefined };
}

/** Pack consecutive sections without leaving unused columns or changing order. */
export function balancedSectionRows(plan: PageLayout, ids: HomeSectionId[], width: number, compact: boolean) {
  const rows: { id: HomeSectionId; span: number }[][] = [];
  for (let index = 0; index < ids.length; index++) {
    const id = ids[index], next = ids[index + 1];
    const a = plan.slots[id]?.span ?? 12, b = next ? plan.slots[next]?.span ?? 12 : 12;
    const mayPair = !compact && next && a < 12 && b < 12 && a + b <= 12
      && id !== "allProducts" && next !== "allProducts" && id !== "gallery" && next !== "gallery";
    const left = Math.max(4, Math.min(8, Math.round(12 * a / (a + b))));
    const gap = Math.min(32, plan.gap);
    if (mayPair && ((width - gap) * Math.min(left, 12 - left) / 12) >= 340) {
      rows.push([{ id, span: left }, { id: next, span: 12 - left }]); index++;
    } else rows.push([{ id, span: 12 }]);
  }
  return rows;
}

/** Preserve useful density without stretching cards across oversized tracks. */
export function balancedProductColumns(width: number, preferred: number) {
  const available = Number.isFinite(width) && width > 0 ? width : 900;
  const gap = available < 600 ? 12 : 16;
  const minimum = available < 600 ? 150 : 180;
  const maximumFitting = Math.max(1, Math.floor((available + gap) / (minimum + gap)));
  const minimumNeeded = Math.max(1, Math.ceil((available + gap) / (280 + gap)));
  return Math.max(minimumNeeded, Math.min(maximumFitting, Math.max(1, preferred)));
}
