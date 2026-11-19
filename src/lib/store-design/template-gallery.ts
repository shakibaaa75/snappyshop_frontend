import type { TemplateId, GalleryStyle } from "./types";
export type GalleryShape = "square" | "soft" | "ticket" | "cut" | "print" | "bevel" | "arch" | "blob" | "shelf" | "circle" | "film" | "outline";
export type GalleryPlan = {
  id: string; name: string; base: GalleryStyle; renderer?: GalleryStyle; columns: number;
  cells: { columns: number; rows: number }[];
  mode: "grid" | "rail"; shape: GalleryShape;
  caption: "below" | "overlay" | "side" | "numbered";
  gap: number; stagger: number;
};
type Spec = [name: string, columns: number, cells: string, mode?: "rail"];
type Collection = { shape: GalleryShape; caption: GalleryPlan["caption"]; gap: number; stagger: number; layouts: Spec[] };
// Deliberately curated per template, not three universal layouts with new labels.
export const TEMPLATE_GALLERIES = {
  "minimal": { shape: "square", caption: "below", gap: 28, stagger: 0, layouts: [
    ["Contact sheet", 3, "1x2 1x2 1x2"],
    ["Quiet focus", 4, "3x3 1x1 1x2"],
    ["Fine filmstrip", 5, "1x2", "rail"],
    ["Paired prints", 2, "1x3 1x3"],
    ["Whitespace rhythm", 4, "1x2 2x3 1x2"],
    ["Wide intervals", 3, "3x2 1x2 2x2"],
  ] },
  "premium": { shape: "soft", caption: "overlay", gap: 18, stagger: 0, layouts: [
    ["Collector wall", 4, "2x4 2x2 1x2 1x2"],
    ["Grand portrait", 3, "3x4 1x2 1x2 1x2"],
    ["Private collection", 4, "1x3 1x2 1x3", "rail"],
    ["Salon pairing", 5, "3x4 2x3"],
    ["Cameo quartet", 4, "1x2 2x3 1x2 2x2 2x2"],
    ["Cinematic suite", 4, "4x2 2x3 2x3"],
  ] },
  "promo": { shape: "ticket", caption: "overlay", gap: 10, stagger: 0, layouts: [
    ["Deal takeover", 3, "2x2 1x1 1x1"],
    ["Offer ladder", 4, "4x1 2x2 2x2 4x1"],
    ["Coupon reel", 4, "1x2", "rail"],
    ["Flash windows", 4, "1x1 2x2 1x1 1x1 1x1"],
    ["Mega offer", 3, "3x3 1x1 1x1 1x1"],
    ["Campaign strips", 2, "2x1 1x2 1x2"],
  ] },
  "fashion": { shape: "square", caption: "below", gap: 20, stagger: 24, layouts: [
    ["Runway triptych", 3, "1x3 1x4 1x3"],
    ["Editorial spread", 5, "2x4 3x3"],
    ["Runway reel", 5, "1x3", "rail"],
    ["Tall & cropped", 3, "2x4 1x2 1x2"],
    ["Magazine sequence", 4, "4x2 1x3 2x3 1x3"],
    ["Cover story", 3, "1x2 2x4 1x2"],
  ] },
  "marketplace": { shape: "soft", caption: "below", gap: 12, stagger: 0, layouts: [
    ["Department windows", 4, "1x2 1x2 1x2 1x2"],
    ["Category anchor", 4, "2x2 1x1 1x1 1x1 1x1"],
    ["Collection shelves", 3, "1x1 1x1 1x1"],
    ["Shop directory", 2, "1x1 1x1"],
    ["Discovery mosaic", 5, "2x2 3x2 1x1 2x1 2x1"],
    ["Browse ribbon", 5, "1x1", "rail"],
  ] },
  "sport": { shape: "cut", caption: "overlay", gap: 8, stagger: 0, layouts: [
    ["Power duo", 2, "1x3 1x3"],
    ["Action board", 4, "3x2 1x2 2x2 2x2"],
    ["Team line-up", 4, "1x3", "rail"],
    ["Matchday banners", 1, "1x2"],
    ["Podium", 3, "1x2 1x3 1x2"],
    ["Training split", 3, "2x3 1x3 3x1"],
  ] },
  "urban": { shape: "square", caption: "overlay", gap: 4, stagger: 0, layouts: [
    ["Concrete wall", 4, "1x3 2x2 1x3 2x1"],
    ["Block takeover", 3, "3x3 2x2 1x2"],
    ["Street posters", 4, "1x4", "rail"],
    ["Cut & paste", 5, "2x3 1x2 2x3 1x1"],
    ["Night windows", 4, "2x3 1x2 1x2 2x1"],
    ["Underground strips", 2, "2x2 1x3 1x3 2x1"],
  ] },
  "boutique": { shape: "print", caption: "below", gap: 24, stagger: 12, layouts: [
    ["Keepsake prints", 3, "1x2 1x2 1x2"],
    ["Scrapbook story", 4, "2x3 1x2 1x2 2x1"],
    ["Memory ribbon", 3, "1x2", "rail"],
    ["Gift pairing", 2, "1x2 1x3"],
    ["Atelier album", 3, "3x2 1x2 2x3"],
    ["Little treasures", 4, "1x1 1x2 1x1 1x2"],
  ] },
  "grocery": { shape: "soft", caption: "side", gap: 14, stagger: 0, layouts: [
    ["Fresh crates", 3, "1x1 1x1 1x1"],
    ["Market stall", 4, "2x2 2x1 1x1 1x1"],
    ["Produce aisle", 5, "1x1", "rail"],
    ["Recipe cards", 2, "1x2 1x2"],
    ["Harvest table", 3, "3x1 2x2 1x2"],
    ["Daily baskets", 4, "1x2 1x1 2x2 1x1"],
  ] },
  "tech": { shape: "bevel", caption: "overlay", gap: 10, stagger: 0, layouts: [
    ["Device lab", 4, "2x3 2x1 1x2 1x2"],
    ["Launch stage", 4, "4x3 2x1 2x1"],
    ["Device carousel", 3, "1x2", "rail"],
    ["Spec matrix", 3, "1x2 2x2 2x1 1x1"],
    ["Modular display", 4, "1x1 2x2 1x1 1x2 1x2"],
    ["Comparison wall", 2, "1x3 1x3 2x1"],
  ] },
  "beauty": { shape: "arch", caption: "below", gap: 24, stagger: 0, layouts: [
    ["Vanity arches", 3, "1x3 1x3 1x3"],
    ["Beauty campaign", 3, "2x3 1x2 1x1"],
    ["Ritual sequence", 4, "1x2", "rail"],
    ["Mirror pairing", 2, "1x4 1x4"],
    ["Soft composition", 4, "1x2 2x3 1x2 2x1"],
    ["Studio story", 2, "2x2 1x3 1x3"],
  ] },
  "living": { shape: "square", caption: "overlay", gap: 24, stagger: 0, layouts: [
    ["Room panoramas", 1, "1x2"],
    ["Home tour", 3, "3x2 2x3 1x3"],
    ["Room-by-room", 2, "1x2", "rail"],
    ["Material studies", 4, "2x3 2x1 1x2 1x2"],
    ["Open-plan spread", 5, "3x2 2x2 2x3 3x3"],
    ["Architect frames", 3, "1x4 2x2 2x2"],
  ] },
  "kids": { shape: "blob", caption: "below", gap: 18, stagger: 18, layouts: [
    ["Playroom puzzle", 3, "1x2 2x2 2x1 1x1"],
    ["Storybook pages", 2, "1x3 1x2"],
    ["Toy train", 4, "1x1 1x2", "rail"],
    ["Building blocks", 4, "2x2 1x1 1x1 1x1 1x1 2x1"],
    ["Adventure board", 3, "3x2 1x2 1x3 1x2"],
    ["Happy windows", 3, "1x1 1x2 1x1 2x2"],
  ] },
  "bangla-bazaar": { shape: "shelf", caption: "below", gap: 16, stagger: 0, layouts: [
    ["Bazaar shelves", 4, "1x1 1x1 1x1 1x1"],
    ["Shopfront stories", 3, "2x2 1x2 3x1"],
    ["Market walkway", 5, "1x2", "rail"],
    ["Craft counters", 2, "1x2 1x2 2x1"],
    ["Festival display", 4, "4x2 1x1 2x2 1x1"],
    ["Neighbourhood stalls", 3, "1x3 1x2 1x3"],
  ] },
  "night-sale": { shape: "ticket", caption: "overlay", gap: 8, stagger: 0, layouts: [
    ["Midnight posters", 3, "1x3 1x3 1x3"],
    ["Blackout takeover", 4, "3x3 1x1 1x2"],
    ["Neon ticket rail", 4, "1x3", "rail"],
    ["Offer scoreboard", 3, "3x1 1x2 2x2"],
    ["After-dark split", 2, "1x4 1x2 1x2"],
    ["Last-call mosaic", 4, "2x2 2x3 1x1 1x1"],
  ] },
  "lookbook": { shape: "square", caption: "numbered", gap: 32, stagger: 32, layouts: [
    ["Editorial folio", 4, "1x3 2x4 1x3"],
    ["Double-page spread", 2, "1x4 1x4"],
    ["Contact negative", 5, "1x3", "rail"],
    ["Essay in pictures", 3, "3x2 1x3 2x3 3x1"],
    ["Portrait interlude", 3, "1x2 2x4 1x2"],
    ["Gallery monograph", 1, "1x4"],
  ] },
  "skincare": { shape: "circle", caption: "below", gap: 30, stagger: 0, layouts: [
    ["Ritual circles", 3, "1x2 1x2 1x2"],
    ["Ingredient focus", 4, "2x3 1x2 1x2"],
    ["Routine steps", 4, "1x2", "rail"],
    ["Serum pairing", 2, "1x3 1x3"],
    ["Botanical collage", 3, "2x3 1x2 1x1"],
    ["Daily ritual", 4, "1x2 2x2 1x2"],
  ] },
  "edge": { shape: "cut", caption: "overlay", gap: 6, stagger: 0, layouts: [
    ["Precision bento", 4, "2x3 2x1 1x2 1x2"],
    ["Offset geometry", 5, "3x2 2x3 1x1 2x1"],
    ["Cutout reel", 4, "1x2", "rail"],
    ["Hard-edge quad", 2, "1x2 1x1 1x1"],
    ["Wide-angle blocks", 4, "4x1 1x3 3x3"],
    ["Stacked angles", 3, "1x3 2x1 2x2"],
  ] },
  "casual": { shape: "film", caption: "below", gap: 16, stagger: 0, layouts: [
    ["Everyday frames", 4, "1x2 1x2 1x2 1x2"],
    ["Weekend story", 3, "2x3 1x2 1x1"],
    ["Easygoing rail", 4, "1x2", "rail"],
    ["Outfit pairs", 2, "1x3 1x3"],
    ["Daily journal", 3, "3x2 1x2 2x2"],
    ["Laid-back collage", 4, "1x2 2x3 1x2 2x1"],
  ] },
  "streetwear": { shape: "square", caption: "overlay", gap: 4, stagger: 0, layouts: [
    ["Drop editorial", 3, "3x3 1x2 2x2"],
    ["Look wall", 4, "2x4 1x2 1x2 2x2"],
    ["Drop queue", 3, "1x3", "rail"],
    ["Campaign diptych", 2, "1x4 1x4"],
    ["Oversized statement", 1, "1x3"],
    ["Culture collage", 5, "3x3 2x2 2x1 2x2 3x2"],
  ] },
  "yokai": { shape: "outline", caption: "side", gap: 0, stagger: 0, layouts: [
    ["Ink panels", 2, "1x3 1x3"],
    ["Shadow composition", 4, "1x3 3x3"],
    ["Midnight scroll", 3, "1x3", "rail"],
    ["Silent panorama", 3, "3x2 1x3 2x3"],
    ["Obsidian blocks", 4, "2x2 1x1 1x1 2x3 2x1"],
    ["Portrait & void", 3, "2x4 1x2 1x2"],
  ] },
} satisfies Record<TemplateId, Collection>;
const ORIGINAL_GALLERIES: Record<TemplateId, [GalleryStyle, GalleryStyle]> = {
  "minimal": [
    "strip",
    "staggered"
  ],
  "premium": [
    "coverflow",
    "bento"
  ],
  "promo": [
    "polaroid",
    "marquee"
  ],
  "fashion": [
    "masonry",
    "staggered"
  ],
  "marketplace": [
    "grid",
    "feature"
  ],
  "sport": [
    "duo",
    "marquee"
  ],
  "urban": [
    "feature",
    "masonry"
  ],
  "boutique": [
    "polaroid",
    "staggered"
  ],
  "grocery": [
    "grid",
    "strip"
  ],
  "tech": [
    "bento",
    "coverflow"
  ],
  "beauty": [
    "staggered",
    "duo"
  ],
  "living": [
    "masonry",
    "feature"
  ],
  "kids": [
    "marquee",
    "polaroid"
  ],
  "bangla-bazaar": [
    "feature",
    "grid"
  ],
  "night-sale": [
    "marquee",
    "duo"
  ],
  "lookbook": [
    "staggered",
    "strip"
  ],
  "skincare": [
    "grid",
    "coverflow"
  ],
  "edge": [
    "bento",
    "feature"
  ],
  "casual": [
    "duo",
    "strip"
  ],
  "streetwear": [
    "duo",
    "staggered"
  ],
  "yokai": [
    "coverflow",
    "bento"
  ]
};
const slots = ["signature", "feature", "rail", "pair", "story", "mosaic"];
export function galleryOptions(template: TemplateId): GalleryPlan[] {
  const owner = Object.prototype.hasOwnProperty.call(TEMPLATE_GALLERIES, template) ? template : "minimal";
  const collection: Collection = TEMPLATE_GALLERIES[owner];
  return collection.layouts.map(([name, columns, cells, mode], index) => ({
    id: `${owner}:${slots[index]}`,
    name: index < 2 ? `Original ${ORIGINAL_GALLERIES[owner][index]} gallery` : name,
    base: index < 2 ? ORIGINAL_GALLERIES[owner][index] : "grid",
    renderer: index < 2 ? ORIGINAL_GALLERIES[owner][index] : undefined,
    columns,
    cells: cells.split(" ").map(cell => { const [columns, rows] = cell.split("x").map(Number); return { columns, rows }; }),
    mode: mode ?? "grid", shape: collection.shape, caption: collection.caption,
    gap: collection.gap, stagger: collection.stagger,
  }));
}
export function templateGallery(template: TemplateId, selected?: string): GalleryPlan {
  const options = galleryOptions(template);
  return options.find(option => option.id === selected) ?? options[0];
}
export function galleryImagePosition(item: { imagePositionX?: number; imagePositionY?: number }): string {
  const axis = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
  return `${axis(item.imagePositionX)}% ${axis(item.imagePositionY)}%`;
}

export function isScrollingGallery(plan: GalleryPlan): boolean {
  return plan.renderer ? ["strip", "marquee", "coverflow"].includes(plan.renderer) : plan.mode === "rail";
}
