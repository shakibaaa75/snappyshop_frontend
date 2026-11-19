import {
  type HomeSection,
  sectionMeta,
  type StoreDesign,
} from "@/lib/store-design/types";

/* ------------------------------------------------------------------ */
/* Homepage builder                                                    */
/* ------------------------------------------------------------------ */

export function summary(s: HomeSection, d: StoreDesign): string {
  const kind = sectionMeta[s.id].kind;
  if (kind === "hero") {
    const n = 1 + (d.heroSlides?.length ?? 0);
    return `${n} banner${n === 1 ? "" : "s"}`;
  }
  if (kind === "products") {
    return s.source === "manual"
      ? `${s.productIds.length} hand-picked`
      : `Automatic, ${s.limit} products`;
  }
  if (kind === "categories") {
    return d.categoriesSource === "manual"
      ? `${d.categoryIds.length} hand-picked`
      : `Top selling, ${d.categoryLimit} shown`;
  }
  if (kind === "spotlight") {
    return d.spotlightCategoryId === "auto"
      ? "Your top selling category"
      : "Hand-picked category";
  }
  if (kind === "promo") {
    return `${d.promoBanners.length} banner${d.promoBanners.length === 1 ? "" : "s"}`;
  }
  if (kind === "gallery") {
    const n = d.galleryItems.length;
    return `${n} photo${n === 1 ? "" : "s"}`;
  }
  if (kind === "all") return `Up to ${s.limit} products`;
  return sectionMeta[s.id].description;
}
