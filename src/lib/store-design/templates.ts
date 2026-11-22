import { templateGallery } from "./template-gallery";
/**
 * Storefront templates.
 *
 * A template is a bundle of *look and layout* settings (colors, font, shape,
 * card variant, card colors, header, hero, section order). It never touches
 * the seller's own content (name, logo, copy, products, contact details), so
 * switching templates is always safe. Gallery layout belongs to the template;
 * gallery content and other design settings stay editable.
 */
import {
  defaultCardCustom,
  defaultCategoryOptions,
  defaultDesign,
  type CardCustom,
  type CategoryOptions,
  type CategoryStyle,
  type HomeSectionId,
  type StoreDesign,
  type TemplateId,
} from "./types";

export interface StoreTemplate {
  id: TemplateId;
  name: string;
  blurb: string;
  /** Swatches for the picker: [background, primary, accent, text]. */
  swatch: [string, string, string, string];
  patch: Partial<StoreDesign>;
  /** Card colors written into design.cardCustom when the template is applied. */
  cardColors: Pick<CardCustom, "sale" | "dark" | "highlight" | "accent2">;
  /** Visible sections, in display order. Everything else is switched off. */
  order: HomeSectionId[];
}

/**
 * Category section look per template: the style plus its starting options.
 * Everything here stays editable in the Category section after applying.
 * Templates not listed keep the style from their `patch` and default options.
 */
export const TEMPLATE_CATEGORY_LOOK: Partial<
  Record<TemplateId, { style: CategoryStyle; options?: Partial<CategoryOptions> }>
> = {
  // Quiet text rows with counts
  minimal: { style: "list", options: { showCount: true, showImage: true } },
  // One large category with the rest around it
  premium: { style: "mosaic", options: { gap: "tight", radius: "lg", overlay: "soft" } },
  // Photo tiles, name underneath, soft corners
  fashion: {
    style: "tiles",
    options: { columns: 3, aspect: "portrait", radius: "sm", label: "below", overlay: "none" },
  },
  // Big wide banners with bold uppercase names
  sport: {
    style: "banner",
    options: { columns: 2, aspect: "landscape", gap: "tight", radius: "none", textCase: "upper", overlay: "strong", showCount: true },
  },
  // Edge-to-edge streetwear tiles
  urban: {
    style: "tiles",
    options: { columns: 3, aspect: "portrait", gap: "tight", radius: "none", label: "inside", textCase: "upper", overlay: "soft" },
  },
  // Tall scrolling cards
  boutique: {
    style: "strip",
    options: { columns: 3, aspect: "portrait", radius: "lg", overlay: "soft" },
  },
  // Two wide tiles per row with a count
  living: {
    style: "tiles",
    options: { columns: 2, aspect: "landscape", radius: "md", label: "below", overlay: "none", showCount: true },
  },
  // Small square tiles, centered name on a dark fade
  "night-sale": {
    style: "tiles",
    options: { columns: 4, aspect: "square", radius: "lg", label: "center", textCase: "upper", overlay: "strong", showArrow: false },
  },
  // Airy, square-cornered scrolling cards
  lookbook: {
    style: "strip",
    options: { columns: 2, aspect: "portrait", gap: "loose", radius: "none", textCase: "upper", overlay: "soft" },
  },
  // Round photos with the name underneath
  skincare: {
    style: "tiles",
    options: { columns: 4, aspect: "square", radius: "full", label: "below", align: "center", overlay: "none", showArrow: false },
  },
  // Scrolling tall photos, name underneath, square corners, arrows
  casual: {
    style: "rail",
    options: { columns: 5, aspect: "portrait", gap: "tight", radius: "none", align: "left", showCount: false, showArrow: false },
  },
  edge: {
    style: "tiles",
    options: { columns: 3, aspect: "portrait", gap: "tight", radius: "sm", label: "inside", overlay: "soft" },
  },
  // "Shop by collection": a sideways-scrolling row of tall photos, name underneath
  streetwear: {
    style: "rail",
    options: { columns: 4, aspect: "portrait", gap: "tight", radius: "none", align: "left", showCount: false, showArrow: true },
  },
};

const ALL: HomeSectionId[] = [
  "hero", "countdown", "trust", "categories", "featured", "bestSellers", "spotlight",
  "promo", "gallery", "newArrivals", "allProducts", "story",
];

export const storeTemplates: StoreTemplate[] = [
  /* ------------------------------------------------------------------ */
  /* Original templates                                                  */
  /* ------------------------------------------------------------------ */
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Quiet, spacious and image-first.",
    // Palette: Bloom
    swatch: ["#EAE6DE", "#226192", "#EF8557", "#226192"],
    cardColors: { sale: "#EF8557", dark: "#1B4A73", highlight: "#EF8557", accent2: "#EF8557" },
    order: ["hero", "categories", "newArrivals", "allProducts", "gallery", "story"],
    patch: {
      galleryStyle: "strip",
      bannerTone: "light",
      themePreset: "custom",
      primaryColor: "#226192", secondaryColor: "#EF8557",
      bgColor: "#EAE6DE", textColor: "#226192",
      fontFamily: "Inter", buttonRadius: "none", cardStyle: "plain",
      cardVariant: "atelier", imageAspectRatio: "portrait", productsPerRow: 4,
      headerStyle: "centered", heroLayout: "minimal", categoryStyle: "chips",
      stickyHeader: false, showSoldCount: false, showQuickView: false,
    },
  },
  {
    id: "premium",
    name: "Premium",
    blurb: "Dark, high-contrast and refined.",
    // Palette: Inner Peace
    swatch: ["#5B4632", "#F4D9A0", "#C8792C", "#FFF6E3"],
    cardColors: { sale: "#C8792C", dark: "#3A2C1E", highlight: "#F4D9A0", accent2: "#C8792C" },
    order: ["hero", "featured", "spotlight", "newArrivals", "gallery", "story", "trust"],
    patch: {
      galleryStyle: "coverflow",
      bannerTone: "dark",
      themePreset: "custom",
      primaryColor: "#F4D9A0", secondaryColor: "#C8792C",
      bgColor: "#5B4632", textColor: "#FFF6E3",
      fontFamily: "Playfair Display", buttonRadius: "sm", cardStyle: "bordered",
      cardVariant: "luxe", imageAspectRatio: "portrait", productsPerRow: 3,
      headerStyle: "overlap", heroLayout: "image", categoryStyle: "cards",
      stickyHeader: true, showSoldCount: false,
    },
  },
  {
    id: "promo",
    name: "Promo",
    blurb: "Loud, colorful and built for sales.",
    // Palette: Verdanova
    swatch: ["#7E69E8", "#FF5A5F", "#000000", "#000000"],
    cardColors: { sale: "#000000", dark: "#1A1433", highlight: "#000000", accent2: "#000000" },
    order: ["hero", "promo", "trust", "bestSellers", "featured", "categories", "newArrivals", "gallery", "allProducts"],
    patch: {
      galleryStyle: "polaroid",
      bannerTone: "brand",
      themePreset: "custom",
      primaryColor: "#FF5A5F", secondaryColor: "#000000",
      bgColor: "#7E69E8", textColor: "#000000",
      fontFamily: "Poppins", buttonRadius: "full", cardStyle: "soft",
      cardVariant: "brand", imageAspectRatio: "square", productsPerRow: 4,
      headerStyle: "standard", heroLayout: "card", categoryStyle: "circles",
      stickyHeader: true, showSaleBadge: true, showComparePrice: true,
      showSoldCount: true, announcementEnabled: true,
    },
  },
  {
    id: "fashion",
    name: "Fashion",
    blurb: "Tall editorial photos and soft tones.",
    // Palette: Cream
    swatch: ["#C9A0A7", "#C75A3A", "#3A0F34", "#3A0F34"],
    cardColors: { sale: "#C75A3A", dark: "#3A0F34", highlight: "#3A0F34", accent2: "#3A0F34" },
    order: ["hero", "categories", "newArrivals", "spotlight", "featured", "gallery", "story", "allProducts"],
    patch: {
      galleryStyle: "masonry",
      bannerTone: "light",
      themePreset: "custom",
      primaryColor: "#C75A3A", secondaryColor: "#3A0F34",
      bgColor: "#C9A0A7", textColor: "#3A0F34",
      fontFamily: "Playfair Display", buttonRadius: "md", cardStyle: "plain",
      cardVariant: "arch", imageAspectRatio: "portrait", productsPerRow: 3,
      headerStyle: "overlap", heroLayout: "showcase", categoryStyle: "circles",
      stickyHeader: true, showSoldCount: false,
    },
  },
  {
    id: "marketplace",
    name: "Marketplace",
    blurb: "Dense, practical and easy to browse.",
    // Palette: Tilli
    swatch: ["#EDECE6", "#1546D9", "#F9B318", "#1546D9"],
    cardColors: { sale: "#F9B318", dark: "#0F1F5C", highlight: "#F9B318", accent2: "#F9B318" },
    order: ALL.filter((s) => s !== "promo" && s !== "countdown"),
    patch: {
      galleryStyle: "grid",
      bannerTone: "brand",
      themePreset: "custom",
      primaryColor: "#1546D9", secondaryColor: "#F9B318",
      bgColor: "#EDECE6", textColor: "#1546D9",
      fontFamily: "Inter", buttonRadius: "lg", cardStyle: "soft",
      cardVariant: "light", imageAspectRatio: "square", productsPerRow: 4,
      headerStyle: "compact", heroLayout: "split", categoryStyle: "circles",
      stickyHeader: true, showFilters: true, showSortMenu: true,
    },
  },
  {
    id: "sport",
    name: "Sport",
    blurb: "Black and white, pill buttons, rounded tiles.",
    // Palette: Creative Studio
    swatch: ["#FFF21A", "#171717", "#A66BFF", "#171717"],
    cardColors: { sale: "#A66BFF", dark: "#171717", highlight: "#A66BFF", accent2: "#A66BFF" },
    order: ["hero", "featured", "categories", "newArrivals", "gallery", "allProducts", "trust"],
    patch: {
      galleryStyle: "duo",
      productLayout: "app", productButtonStyle: "rounded",
      bannerTone: "light",
      themePreset: "custom",
      primaryColor: "#171717", secondaryColor: "#A66BFF",
      bgColor: "#FFF21A", textColor: "#171717",
      fontFamily: "Inter", buttonRadius: "full", cardStyle: "plain",
      cardVariant: "noir", imageAspectRatio: "portrait", productsPerRow: 4,
      headerStyle: "compact", heroLayout: "image", categoryStyle: "chips",
      stickyHeader: true, showSoldCount: false, showWishlist: true,
    },
  },

  /* ------------------------------------------------------------------ */
  /* New templates                                                       */
  /* ------------------------------------------------------------------ */
  {
    id: "urban",
    name: "Urban",
    blurb: "Black with orange pops. Streetwear and sneakers.",
    // Palette: Lumen
    swatch: ["#101010", "#D5360C", "#E6D5BD", "#E6D5BD"],
    cardColors: { sale: "#D5360C", dark: "#1A1A1A", highlight: "#E6D5BD", accent2: "#D5360C" },
    order: ["hero", "countdown", "newArrivals", "bestSellers", "categories", "promo", "gallery", "allProducts"],
    patch: {
      galleryStyle: "feature",
      bannerTone: "dark",
      themePreset: "custom",
      primaryColor: "#D5360C", secondaryColor: "#E6D5BD",
      bgColor: "#101010", textColor: "#E6D5BD",
      fontFamily: "Poppins", buttonRadius: "none", cardStyle: "bordered",
      cardVariant: "fade", imageAspectRatio: "portrait", productsPerRow: 4,
      headerStyle: "standard", heroLayout: "stacked", categoryStyle: "chips",
      productLayout: "split", productButtonStyle: "solid",
      stickyHeader: true, showSoldCount: true, showSaleBadge: true,
    },
  },
  {
    id: "boutique",
    name: "Boutique",
    blurb: "Soft porcelain and heather purple. Handmade and gifts.",
    // Palette: Floraverse
    swatch: ["#F3E6D7", "#9B7ED6", "#E4FF3B", "#2E1A47"],
    cardColors: { sale: "#E4FF3B", dark: "#2E1A47", highlight: "#E4FF3B", accent2: "#E4FF3B" },
    order: ["hero", "categories", "featured", "gallery", "story", "newArrivals", "allProducts", "trust"],
    patch: {
      galleryStyle: "polaroid",
      bannerTone: "light",
      themePreset: "custom",
      primaryColor: "#9B7ED6", secondaryColor: "#E4FF3B",
      bgColor: "#F3E6D7", textColor: "#2E1A47",
      fontFamily: "Playfair Display", buttonRadius: "md", cardStyle: "soft",
      cardVariant: "popout", imageAspectRatio: "portrait", productsPerRow: 3,
      headerStyle: "centered", heroLayout: "centered", categoryStyle: "circles",
      productLayout: "editorial", productButtonStyle: "outline",
      stickyHeader: false, showSoldCount: false,
    },
  },
  {
    id: "grocery",
    name: "Grocery",
    blurb: "Pookie pink with hearts, gingham and rounded panels. Food and daily needs.",
    // Palette: Pookie (primary, secondary, accent, background)
    swatch: ["#FFF6F9", "#8C2048", "#F06292", "#8C2048"],
    cardColors: { sale: "#8C2048", dark: "#5A1030", highlight: "#FFD6E4", accent2: "#F06292" },
    order: ["hero", "trust", "categories", "bestSellers", "promo", "newArrivals", "gallery", "allProducts"],
    patch: {
      galleryStyle: "grid",
      bannerTone: "brand",
      themePreset: "custom",
      primaryColor: "#8C2048", secondaryColor: "#F06292",
      bgColor: "#FFF6F9", textColor: "#8C2048",
      fontFamily: "Poppins", buttonRadius: "lg", cardStyle: "soft",
      cardVariant: "pookie", imageAspectRatio: "square", productsPerRow: 5,
      headerStyle: "standard", heroLayout: "split", categoryStyle: "circles",
      productLayout: "app", productButtonStyle: "solid",
      stickyHeader: true, showFilters: true, showSortMenu: true,
      showSoldCount: true, showAddToCart: true,
    },
  },
  {
    id: "tech",
    name: "Tech",
    blurb: "Jet black with blue and neon pink. Gadgets and electronics.",
    // Palette: Human Next
    swatch: ["#0A0A0A", "#007BA7", "#FF2D95", "#F5F5F5"],
    cardColors: { sale: "#FF2D95", dark: "#0F1A24", highlight: "#FF2D95", accent2: "#007BA7" },
    order: ["hero", "featured", "categories", "spotlight", "bestSellers", "gallery", "allProducts", "trust"],
    patch: {
      galleryStyle: "bento",
      bannerTone: "dark",
      themePreset: "custom",
      primaryColor: "#007BA7", secondaryColor: "#FF2D95",
      bgColor: "#0A0A0A", textColor: "#F5F5F5",
      fontFamily: "Inter", buttonRadius: "sm", cardStyle: "bordered",
      cardVariant: "glass", imageAspectRatio: "square", productsPerRow: 4,
      headerStyle: "compact", heroLayout: "card", categoryStyle: "chips",
      productLayout: "gallery-left", productButtonStyle: "solid",
      stickyHeader: true, showFilters: true, showSortMenu: true,
      showRatings: true, showSoldCount: false,
    },
  },
  {
    id: "beauty",
    name: "Beauty",
    blurb: "Pale lavender with mocha and pill buttons. Skincare and cosmetics.",
    // Palette: Choreo Class
    swatch: ["#E6E0F0", "#6F4E37", "#E5E4E2", "#6F4E37"],
    cardColors: { sale: "#6F4E37", dark: "#3E2B1E", highlight: "#E6E0F0", accent2: "#E5E4E2" },
    order: ["hero", "categories", "bestSellers", "spotlight", "newArrivals", "gallery", "story", "allProducts"],
    patch: {
      galleryStyle: "staggered",
      bannerTone: "light",
      themePreset: "custom",
      primaryColor: "#6F4E37", secondaryColor: "#E5E4E2",
      bgColor: "#E6E0F0", textColor: "#6F4E37",
      fontFamily: "Poppins", buttonRadius: "full", cardStyle: "soft",
      cardVariant: "pastel", imageAspectRatio: "portrait", productsPerRow: 3,
      headerStyle: "overlap", heroLayout: "card", categoryStyle: "circles",
      productLayout: "app", productButtonStyle: "rounded",
      stickyHeader: true, showRatings: true, showSoldCount: false,
    },
  },
  {
    id: "living",
    name: "Home & Living",
    blurb: "Ice silver and aubergine with wide photos. Furniture and decor.",
    // Palette: Slow is a new power
    swatch: ["#DDE3E8", "#3A0F34", "#EAAA00", "#3A0F34"],
    cardColors: { sale: "#EAAA00", dark: "#3A0F34", highlight: "#EAAA00", accent2: "#EAAA00" },
    order: ["hero", "categories", "spotlight", "featured", "gallery", "story", "newArrivals", "allProducts"],
    patch: {
      galleryStyle: "masonry",
      bannerTone: "light",
      themePreset: "custom",
      primaryColor: "#3A0F34", secondaryColor: "#EAAA00",
      bgColor: "#DDE3E8", textColor: "#3A0F34",
      fontFamily: "Playfair Display", buttonRadius: "md", cardStyle: "plain",
      cardVariant: "frost", imageAspectRatio: "landscape", productsPerRow: 3,
      headerStyle: "standard", heroLayout: "showcase", categoryStyle: "cards",
      productLayout: "gallery-left", productButtonStyle: "outline",
      stickyHeader: false, showSoldCount: false,
    },
  },
  {
    id: "kids",
    name: "Kids",
    blurb: "Electric teal on warm ivory with round shapes. Toys and kids wear.",
    // Palette: Lumora
    swatch: ["#E8E4D3", "#00AEBB", "#031211", "#031211"],
    cardColors: { sale: "#031211", dark: "#031211", highlight: "#00AEBB", accent2: "#031211" },
    order: ["hero", "categories", "promo", "newArrivals", "bestSellers", "gallery", "allProducts", "trust"],
    patch: {
      galleryStyle: "marquee",
      bannerTone: "brand",
      themePreset: "custom",
      primaryColor: "#00AEBB", secondaryColor: "#031211",
      bgColor: "#E8E4D3", textColor: "#031211",
      fontFamily: "Poppins", buttonRadius: "full", cardStyle: "soft",
      cardVariant: "chipped", imageAspectRatio: "square", productsPerRow: 3,
      headerStyle: "centered", heroLayout: "centered", categoryStyle: "cards",
      productLayout: "app", productButtonStyle: "rounded",
      stickyHeader: true, showSaleBadge: true, showSoldCount: true,
    },
  },
  {
    // Colors unchanged: green and red are the national colors.
    id: "bangla-bazaar",
    name: "Bangla Bazaar",
    blurb: "Green and red, Bangla-friendly font. Everyday local shop.",
    swatch: ["#fffdf8", "#006a4e", "#f42a41", "#1c1917"],
    cardColors: { sale: "#F42A41", dark: "#0B3D2E", highlight: "#FACC15", accent2: "#F42A41" },
    order: ["hero", "countdown", "trust", "promo", "categories", "bestSellers", "featured", "newArrivals", "allProducts", "gallery", "story"],
    patch: {
      galleryStyle: "feature",
      bannerTone: "brand",
      themePreset: "custom",
      primaryColor: "#006a4e", secondaryColor: "#f42a41",
      bgColor: "#fffdf8", textColor: "#1c1917",
      fontFamily: "Hind Siliguri", buttonRadius: "lg", cardStyle: "soft",
      cardVariant: "classic", imageAspectRatio: "square", productsPerRow: 4,
      headerStyle: "standard", heroLayout: "stacked", categoryStyle: "circles",
      productLayout: "app", productButtonStyle: "solid",
      stickyHeader: true, showSaleBadge: true, showComparePrice: true,
      showSoldCount: true, announcementEnabled: true,
    },
  },
  {
    id: "night-sale",
    name: "Night Sale",
    blurb: "Midnight charcoal with coral orange. Flash sales and big discounts.",
    // Palette: Create Beyond Limits
    swatch: ["#17191C", "#FF4B32", "#929DA7", "#F5F5F5"],
    cardColors: { sale: "#FF4B32", dark: "#0F1113", highlight: "#929DA7", accent2: "#FF4B32" },
    order: ["hero", "countdown", "promo", "bestSellers", "trust", "featured", "categories", "gallery", "allProducts"],
    patch: {
      galleryStyle: "marquee",
      bannerTone: "dark",
      themePreset: "custom",
      primaryColor: "#FF4B32", secondaryColor: "#929DA7",
      bgColor: "#17191C", textColor: "#F5F5F5",
      fontFamily: "Poppins", buttonRadius: "md", cardStyle: "bordered",
      cardVariant: "overlay", imageAspectRatio: "square", productsPerRow: 4,
      headerStyle: "overlap", heroLayout: "card", categoryStyle: "circles",
      productLayout: "app", productButtonStyle: "solid",
      stickyHeader: true, showSaleBadge: true, showComparePrice: true,
      showSoldCount: true, announcementEnabled: true,
    },
  },
  {
    id: "lookbook",
    name: "Lookbook",
    blurb: "Clean white, big headlines and a campaign-style layout.",
    // Palette: Winter Edit
    swatch: ["#FFFFFF", "#7A2E3F", "#F5F4EF", "#111111"],
    cardColors: { sale: "#7A2E3F", dark: "#111111", highlight: "#7A2E3F", accent2: "#111111" },
    order: ["hero", "featured", "gallery", "story", "allProducts"],
    patch: {
      galleryStyle: "staggered",
      bannerTone: "light",
      themePreset: "custom",
      primaryColor: "#7A2E3F", secondaryColor: "#111111",
      bgColor: "#FFFFFF", textColor: "#111111",
      fontFamily: "Inter", buttonRadius: "none", cardStyle: "bordered",
      cardVariant: "grid", imageAspectRatio: "portrait", productsPerRow: 4,
      headerStyle: "centered", heroLayout: "split", categoryStyle: "chips",
      productLayout: "editorial", productButtonStyle: "solid",
      stickyHeader: true, showSoldCount: false, showWishlist: true,
    },
  },
  {
    id: "skincare",
    name: "Skincare",
    blurb: "Warm cream and cocoa with a full-photo hero. Clinical skincare and wellness.",
    // Palette: Sseraskin (warm cream, cocoa brown, soft peach)
    swatch: ["#FAF7F2", "#3B2A22", "#F3E3D6", "#3B2A22"],
    cardColors: { sale: "#3B2A22", dark: "#3B2A22", highlight: "#F3E3D6", accent2: "#A5704A" },
    order: ["hero", "newArrivals", "categories", "featured", "spotlight", "bestSellers", "promo", "gallery", "trust", "story"],
    patch: {
      galleryStyle: "grid",
      bannerTone: "light",
      themePreset: "custom",
      primaryColor: "#3B2A22", secondaryColor: "#A5704A",
      bgColor: "#FAF7F2", textColor: "#3B2A22",
      fontFamily: "Playfair Display", buttonRadius: "sm", cardStyle: "soft",
      cardVariant: "skin", imageAspectRatio: "portrait", productsPerRow: 3,
      headerStyle: "overlap", heroLayout: "image", categoryStyle: "cards",
      productLayout: "editorial", productButtonStyle: "solid",
      stickyHeader: true, showRatings: true, showSoldCount: false,
    },
  },
  {
    id: "edge",
    name: "Edge",
    blurb: "Clean white, flat gray tiles and a bento promo gallery. Streetwear and apparel.",
    // Palette: steel blue on white with navy accents
    swatch: ["#FFFFFF", "#2F5F8F", "#14284B", "#111111"],
    cardColors: { sale: "#2F5F8F", dark: "#14284B", highlight: "#111111", accent2: "#14284B" },
    // The Image gallery section is on: with "Grid" it renders the Bento mosaic.
    order: ["hero", "newArrivals", "gallery", "bestSellers", "categories", "featured", "allProducts", "story", "trust"],
    patch: {
      galleryStyle: "bento",
      bannerTone: "brand",
      themePreset: "custom",
      primaryColor: "#2F5F8F", secondaryColor: "#14284B",
      bgColor: "#FFFFFF", textColor: "#111111",
      fontFamily: "Outfit", buttonRadius: "sm", cardStyle: "plain",
      cardVariant: "catalog", imageAspectRatio: "square", productsPerRow: 4,
      headerStyle: "centered", heroLayout: "image", categoryStyle: "cards",
      productLayout: "split", productButtonStyle: "solid",
      stickyHeader: true, showRatings: true, showWishlist: true,
      showSaleBadge: true, showSoldCount: false,
    },
  },
  {
    id: "casual",
    name: "Casual",
    blurb: "Clean white, big photos and easy basics. Everyday fashion and summer edits.",
    // Palette: white, ink black, warm orange pop
    swatch: ["#FFFFFF", "#111111", "#E8602C", "#111111"],
    cardColors: { sale: "#C8321E", dark: "#111111", highlight: "#E8602C", accent2: "#E8602C" },
    // Hero first (unchanged), category rail, product rows, big photo tiles.
    order: ["hero", "categories", "newArrivals", "gallery", "bestSellers", "promo", "featured", "story", "trust", "allProducts"],
    patch: {
      galleryStyle: "duo",
      bannerTone: "light",
      themePreset: "custom",
      primaryColor: "#111111", secondaryColor: "#E8602C",
      bgColor: "#FFFFFF", textColor: "#111111",
      fontFamily: "Inter", buttonRadius: "none", cardStyle: "plain",
      cardVariant: "catalog", imageAspectRatio: "portrait", productsPerRow: 4,
      // "standard" is the Classic header.
      headerStyle: "standard", heroLayout: "image", categoryStyle: "rail",
      productLayout: "split", productButtonStyle: "solid",
      stickyHeader: true, showWishlist: true, showSaleBadge: true,
      showSoldCount: false, showRatings: false,
    },
  },
  {
    id: "streetwear",
    name: "Streetwear",
    blurb: "Soft gray, black type and a serif touch. Full-width hero, collection rail and big photo tiles. Drops, tees and hoodies.",
    // Palette: light gray, ink black, white buttons, red sale price
    swatch: ["#F7F7F7", "#000000", "#C8321E", "#000000"],
    cardColors: { sale: "#C8321E", dark: "#000000", highlight: "#000000", accent2: "#C8321E" },
    // Hero first and unchanged (full-width photo, one button), then the collection
    // rail, new arrivals, big photo tiles, bestsellers and the rest.
    order: ["hero", "categories", "newArrivals", "gallery", "bestSellers", "promo", "featured", "story", "trust", "allProducts"],
    patch: {
      galleryStyle: "duo",
      bannerTone: "dark",
      themePreset: "custom",
      primaryColor: "#000000", secondaryColor: "#C8321E",
      bgColor: "#F7F7F7", textColor: "#000000",
      fontFamily: "Libre Baskerville", buttonRadius: "none", cardStyle: "plain",
      cardVariant: "drop", imageAspectRatio: "portrait", productsPerRow: 4,
      headerStyle: "minimal", heroLayout: "image", categoryStyle: "rail",
      productLayout: "split", productButtonStyle: "solid",
      stickyHeader: true, announcementEnabled: true, showWishlist: true,
      showSaleBadge: true, showComparePrice: true, showSoldCount: false, showRatings: false,
    },
  },
  {
    id: "yokai",
    name: "Yokai",
    blurb: "White, Poppins and square photos. Full-width slides, wide collection banners and product rails. Anime and graphic tees.",
    // Palette: white, ink black, midnight navy
    swatch: ["#FFFFFF", "#121212", "#242833", "#121212"],
    cardColors: { sale: "#C8321E", dark: "#121212", highlight: "#121212", accent2: "#242833" },
    // Slides, wide collection banners, popular picks, coverflow, then more rails.
    order: ["hero", "categories", "featured", "gallery", "promo", "newArrivals", "bestSellers", "allProducts"],
    patch: {
      galleryStyle: "coverflow",
      bannerTone: "dark",
      themePreset: "custom",
      primaryColor: "#121212", secondaryColor: "#242833",
      bgColor: "#FFFFFF", textColor: "#121212",
      fontFamily: "Poppins", buttonRadius: "none", cardStyle: "plain",
      cardVariant: "yokai", imageAspectRatio: "square", productsPerRow: 4,
      headerStyle: "standard", heroLayout: "image", categoryStyle: "rail",
      productLayout: "split", productButtonStyle: "solid",
      stickyHeader: true, announcementEnabled: true, showWishlist: true,
      showSaleBadge: true, showComparePrice: true, showSoldCount: false, showRatings: false,
    },
  },
];

export function getTemplate(id: string): StoreTemplate | undefined {
  return storeTemplates.find((t) => t.id === id);
}

/**
 * Returns a design with the template's look applied; seller content is kept.
 * Card color overrides are reset, then the template's card colors are set.
 * They stay editable afterwards.
 */
export function applyTemplate(design: StoreDesign, id: TemplateId): StoreDesign {
  const t = getTemplate(id);
  if (!t) return design;
  const byId = new Map(design.sections.map((s) => [s.id, s]));
  const fallback = new Map(defaultDesign.sections.map((s) => [s.id, s]));
  const pick = (sid: HomeSectionId) => byId.get(sid) ?? fallback.get(sid)!;
  const shown = t.order.map((sid) => ({ ...pick(sid), enabled: true }));
  const hidden = ALL.filter((sid) => !t.order.includes(sid)).map((sid) => ({
    ...pick(sid),
    enabled: false,
  }));
  const look = TEMPLATE_CATEGORY_LOOK[id];
  return {
    ...design,
    ...t.patch,
    galleryStyle: templateGallery(id).base,
    galleryLayout: templateGallery(id).id,
    ...(look ? { categoryStyle: look.style } : null),
    categoryOptions: { ...defaultCategoryOptions, ...look?.options },
    // Every template shows the Add to cart button on its product cards.
    showAddToCart: true,
    template: id,
    cardCustom: { ...defaultCardCustom, ...t.cardColors },
    sections: [...shown, ...hidden, pick("reviews")],
  };
}

/* ------------------------------------------------------------------ */
/* Color variants                                                      */
/*                                                                     */
/* Each template can ship extra colorways. Picking one changes colors  */
/* and card accents only; layout, sections and the seller's own edits  */
/* are left alone.                                                     */
/* ------------------------------------------------------------------ */

export interface TemplateVariant {
  id: string;
  name: string;
  /** [background, primary, accent, text] */
  swatch: [string, string, string, string];
  patch: Pick<
    StoreDesign,
    "primaryColor" | "secondaryColor" | "bgColor" | "textColor" | "bannerTone"
  >;
  cardColors: Pick<CardCustom, "sale" | "dark" | "highlight" | "accent2">;
}

const cw = (
  id: string,
  name: string,
  bg: string,
  primary: string,
  secondary: string,
  text: string,
  tone: "dark" | "brand" | "light",
  sale: string,
  dark: string,
  highlight: string,
): TemplateVariant => ({
  id,
  name,
  swatch: [bg, primary, secondary, text],
  patch: {
    primaryColor: primary,
    secondaryColor: secondary,
    bgColor: bg,
    textColor: text,
    bannerTone: tone,
  },
  cardColors: { sale, dark, highlight, accent2: secondary },
});

const VARIANTS: Record<string, TemplateVariant[]> = {
  fashion: [
    cw("ivory", "Ivory", "#F5EFE6", "#8B5E3C", "#2B2118", "#2B2118", "light", "#B4532A", "#2B2118", "#8B5E3C"),
    cw("noir", "Noir", "#111111", "#E8D5B0", "#B08D57", "#F5F1EA", "dark", "#B08D57", "#1C1C1C", "#E8D5B0"),
  ],
  beauty: [
    cw("blush", "Blush", "#FCEFF0", "#D4577A", "#7A2E4A", "#4A1D2E", "light", "#D4577A", "#7A2E4A", "#D4577A"),
    cw("sage", "Sage", "#EEF3EC", "#5E8C61", "#2F4F33", "#22362A", "light", "#C2603E", "#2F4F33", "#5E8C61"),
    cw("lilac", "Lilac", "#F3EEFA", "#8B6BD0", "#4B2E83", "#2D1B4E", "light", "#D4577A", "#4B2E83", "#8B6BD0"),
  ],
  boutique: [
    cw("cream", "Cream", "#F6F1E9", "#3B2F2F", "#A8845A", "#2A2220", "light", "#A8452A", "#3B2F2F", "#A8845A"),
    cw("midnight", "Midnight", "#14213D", "#F2C879", "#8D99AE", "#F1F3F9", "dark", "#F2C879", "#0B1426", "#F2C879"),
  ],
  living: [
    cw("linen", "Linen", "#F3EEE6", "#6B705C", "#A5A58D", "#2B2D24", "light", "#B5543A", "#3A3D2E", "#A5A58D"),
    cw("terracotta", "Terracotta", "#FAF1EA", "#B5543A", "#6F2E1B", "#3A1E15", "light", "#B5543A", "#6F2E1B", "#D98B5F"),
    cw("slate", "Slate", "#EEF1F3", "#3D5A6C", "#1F3340", "#1B2A33", "light", "#C2603E", "#1F3340", "#3D5A6C"),
  ],
  tech: [
    cw("graphite", "Graphite", "#0F1115", "#3DD6C6", "#7C8CFF", "#E8EBF0", "dark", "#FF5C7A", "#171A21", "#3DD6C6"),
    cw("arctic", "Arctic", "#F4F7FB", "#1F6FEB", "#0B3D91", "#0F1B2D", "light", "#E5484D", "#0B3D91", "#1F6FEB"),
    cw("volt", "Volt", "#0B0B0B", "#C6F432", "#FFFFFF", "#F2F2F2", "dark", "#C6F432", "#161616", "#C6F432"),
  ],
  sport: [
    cw("court", "Court", "#F4F6F8", "#E8421B", "#111827", "#111827", "light", "#E8421B", "#111827", "#E8421B"),
    cw("night-run", "Night Run", "#0F172A", "#38BDF8", "#F97316", "#F1F5F9", "dark", "#F97316", "#1E293B", "#38BDF8"),
  ],
  urban: [
    cw("concrete", "Concrete", "#E7E5E4", "#111111", "#FF4D2E", "#111111", "light", "#FF4D2E", "#111111", "#FF4D2E"),
    cw("neon", "Neon", "#0D0D0F", "#FF3D8B", "#00E5FF", "#F5F5F7", "dark", "#FF3D8B", "#18181C", "#00E5FF"),
  ],
  grocery: [
    cw("strawberry", "Strawberry", "#FDA2AC", "#CB0E31", "#BAD62C", "#CB0E31", "brand", "#CB0E31", "#5A0A1A", "#BAD62C"),
    cw("fresh", "Fresh", "#F6FBF2", "#2E8B3D", "#F59E0B", "#14301A", "brand", "#F59E0B", "#14301A", "#2E8B3D"),
    cw("market", "Market", "#FFF9EE", "#E4572E", "#2E7D32", "#3A2A12", "brand", "#E4572E", "#3A2A12", "#2E7D32"),
  ],
  kids: [
    cw("candy", "Candy", "#FFF4F8", "#FF5C8A", "#7C4DFF", "#3B1F4A", "brand", "#FF5C8A", "#3B1F4A", "#7C4DFF"),
    cw("sunny", "Sunny", "#FFFBE8", "#FFB400", "#00A6A6", "#3A2E00", "brand", "#E65100", "#3A2E00", "#00A6A6"),
    cw("ocean", "Ocean", "#EAF7FF", "#1E88E5", "#FF7043", "#0D2B45", "brand", "#FF7043", "#0D2B45", "#1E88E5"),
  ],
  "bangla-bazaar": [
    cw("boishakh", "Boishakh", "#FFF7E6", "#D7263D", "#F4A300", "#3D1010", "brand", "#D7263D", "#3D1010", "#F4A300"),
    cw("eid", "Eid", "#F3FAF5", "#0F7B5F", "#D4AF37", "#0C2B22", "brand", "#D4AF37", "#0C2B22", "#D4AF37"),
    cw("puja", "Puja", "#FFF1F1", "#C2185B", "#FF9800", "#4A0F26", "brand", "#C2185B", "#4A0F26", "#FF9800"),
  ],
  lookbook: [
    cw("ink", "Ink", "#FFFFFF", "#111111", "#6B6B6B", "#111111", "light", "#C2603E", "#111111", "#111111"),
    cw("sand", "Sand", "#F5F1EA", "#8A5A44", "#2B2118", "#2B2118", "light", "#8A5A44", "#2B2118", "#8A5A44"),
    cw("forest", "Forest", "#F4F6F2", "#2F4F3A", "#A8845A", "#16241B", "light", "#B4532A", "#16241B", "#2F4F3A"),
    cw("navy", "Navy", "#FFFFFF", "#1F2A44", "#C9A24B", "#101828", "light", "#C9A24B", "#101828", "#1F2A44"),
  ],
  skincare: [
    cw("sand", "Sand", "#F6F0E8", "#6B4A35", "#B88A5E", "#2E2019", "light", "#B88A5E", "#2E2019", "#6B4A35"),
    cw("clay", "Clay", "#F8EEE8", "#8A4B3A", "#D9A38C", "#3A211A", "light", "#8A4B3A", "#3A211A", "#D9A38C"),
    cw("sage", "Sage", "#F2F4EC", "#4A5A44", "#A8B59B", "#232B20", "light", "#7C8F6E", "#232B20", "#4A5A44"),
  ],
  edge: [
    cw("noir", "Noir", "#0E0E10", "#8DB4DB", "#FFFFFF", "#F2F2F2", "dark", "#8DB4DB", "#1A1A1E", "#F2F2F2"),
    cw("sand", "Sand", "#FBF8F3", "#8A5A44", "#2B2118", "#1E1712", "light", "#8A5A44", "#2B2118", "#1E1712"),
    cw("forest", "Forest", "#FFFFFF", "#2F4F3A", "#16241B", "#111111", "light", "#2F4F3A", "#16241B", "#111111"),
  ],
  yokai: [
    cw("noir", "Noir", "#0E0E10", "#FFFFFF", "#242833", "#F2F2F2", "dark", "#FF4D2E", "#161616", "#FFFFFF"),
    cw("stone", "Stone", "#F3F3F3", "#121212", "#242833", "#121212", "light", "#C8321E", "#121212", "#121212"),
  ],
  streetwear: [
    cw("noir", "Noir", "#0B0B0B", "#FFFFFF", "#FF4D2E", "#F5F5F5", "dark", "#FF4D2E", "#161616", "#FFFFFF"),
    cw("bone", "Bone", "#F2EEE7", "#1A1A1A", "#B4532A", "#1A1A1A", "light", "#B4532A", "#1A1A1A", "#1A1A1A"),
  ],
  casual: [
    cw("sand", "Sand", "#FBF8F3", "#2B2118", "#B4532A", "#2B2118", "light", "#B4532A", "#2B2118", "#B4532A"),
    cw("ocean", "Ocean", "#FFFFFF", "#14284B", "#2F8FBF", "#14284B", "light", "#C8321E", "#14284B", "#2F8FBF"),
    cw("noir", "Noir", "#0E0E10", "#F2F2F2", "#E8602C", "#F2F2F2", "dark", "#E8602C", "#1A1A1E", "#E8602C"),
  ],
  "night-sale": [
    cw("midnight", "Midnight", "#0B1020", "#FF4D6D", "#FFC857", "#F4F6FF", "dark", "#FF4D6D", "#141B33", "#FFC857"),
    cw("black-friday", "Black Friday", "#000000", "#FFD60A", "#FF3B30", "#FFFFFF", "dark", "#FF3B30", "#141414", "#FFD60A"),
    cw("neon-sale", "Neon Sale", "#12002B", "#00F5D4", "#F15BB5", "#F8F0FF", "dark", "#F15BB5", "#1F0A45", "#00F5D4"),
  ],
};

/** The template's own colors first, then its extra colorways. */
export function getVariants(t: StoreTemplate): TemplateVariant[] {
  const extra = VARIANTS[t.id] ?? [];
  if (!extra.length) return [];
  const base: TemplateVariant = {
    id: "original",
    name: "Original",
    swatch: t.swatch,
    patch: {
      primaryColor: t.patch.primaryColor ?? defaultDesign.primaryColor,
      secondaryColor: t.patch.secondaryColor ?? defaultDesign.secondaryColor,
      bgColor: t.patch.bgColor ?? defaultDesign.bgColor,
      textColor: t.patch.textColor ?? defaultDesign.textColor,
      bannerTone: t.patch.bannerTone ?? defaultDesign.bannerTone,
    },
    cardColors: t.cardColors,
  };
  return [base, ...extra];
}

/** Switch only the colors of the current template. Layout stays as is. */
export function applyColorway(
  design: StoreDesign,
  id: TemplateId,
  variantId: string,
): StoreDesign {
  const t = getTemplate(id);
  if (!t) return design;
  const v = getVariants(t).find((x) => x.id === variantId);
  if (!v) return design;
  return {
    ...design,
    ...v.patch,
    themePreset: "custom",
    cardCustom: { ...design.cardCustom, ...v.cardColors },
  };
}