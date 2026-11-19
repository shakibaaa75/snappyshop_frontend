import {
  normalizeSellingCategory,
  type SellingCategory,
} from "./selling-categories";
import { templateGallery } from "./template-gallery";
export type ButtonRadius = "none" | "sm" | "md" | "lg" | "full";
export type CardStyle = "plain" | "soft" | "bordered";
export type AspectRatio = "square" | "portrait" | "landscape";
export type HeaderStyle =
  | "standard"
  | "centered"
  | "compact"
  | "overlap"
  /** Name and avatar sit on a tall cover, over a dark fade. */
  | "banner"
  /** Profile card beside the cover. */
  | "split"
  /** No cover: avatar, name and Follow in one clean row. */
  | "minimal"
  | "editorial"
  | "framed"
  | "spotlight";
export const HEADER_STYLES = [
  "standard",
  "banner",
  "minimal",
  "editorial",
  "framed",
  "spotlight",
] as const;

/** Read older saved designs and template presets without exposing retired choices. */
export function resolveHeaderStyle(
  value: unknown,
): (typeof HEADER_STYLES)[number] {
  const legacy: Record<string, (typeof HEADER_STYLES)[number]> = {
    centered: "framed",
    overlap: "framed",
    compact: "minimal",
    split: "editorial",
  };
  if (typeof value !== "string") return "standard";
  if (Object.prototype.hasOwnProperty.call(legacy, value)) return legacy[value];
  return HEADER_STYLES.find((style) => style === value) ?? "standard";
}
export type HeroLayout =
  "split" | "centered" | "image" | "stacked" | "card" | "minimal" | "showcase";

export const HERO_LAYOUTS = [
  "split",
  "centered",
  "image",
  "stacked",
  "card",
  "minimal",
  "showcase",
] as const;
export type CategoryStyle =
  | "circles"
  | "cards"
  | "chips"
  /** Photo tiles in a grid, label on the photo or below it. */
  | "tiles"
  /** Bento: first category large, the rest around it. */
  | "mosaic"
  /** Wide banner cards, one or two per row. */
  | "banner"
  /** Horizontally scrolling tall cards. */
  | "strip"
  /** Text rows with a count and arrow, thumbnails optional. */
  | "list"
  /** Scrolling tall photos with the name underneath and prev/next arrows. */
  | "rail";
export const CATEGORY_STYLES = [
  "circles",
  "cards",
  "chips",
  "tiles",
  "mosaic",
  "banner",
  "strip",
  "list",
  "rail",
] as const;

/**
 * Seller-editable look of the Category section. Every template ships its own
 * defaults; each field can then be changed. Which fields matter depends on the
 * style (see CATEGORY_OPTION_FIELDS); the rest are ignored.
 */
export interface CategoryOptions {
  /** Tiles per row on desktop (2-5). Phones always show 2, or 1 for banners. */
  columns: number;
  aspect: "square" | "portrait" | "landscape" | "wide";
  gap: "tight" | "normal" | "loose";
  /** "auto" follows the store's button roundness. */
  radius: "auto" | ButtonRadius;
  /** Where the name sits on tiles and banners. */
  label: "inside" | "center" | "below";
  textCase: "normal" | "upper";
  align: "left" | "center";
  /** Dark fade behind text that sits on a photo. */
  overlay: "none" | "soft" | "strong";
  showCount: boolean;
  showArrow: boolean;
  /** List style: show a small photo at the start of each row. */
  showImage: boolean;
  /** Small line above the section title, e.g. "DISCOVER". */
  eyebrow: string;
}

export const defaultCategoryOptions: CategoryOptions = {
  columns: 3,
  aspect: "portrait",
  gap: "normal",
  radius: "auto",
  label: "inside",
  textCase: "normal",
  align: "left",
  overlay: "soft",
  showCount: false,
  showArrow: true,
  showImage: true,
  eyebrow: "",
};

/** Which option fields each style uses, so the editor shows only those. */
export const CATEGORY_OPTION_FIELDS: Record<
  CategoryStyle,
  readonly (keyof CategoryOptions)[]
> = {
  circles: ["textCase"],
  cards: ["textCase"],
  chips: ["textCase"],
  tiles: [
    "columns",
    "aspect",
    "gap",
    "radius",
    "label",
    "textCase",
    "overlay",
    "showCount",
    "showArrow",
  ],
  mosaic: ["gap", "radius", "textCase", "overlay", "showCount", "showArrow"],
  banner: [
    "columns",
    "aspect",
    "gap",
    "radius",
    "label",
    "textCase",
    "overlay",
    "showCount",
    "showArrow",
  ],
  strip: [
    "columns",
    "aspect",
    "gap",
    "radius",
    "textCase",
    "overlay",
    "showCount",
  ],
  list: ["textCase", "align", "showCount", "showArrow", "showImage"],
  rail: [
    "columns",
    "aspect",
    "gap",
    "radius",
    "textCase",
    "align",
    "showCount",
    "showArrow",
  ],
};
export type SortOption = "newest" | "popular" | "price-asc" | "price-desc";
export type PaymentMethod = "cod" | "bkash" | "nagad" | "rocket" | "card";
export type ListSource = "auto" | "manual";
export type ProductLayout =
  | "app"
  | "editorial"
  | "split"
  | "gallery-left"
  | "gallery-right"
  | "wide"
  | "portrait"
  | "stacked";
export type ProductButtonStyle = "solid" | "outline" | "rounded";
export type VariantImageMode = "shared" | "per-variant";
export type TemplateId =
  | "minimal"
  | "premium"
  | "promo"
  | "fashion"
  | "marketplace"
  | "sport"
  | "urban"
  | "boutique"
  | "grocery"
  | "tech"
  | "beauty"
  | "living"
  | "kids"
  | "bangla-bazaar"
  | "night-sale"
  | "lookbook"
  | "skincare"
  | "edge"
  | "casual"
  | "streetwear"
  | "yokai";
export type BannerTone = "dark" | "brand" | "light";
export type CardVariant =
  | "classic"
  | "tile"
  | "minimal"
  | "editorial"
  | "glass"
  | "light"
  | "overlay"
  | "outline"
  | "compact"
  | "spotlight"
  | "showcase"
  | "orb"
  | "fade"
  | "noir"
  | "ticket"
  | "pastel"
  | "popout"
  | "chipped"
  | "brand"
  | "rail"
  | "atelier"
  | "arch"
  | "aura"
  | "luxe"
  | "frost"
  | "sheen"
  | "grid"
  | "skin"
  | "catalog"
  | "drop"
  | "yokai"
  | "pookie";

export type HomeSectionId =
  | "hero"
  | "trust"
  | "categories"
  | "featured"
  | "bestSellers"
  | "spotlight"
  | "promo"
  | "newArrivals"
  | "allProducts"
  | "story"
  | "countdown"
  | "gallery";

export type SectionKind =
  | "hero"
  | "info"
  | "categories"
  | "products"
  | "spotlight"
  | "promo"
  | "all"
  | "story"
  | "countdown"
  | "gallery";

/* ------------------------------------------------------------------ */
/* Card customization (seller overrides applied on top of any card)    */
/* ------------------------------------------------------------------ */

export type CardShadow = "default" | "none" | "soft" | "strong";

/** Photo shape on the card. "auto" keeps whatever the card design uses. */
export type CardImageRatio = "auto" | "square" | "portrait" | "landscape";
/** "cover" fills the photo area (crops), "contain" shows the whole photo. */
export type CardImageFit = "auto" | "cover" | "contain";
/** Which action button the card shows. */
export type CardButton = "cart" | "buy" | "both";

export interface CardCustom {
  bg: string; // "" = keep the card's own look
  text: string;
  title: string;
  accent: string; // price + buttons
  border: string;
  radius: number; // -1 = card default
  buttonRadius: number; // -1 = card default
  shadow: CardShadow;
  /** Sale badge + wishlist heart. "" = default red. Set by templates. */
  sale: string;
  /** Dark surface of Fade / Noir / Luxe and the Glass panel. "" = card default. */
  dark: string;
  /** Gold/accent color of the Luxe card. "" = default gold. */
  highlight: string;
  /** Second accent: the pill button on dark cards, extra rings and edges. "" = none (white button). */
  accent2: string;
  /** Photo shape. "auto" = card default. */
  imageRatio: CardImageRatio;
  /** Photo fit. "auto" = card default. */
  imageFit: CardImageFit;
  /** "cart" = Add to cart, "buy" = Buy now, "both" = both buttons. */
  button: CardButton;
}

export const defaultCardCustom: CardCustom = {
  bg: "",
  text: "",
  title: "",
  accent: "",
  border: "",
  radius: -1,
  buttonRadius: -1,
  shadow: "default",
  sale: "",
  dark: "",
  highlight: "",
  accent2: "",
  imageRatio: "auto",
  imageFit: "auto",
  button: "cart",
};

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export interface Category {
  id: string;
  name: string;
  emoji?: string;
  imageUrl?: string | null;
}

export interface ProductOptionValue {
  id: string;
  label: string;
  colorHex?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  values: ProductOptionValue[];
}

export interface ProductCombination {
  id: string;
  valueIds: Record<string, string>;
  stock: number;
  imageUrls: string[];
  price?: number;
  sku?: string;
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  comparePrice?: number;
  imageUrl?: string;
  /** The photo the seller marked as main, and every photo of the product. */
  mainImageUrl?: string;
  imageUrls?: string[];
  emoji: string;
  hue: number;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  createdAt: string;
  description?: string;
  badge?: string;
  options?: ProductOption[];
  combinations?: ProductCombination[];
  attributes?: ProductAttribute[];
  variantImageMode?: VariantImageMode;
}

/* ------------------------------------------------------------------ */
/* Design settings                                                     */
/* ------------------------------------------------------------------ */

export interface HomeSection {
  id: HomeSectionId;
  enabled: boolean;
  title: string;
  source: ListSource;
  productIds: string[];
  limit: number;
  /** Small muted line under the heading (Yokai product rails). */
  subtitle?: string;
}

export interface NavLink {
  id: string;
  label: string;
  url: string;
}

export type GalleryStyle =
  | "staggered"
  | "grid"
  | "strip"
  /** Banner mosaic: tall, wide and small tiles with headline and button. */
  | "bento"
  /** Large photo tiles, two per row, text bottom-left. */
  | "duo"
  /** Tall photos in a snapping row, the middle one full size. */
  | "coverflow"
  /** Photos of different heights in columns. */
  | "masonry"
  /** One big photo with a grid of small ones beside it. */
  | "feature"
  /** Tilted photo prints with a caption underneath. */
  | "polaroid"
  /** A row of photos that scrolls by itself. */
  | "marquee";

export const GALLERY_STYLES = [
  "staggered",
  "grid",
  "strip",
  "bento",
  "duo",
  "coverflow",
  "masonry",
  "feature",
  "polaroid",
  "marquee",
] as const satisfies readonly GalleryStyle[];

/** One photo in the Image gallery section. */
export interface GalleryItem {
  /** Photo focal point in percent; independent of gallery order. */
  imagePositionX?: number;
  imagePositionY?: number;
  imageFit?: "cover" | "contain";
  id: string;
  imageUrl: string;
  caption: string;
  /** Free text, e.g. "Tk 1,799". Shown next to the caption. */
  price: string;
  /** Where the photo links to. "" = not clickable. */
  url: string;
  /*
   * Extra text for the Bento gallery (see BENTO_TEMPLATES). All optional, so
   * galleries saved before these existed load unchanged. Other gallery
   * layouts ignore them.
   */
  /** Small uppercase line above the title, e.g. "NEW SEASON". */
  eyebrow?: string;
  /** Label of the tile's button, e.g. "Shop now". "" = no button. */
  buttonText?: string;
  /** Large text, e.g. "50%". Used on offer tiles. */
  badge?: string;
  /** Tile color, used when there is no photo. "" = the store's main color. */
  color?: string;
  /** Text color on the tile: "dark" suits light photos, "light" dark ones. */
  tone?: "dark" | "light";
}

export const MAX_GALLERY_ITEMS = 9;

/**
 * Templates whose "Grid" gallery layout is the Bento mosaic (one tall tile,
 * one wide tile and two small ones, each with its own headline and button),
 * and whose product sections get a centered heading with category tabs.
 * Every other template keeps the plain photo grid.
 */
export const BENTO_TEMPLATES: readonly TemplateId[] = ["edge"];

/** True when this design should render the Bento gallery. */
export const usesBentoGallery = (
  d: Pick<StoreDesign, "template" | "galleryStyle">,
): boolean => d.galleryStyle === "bento";

/**
 * Casual-style templates. Product sections become a left-aligned heading with
 * category tabs and arrows over a sideways-scrolling row of products, and the
 * "Grid" gallery becomes large photo tiles, two per row, text bottom-left.
 */
export const RAIL_PRODUCT_TEMPLATES: readonly TemplateId[] = ["casual"];
export const DUO_GALLERY_TEMPLATES: readonly TemplateId[] = [
  "casual",
  "streetwear",
];

/**
 * Drop-style templates (Streetwear). They get their own page structure: a
 * centered wordmark header with a text menu, a collection photo grid, product
 * sections with a centered heading over a flat grid, and a flat footer.
 */
export const DROP_TEMPLATES: readonly TemplateId[] = ["streetwear", "yokai"];

/**
 * Yokai: the Drop page structure plus a left-aligned logo header, wide
 * two-up collection banners, centered product rails with a subtitle, a
 * coverflow gallery and a feature row above the footer.
 */
export const usesYokaiLayout = (d: Pick<StoreDesign, "template">): boolean =>
  d.template === "yokai";

/** True when this design should use the Drop page structure. */
export const usesDropLayout = (d: Pick<StoreDesign, "template">): boolean =>
  DROP_TEMPLATES.includes(d.template);

/** True when this design should render the two-up photo tiles gallery. */
export const usesDuoGallery = (
  d: Pick<StoreDesign, "template" | "galleryStyle">,
): boolean => d.galleryStyle === "duo";

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  url: string;
  color: string;
}

/* ------------------------------------------------------------------ */
/* Hero banners                                                        */
/* ------------------------------------------------------------------ */

export type HeroAlign = "left" | "center" | "right";
export type HeroSize = "sm" | "md" | "lg" | "xl";
export type HeroValign = "top" | "middle" | "bottom";
export type HeroRadius = "none" | "md" | "lg" | "xl";
export type HeroFocus = "top" | "center" | "bottom";
export type HeroButtonStyle = "solid" | "outline" | "soft" | "brand";
export type HeroButtonShape = "pill" | "rounded" | "square";

/**
 * Per-banner design. Every field is optional: anything left unset falls back
 * to the store-wide `heroLayout` / `bannerTone`, so older stores look the same.
 */
export interface HeroStyle {
  layout?: HeroLayout;
  tone?: BannerTone;
  align?: HeroAlign;
  /** Where the text sits vertically. */
  valign?: HeroValign;
  titleSize?: HeroSize;
  height?: HeroSize;
  /** Banner corner roundness. */
  radius?: HeroRadius;
  /** 0 to 80: darkness of the overlay on a full-image banner. */
  overlay?: number;
  /** Which part of the photo stays visible when it is cropped. */
  imageFocus?: HeroFocus;
  /** "" = automatic */
  textColor?: string;
  /** "" = automatic */
  bgColor?: string;
  /** Second background color. With bgColor it makes a gradient. "" = none */
  bgColor2?: string;
  buttonStyle?: HeroButtonStyle;
  buttonShape?: HeroButtonShape;
  /** Small label above the headline, e.g. "NEW" or "-30%". */
  badge?: string;
  /** false hides the store name above the headline. */
  showStoreName?: boolean;
}

/** An extra banner that slides in after the main one. */
export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  url: string;
  imageUrl: string;
  color: string;
  style?: HeroStyle;
}

export const MAX_HERO_SLIDES = 5;

export interface StoreDesign {
  /* Identity */
  storeName: string;
  sellingCategory: SellingCategory | "";
  tagline: string;
  storeSlug: string;
  description: string;
  logoUrl: string;
  coverUrl: string;

  /* Template */
  template: TemplateId;

  /* Theme */
  themePreset: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  buttonRadius: ButtonRadius;
  cardStyle: CardStyle;
  cardVariant: CardVariant;
  cardCustom: CardCustom;

  /* Product cards */
  productsPerRow: number;
  imageAspectRatio: AspectRatio;
  showRatings: boolean;
  showStockStatus: boolean;
  showSaleBadge: boolean;
  showComparePrice: boolean;
  showSoldCount: boolean;
  showWishlist: boolean;
  showQuickView: boolean;
  showAddToCart: boolean;

  /* Hero */
  heroLayout: HeroLayout;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonUrl: string;
  heroImageUrl: string;
  bannerTone: BannerTone;
  bannerAutoplay: boolean;
  bannerProducts: boolean;
  bannerPromos: boolean;
  /** Extra design settings for the main banner (layout and style live in heroLayout / bannerTone). */
  heroStyle: HeroStyle;
  /** Extra banners the seller adds after the main one. */
  heroSlides: HeroSlide[];

  /* Categories */
  categoriesSource: ListSource;
  categoryIds: string[];
  categoryStyle: CategoryStyle;
  categoryOptions: CategoryOptions;
  categoryLimit: number;
  spotlightCategoryId: string;

  /* Homepage builder */
  sections: HomeSection[];
  promoBanners: PromoBanner[];
  storyText: string;
  /** Flash-sale countdown section. ISO local date-time, "" = not set. */
  countdownEndsAt: string;
  countdownSubtitle: string;
  countdownButtonText: string;
  /** "" = the store's products page. */
  countdownButtonUrl: string;
  /** Image gallery section (premium). */
  galleryItems: GalleryItem[];
  galleryStyle: GalleryStyle;
  /** Template-owned gallery option; absent on older saved stores. */
  galleryLayout?: string;
  galleryAutoScroll?: boolean;
  galleryScrollSpeed?: number;
  /** Short text shown beside the gallery title. */
  gallerySubtitle: string;

  /* Header & footer */
  headerStyle: HeaderStyle;
  stickyHeader: boolean;
  showSearch: boolean;
  showCartIcon: boolean;
  navLinks: NavLink[];
  announcementEnabled: boolean;
  announcementText: string;
  showFooter: boolean;
  footerText: string;

  /* Shop options */
  showFilters: boolean;
  showSortMenu: boolean;
  defaultSort: SortOption;
  pinnedProductIds: string[];
  paymentMethods: PaymentMethod[];
  freeDeliveryThreshold: number;
  deliveryNote: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
  vacationMode: boolean;
  vacationMessage: string;

  /* Trust */
  showVerifiedBadge: boolean;
  showReturnPolicy: boolean;
  returnPolicy: string;
  showPaymentBadges: boolean;

  /* About and contact page layouts */
  aboutLayout: "split" | "editorial" | "centered";
  aboutTitle: string;
  aboutText: string;
  aboutImageUrl: string;
  contactLayout: "split" | "stacked" | "details";
  contactTitle: string;
  contactIntro: string;
  contactShowForm: boolean;

  /* Contact */
  showContactInfo: boolean;
  supportEmail: string;
  supportPhone: string;
  address: string;
  businessHours: string;
  showSocialLinks: boolean;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;

  /* SEO */
  seoTitle: string;
  seoDescription: string;

  /* Product detail page */
  productLayout: ProductLayout;
  productBgColor: string;
  productAccentColor: string;
  productButtonStyle: ProductButtonStyle;
  showProductTabs: boolean;
  showProductTrustRow: boolean;
  showProductRelated: boolean;
  showProductColorPicker: boolean;
  showProductSizePicker: boolean;
  showProductQuantity: boolean;
  /** Label on the product page buy button. Empty = "Add to bag". */
  productButtonText: string;
  /** Heading above related products. Empty = "You may also like". */
  productRelatedTitle: string;
}

/* ------------------------------------------------------------------ */
/* Static options                                                      */
/* ------------------------------------------------------------------ */

export const themePresets = [
  /* Original themes */
  {
    id: "emerald",
    name: "Emerald",
    primary: "#064e3b",
    secondary: "#10b981",
    bg: "#ffffff",
    text: "#111827",
  },
  {
    id: "ocean",
    name: "Ocean",
    primary: "#1d4ed8",
    secondary: "#38bdf8",
    bg: "#ffffff",
    text: "#0f172a",
  },
  {
    id: "sunset",
    name: "Sunset",
    primary: "#c2410c",
    secondary: "#f59e0b",
    bg: "#fffbf5",
    text: "#292524",
  },
  {
    id: "rose",
    name: "Rose",
    primary: "#be185d",
    secondary: "#fb7185",
    bg: "#fff8fa",
    text: "#1f1720",
  },
  {
    id: "midnight",
    name: "Midnight",
    primary: "#818cf8",
    secondary: "#34d399",
    bg: "#0f172a",
    text: "#e2e8f0",
  },
  {
    id: "mono",
    name: "Mono",
    primary: "#171717",
    secondary: "#a3a3a3",
    bg: "#ffffff",
    text: "#171717",
  },

  /* Dark themes */
  {
    id: "noir-gold",
    name: "Noir Gold",
    primary: "#d4a64a",
    secondary: "#b45309",
    bg: "#111111",
    text: "#f8f5ee",
  },
  {
    id: "crimson-night",
    name: "Crimson Night",
    primary: "#ef4444",
    secondary: "#f97316",
    bg: "#140a0c",
    text: "#fdf2f3",
  },
  {
    id: "deep-forest",
    name: "Deep Forest",
    primary: "#22c55e",
    secondary: "#eab308",
    bg: "#0b1510",
    text: "#ecfdf3",
  },
  {
    id: "graphite",
    name: "Graphite",
    primary: "#e4e4e7",
    secondary: "#a1a1aa",
    bg: "#18181b",
    text: "#fafafa",
  },

  /* Light themes */
  {
    id: "forest",
    name: "Forest",
    primary: "#166534",
    secondary: "#ca8a04",
    bg: "#f6faf5",
    text: "#14261a",
  },
  {
    id: "lavender",
    name: "Lavender",
    primary: "#7c3aed",
    secondary: "#ec4899",
    bg: "#faf8ff",
    text: "#241a3d",
  },
  {
    id: "mocha",
    name: "Mocha",
    primary: "#7c4a2d",
    secondary: "#c2956b",
    bg: "#faf6f1",
    text: "#2e2118",
  },
  {
    id: "mint",
    name: "Mint",
    primary: "#0f766e",
    secondary: "#34d399",
    bg: "#f3fbf8",
    text: "#0d2b25",
  },
  {
    id: "slate",
    name: "Slate",
    primary: "#334155",
    secondary: "#0ea5e9",
    bg: "#f8fafc",
    text: "#0f172a",
  },
  {
    id: "sand",
    name: "Sand",
    primary: "#a16207",
    secondary: "#65a30d",
    bg: "#fbf8f1",
    text: "#292524",
  },
  {
    id: "indigo",
    name: "Indigo",
    primary: "#4338ca",
    secondary: "#a5b4fc",
    bg: "#f8f9ff",
    text: "#1e1b4b",
  },
] as const;

export interface FontOption {
  id: string;
  stack: string;
  google?: string;
  sample?: string;
}

export const fontOptions: FontOption[] = [
  {
    id: "Inter",
    stack: "Inter, ui-sans-serif, system-ui, sans-serif",
    google: "Inter:wght@400;500;600;700",
  },
  {
    id: "Poppins",
    stack: "Poppins, ui-sans-serif, system-ui, sans-serif",
    google: "Poppins:wght@400;500;600;700",
  },
  {
    id: "Hind Siliguri",
    stack: '"Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, sans-serif',
    google: "Hind+Siliguri:wght@400;500;600;700",
    sample: "আ Aa",
  },
  {
    id: "Nunito",
    stack: "Nunito, ui-sans-serif, system-ui, sans-serif",
    google: "Nunito:wght@400;600;700",
  },
  {
    id: "Lato",
    stack: "Lato, ui-sans-serif, system-ui, sans-serif",
    google: "Lato:wght@400;700",
  },
  {
    id: "Roboto",
    stack: "Roboto, ui-sans-serif, system-ui, sans-serif",
    google: "Roboto:wght@400;500;700",
  },
  {
    id: "Outfit",
    stack: "Outfit, ui-sans-serif, system-ui, sans-serif",
    google: "Outfit:wght@400;500;600;700",
  },
  {
    id: "Playfair Display",
    stack: '"Playfair Display", Georgia, serif',
    google: "Playfair+Display:wght@400;600;700",
  },
  {
    id: "Libre Baskerville",
    stack: '"Libre Baskerville", Georgia, serif',
    google: "Libre+Baskerville:wght@400;700",
  },
  { id: "System UI", stack: "ui-sans-serif, system-ui, sans-serif" },
];

export const paymentLabels: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  card: "Card",
};

export const paymentColors: Record<PaymentMethod, string> = {
  cod: "#16a34a",
  bkash: "#e2136e",
  nagad: "#f6921e",
  rocket: "#8c3494",
  card: "#2563eb",
};

export const sortLabels: Record<SortOption, string> = {
  newest: "Newest",
  popular: "Most popular",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export const sectionMeta: Record<
  HomeSectionId,
  { label: string; description: string; kind: SectionKind; autoHint?: string }
> = {
  hero: {
    label: "Hero banner",
    description: "The big opening banner",
    kind: "hero",
  },
  trust: {
    label: "Trust bar",
    description: "Delivery, returns and payments",
    kind: "info",
  },
  categories: {
    label: "Categories",
    description: "Shop by category",
    kind: "categories",
  },
  featured: {
    label: "Featured products",
    description: "Your top picks",
    kind: "products",
    autoHint: "Automatic shows your highest-rated products.",
  },
  bestSellers: {
    label: "Best sellers",
    description: "What shoppers buy most",
    kind: "products",
    autoHint:
      "Automatic ranks by units sold, counting verified completed orders only.",
  },
  spotlight: {
    label: "Category spotlight",
    description: "Highlight one category",
    kind: "spotlight",
  },
  promo: {
    label: "Promo banners",
    description: "Offers and campaigns",
    kind: "promo",
  },
  newArrivals: {
    label: "New arrivals",
    description: "Your latest products",
    kind: "products",
    autoHint: "Automatic shows your most recently added products.",
  },
  allProducts: {
    label: "All products",
    description: "Your full catalogue",
    kind: "all",
  },
  story: {
    label: "About the store",
    description: "Tell your story",
    kind: "story",
  },
  countdown: {
    label: "Flash sale countdown",
    description: "A live timer that counts down to the end of an offer",
    kind: "countdown",
  },
  gallery: {
    label: "Image gallery",
    description: "A photo collection with captions and prices",
    kind: "gallery",
  },
};

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

export const uid = () => Math.random().toString(36).slice(2, 9);

const section = (
  id: HomeSectionId,
  title: string,
  over: Partial<HomeSection> = {},
): HomeSection => ({
  id,
  enabled: true,
  title,
  source: "auto",
  productIds: [],
  limit: 4,
  ...over,
});

export const defaultDesign: StoreDesign = {
  storeName: "Luna Boutique",
  sellingCategory: "",
  tagline: "Everyday style, thoughtfully selected",
  storeSlug: "luna-boutique",
  description:
    "Discover thoughtfully selected fashion, accessories, and everyday essentials from our store.",
  logoUrl: "",
  coverUrl: "",

  template: "marketplace",

  themePreset: "emerald",
  primaryColor: "#064e3b",
  secondaryColor: "#10b981",
  bgColor: "#ffffff",
  textColor: "#111827",
  fontFamily: "Inter",
  buttonRadius: "lg",
  cardStyle: "soft",
  cardVariant: "tile",
  cardCustom: defaultCardCustom,

  productsPerRow: 4,
  imageAspectRatio: "portrait",
  showRatings: true,
  showStockStatus: true,
  showSaleBadge: true,
  showComparePrice: true,
  showSoldCount: true,
  showWishlist: true,
  showQuickView: true,
  showAddToCart: true,

  heroLayout: "split",
  heroTitle: "Find your everyday favourite",
  heroSubtitle: "Fresh picks, fair prices, delivered to your door.",
  heroButtonText: "Shop collection",
  heroButtonUrl: "/products",
  heroImageUrl: "",
  bannerTone: "dark",
  bannerAutoplay: true,
  bannerProducts: true,
  bannerPromos: false,
  heroStyle: {},
  heroSlides: [],

  categoriesSource: "auto",
  categoryIds: [],
  categoryStyle: "circles",
  categoryOptions: defaultCategoryOptions,
  categoryLimit: 5,
  spotlightCategoryId: "auto",

  sections: [
    section("hero", ""),
    section("countdown", "Flash sale", { enabled: false }),
    section("trust", "Why shop with us"),
    section("categories", "Shop by category"),
    section("featured", "Featured products"),
    section("bestSellers", "Best sellers"),
    section("spotlight", "Our top category"),
    section("promo", "Offers", { enabled: false }),
    section("gallery", "The collection, up close", { enabled: false }),
    section("newArrivals", "Just arrived"),
    section("allProducts", "All products", { limit: 8 }),
    section("story", "A little about our store"),
  ],
  promoBanners: [],
  storyText:
    "We started Luna Boutique to bring thoughtfully made everyday pieces to shoppers across Bangladesh. Every product is checked before it ships.",
  countdownEndsAt: "",
  countdownSubtitle: "Hurry, prices go back up when the timer hits zero.",
  countdownButtonText: "Shop the sale",
  countdownButtonUrl: "",
  galleryItems: [],
  galleryStyle: "staggered",
  gallerySubtitle: "",

  headerStyle: "standard",
  stickyHeader: true,
  showSearch: true,
  showCartIcon: true,
  navLinks: [
    { id: "nav-1", label: "Home", url: "/" },
    { id: "nav-2", label: "Shop", url: "/products" },
    { id: "nav-3", label: "About", url: "/about" },
    { id: "nav-4", label: "Contact", url: "/contact" },
  ],
  announcementEnabled: true,
  announcementText: "Free delivery on orders over ৳999",
  showFooter: true,
  footerText: "Quality products, honest prices, delivered across Bangladesh.",

  showFilters: true,
  showSortMenu: true,
  defaultSort: "newest",
  pinnedProductIds: [],
  paymentMethods: ["cod", "bkash", "nagad"],
  freeDeliveryThreshold: 999,
  deliveryNote: "Delivery across Bangladesh",
  whatsappEnabled: false,
  whatsappNumber: "",
  whatsappMessage: "Hi! I have a question about your products.",
  vacationMode: false,
  vacationMessage: "We're taking a short break and will be back soon.",

  showVerifiedBadge: true,
  showReturnPolicy: true,
  returnPolicy: "Easy returns within 7 days on eligible products.",
  showPaymentBadges: true,

  showContactInfo: true,
  aboutLayout: "split",
  aboutTitle: "",
  aboutText: "",
  aboutImageUrl: "",
  contactLayout: "split",
  contactTitle: "",
  contactIntro: "",
  contactShowForm: true,
  supportEmail: "hello@lunaboutique.com",
  supportPhone: "+880 1712-345678",
  address: "Chattogram, Bangladesh",
  businessHours: "Sat to Thu, 10am to 8pm",
  showSocialLinks: true,
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",

  seoTitle: "Luna Boutique | Shop Online in Bangladesh",
  seoDescription:
    "Shop fashion and everyday favourites from Luna Boutique in Bangladesh.",

  productLayout: "app",
  productBgColor: "",
  productAccentColor: "",
  productButtonStyle: "solid",
  productButtonText: "Add to bag",
  productRelatedTitle: "You may also like",
  showProductTabs: true,
  showProductTrustRow: true,
  showProductRelated: true,
  showProductColorPicker: true,
  showProductSizePicker: true,
  showProductQuantity: true,
};

/**
 * Runtime list of every template id. Keep in sync with the `TemplateId`
 * union above: the compile-time guard below enforces it. A template missing
 * here gets reset to the default by normalizeDesign every time the design
 * is loaded.
 */
export const TEMPLATE_IDS = [
  "minimal",
  "premium",
  "promo",
  "fashion",
  "marketplace",
  "sport",
  "urban",
  "boutique",
  "grocery",
  "tech",
  "beauty",
  "living",
  "kids",
  "bangla-bazaar",
  "night-sale",
  "lookbook",
  "skincare",
  "edge",
  "casual",
  "streetwear",
  "yokai",
] as const satisfies readonly TemplateId[];

type _MissingTemplateId = Exclude<TemplateId, (typeof TEMPLATE_IDS)[number]>;
type _AssertAllTemplatesCovered = [_MissingTemplateId] extends [never]
  ? true
  : { error: "TEMPLATE_IDS is out of sync with TemplateId" };

/**
 * Runtime list of every card variant. Keep in sync with the `CardVariant`
 * union above — the compile-time guard below enforces it.
 *
 * This array drives the card picker UI in ProductCardsPanel. If a variant
 * is missing here it will not render as a selectable tile, and any saved
 * design referencing it will be reset to the fallback by normalizeDesign.
 */
export const CARD_VARIANTS = [
  "classic",
  "tile",
  "minimal",
  "editorial",
  "glass",
  "light",
  "overlay",
  "outline",
  "compact",
  "spotlight",
  "showcase",
  "orb",
  "fade",
  "noir",
  "ticket",
  "pastel",
  "popout",
  "chipped",
  "brand",
  "rail",
  "atelier",
  "arch",
  "aura",
  "luxe",
  "frost",
  "sheen",
  "grid",
  "skin",
  "catalog",
  "drop",
  "yokai",
  "pookie",
] as const satisfies readonly CardVariant[];

/* Compile-time guard: fails the build if CARD_VARIANTS ever misses (or
 * invents) a variant from the CardVariant union. */
type _MissingCardVariant = Exclude<CardVariant, (typeof CARD_VARIANTS)[number]>;
type _ExtraCardVariant = Exclude<(typeof CARD_VARIANTS)[number], CardVariant>;
type _AssertAllVariantsCovered = [
  _MissingCardVariant,
  _ExtraCardVariant,
] extends [never, never]
  ? true
  : { error: "CARD_VARIANTS is out of sync with CardVariant" };

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function pick<T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : fallback;
}

function oneOf<T extends string>(
  v: unknown,
  allowed: readonly T[],
): T | undefined {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : undefined;
}

/** Clean up saved card customization so bad values never reach the UI. */
export function sanitizeCardCustom(input: unknown): CardCustom {
  const s = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const color = (v: unknown) => (typeof v === "string" && HEX.test(v) ? v : "");
  const radius = (v: unknown) =>
    typeof v === "number" && v >= 0 && v <= 48 ? Math.round(v) : -1;
  const shadow: CardShadow =
    s.shadow === "none" || s.shadow === "soft" || s.shadow === "strong"
      ? s.shadow
      : "default";
  return {
    bg: color(s.bg),
    text: color(s.text),
    title: color(s.title),
    accent: color(s.accent),
    border: color(s.border),
    radius: radius(s.radius),
    buttonRadius: radius(s.buttonRadius),
    shadow,
    sale: color(s.sale),
    dark: color(s.dark),
    highlight: color(s.highlight),
    accent2: color(s.accent2),
    imageRatio:
      s.imageRatio === "square" ||
      s.imageRatio === "portrait" ||
      s.imageRatio === "landscape"
        ? s.imageRatio
        : "auto",
    imageFit:
      s.imageFit === "cover" || s.imageFit === "contain" ? s.imageFit : "auto",
    button: s.button === "buy" || s.button === "both" ? s.button : "cart",
  };
}

/** Clean up one banner's design. Unset or invalid fields are left out. */
export function sanitizeHeroStyle(input: unknown): HeroStyle {
  const s = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const out: HeroStyle = {};

  const layout = oneOf(s.layout, HERO_LAYOUTS);
  if (layout) out.layout = layout;
  const tone = oneOf(s.tone, ["dark", "brand", "light"] as const);
  if (tone) out.tone = tone;
  const align = oneOf(s.align, ["left", "center", "right"] as const);
  if (align) out.align = align;
  const valign = oneOf(s.valign, ["top", "middle", "bottom"] as const);
  if (valign) out.valign = valign;
  const titleSize = oneOf(s.titleSize, ["sm", "md", "lg", "xl"] as const);
  if (titleSize) out.titleSize = titleSize;
  const height = oneOf(s.height, ["sm", "md", "lg", "xl"] as const);
  if (height) out.height = height;
  const radius = oneOf(s.radius, ["none", "md", "lg", "xl"] as const);
  if (radius) out.radius = radius;
  const imageFocus = oneOf(s.imageFocus, ["top", "center", "bottom"] as const);
  if (imageFocus) out.imageFocus = imageFocus;
  const buttonStyle = oneOf(s.buttonStyle, [
    "solid",
    "outline",
    "soft",
    "brand",
  ] as const);
  if (buttonStyle) out.buttonStyle = buttonStyle;
  const buttonShape = oneOf(s.buttonShape, [
    "pill",
    "rounded",
    "square",
  ] as const);
  if (buttonShape) out.buttonShape = buttonShape;
  if (typeof s.badge === "string") out.badge = s.badge.slice(0, 24);
  if (typeof s.showStoreName === "boolean") out.showStoreName = s.showStoreName;

  if (typeof s.overlay === "number" && Number.isFinite(s.overlay)) {
    out.overlay = Math.min(80, Math.max(0, Math.round(s.overlay)));
  }
  for (const key of ["textColor", "bgColor", "bgColor2"] as const) {
    const v = s[key];
    if (typeof v === "string" && (v === "" || HEX.test(v))) out[key] = v;
  }
  return out;
}

/** Clean up the seller's extra banners. */
export function sanitizeHeroSlides(input: unknown): HeroSlide[] {
  if (!Array.isArray(input)) return [];
  const text = (v: unknown, max?: number) =>
    typeof v === "string" ? (max ? v.slice(0, max) : v) : "";
  return input
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .slice(0, MAX_HERO_SLIDES)
    .map((x) => ({
      id: typeof x.id === "string" && x.id ? x.id : uid(),
      title: text(x.title, 70),
      subtitle: text(x.subtitle, 140),
      buttonText: text(x.buttonText, 24),
      url: text(x.url),
      imageUrl: text(x.imageUrl),
      color: typeof x.color === "string" && HEX.test(x.color) ? x.color : "",
      style: sanitizeHeroStyle(x.style),
    }));
}

function sanitizeGalleryItems(raw: unknown): GalleryItem[] {
  const position = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.min(100, Math.max(0, v))
      : 50;
  if (!Array.isArray(raw)) return [];
  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.slice(0, max) : "";
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .slice(0, MAX_GALLERY_ITEMS)
    .map((x) => ({
      id: str(x.id, 40) || uid(),
      imageUrl: str(x.imageUrl, 2000),
      imagePositionX: position(x.imagePositionX),
      imagePositionY: position(x.imagePositionY),
      imageFit: x.imageFit === "contain" ? "contain" : "cover",
      caption: str(x.caption, 60),
      price: str(x.price, 24),
      url: str(x.url, 500),
      eyebrow: str(x.eyebrow, 32),
      buttonText: str(x.buttonText, 24),
      badge: str(x.badge, 12),
      color: typeof x.color === "string" && HEX.test(x.color) ? x.color : "",
      tone: x.tone === "light" ? "light" : "dark",
    }));
}

/** Clean up saved category options so bad values never reach the UI. */
export function sanitizeCategoryOptions(input: unknown): CategoryOptions {
  const o = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const d = defaultCategoryOptions;
  const cols = Number(o.columns);
  return {
    columns: Number.isFinite(cols)
      ? Math.min(5, Math.max(1, Math.round(cols)))
      : d.columns,
    aspect: pick(
      o.aspect,
      ["square", "portrait", "landscape", "wide"] as const,
      d.aspect,
    ),
    gap: pick(o.gap, ["tight", "normal", "loose"] as const, d.gap),
    radius: pick(
      o.radius,
      ["auto", "none", "sm", "md", "lg", "full"] as const,
      d.radius,
    ),
    label: pick(o.label, ["inside", "center", "below"] as const, d.label),
    textCase: pick(o.textCase, ["normal", "upper"] as const, d.textCase),
    align: pick(o.align, ["left", "center"] as const, d.align),
    overlay: pick(o.overlay, ["none", "soft", "strong"] as const, d.overlay),
    showCount: typeof o.showCount === "boolean" ? o.showCount : d.showCount,
    showArrow: typeof o.showArrow === "boolean" ? o.showArrow : d.showArrow,
    showImage: typeof o.showImage === "boolean" ? o.showImage : d.showImage,
    eyebrow: typeof o.eyebrow === "string" ? o.eyebrow.slice(0, 32) : d.eyebrow,
  };
}

/**
 * Merge a saved (possibly older) design with the current defaults so new
 * fields and new homepage sections never break an existing seller's draft.
 */
export function normalizeDesign(raw: unknown): StoreDesign {
  const input = (
    raw && typeof raw === "object" ? raw : {}
  ) as Partial<StoreDesign>;
  const merged: StoreDesign = { ...defaultDesign, ...input };

  merged.sellingCategory = normalizeSellingCategory(input.sellingCategory);

  const arrays = [
    "navLinks",
    "promoBanners",
    "galleryItems",
    "categoryIds",
    "pinnedProductIds",
    "paymentMethods",
  ] as const;
  for (const key of arrays) {
    if (!Array.isArray(input[key])) {
      (merged as unknown as Record<string, unknown>)[key] = defaultDesign[key];
    }
  }

  merged.aboutLayout = pick(
    input.aboutLayout,
    ["split", "editorial", "centered"] as const,
    "split",
  );
  merged.contactLayout = pick(
    input.contactLayout,
    ["split", "stacked", "details"] as const,
    "split",
  );
  merged.contactShowForm =
    typeof input.contactShowForm === "boolean" ? input.contactShowForm : true;
  for (const key of [
    "aboutTitle",
    "aboutText",
    "aboutImageUrl",
    "contactTitle",
    "contactIntro",
  ] as const) {
    merged[key] =
      typeof input[key] === "string"
        ? input[key].slice(
            0,
            key === "aboutText"
              ? 6000
              : key === "aboutImageUrl"
                ? 2000000
                : 1000,
          )
        : "";
  }
  merged.template = pick(input.template, TEMPLATE_IDS, defaultDesign.template);
  merged.cardVariant = pick(
    input.cardVariant,
    CARD_VARIANTS,
    defaultDesign.cardVariant,
  );
  merged.cardCustom = sanitizeCardCustom(input.cardCustom);
  merged.heroStyle = sanitizeHeroStyle(input.heroStyle);
  merged.heroSlides = sanitizeHeroSlides(input.heroSlides);
  merged.galleryItems = sanitizeGalleryItems(input.galleryItems);
  /* Older designs: "grid" on the Bento / Duo templates meant that layout. */
  const savedGallery =
    input.galleryStyle === "grid" && BENTO_TEMPLATES.includes(merged.template)
      ? "bento"
      : input.galleryStyle === "grid" &&
          DUO_GALLERY_TEMPLATES.includes(merged.template)
        ? "duo"
        : input.galleryStyle;
  merged.galleryStyle = pick(
    savedGallery,
    GALLERY_STYLES,
    defaultDesign.galleryStyle,
  );
  const gallery = templateGallery(
    merged.template,
    typeof input.galleryLayout === "string" ? input.galleryLayout : undefined,
  );
  merged.galleryLayout = gallery.id;
  merged.galleryAutoScroll = input.galleryAutoScroll === true;
  merged.galleryScrollSpeed =
    typeof input.galleryScrollSpeed === "number" &&
    Number.isFinite(input.galleryScrollSpeed)
      ? Math.max(10, Math.min(80, input.galleryScrollSpeed))
      : 28;
  merged.galleryStyle = gallery.base;
  merged.buttonRadius = pick(
    input.buttonRadius,
    ["none", "sm", "md", "lg", "full"] as const,
    defaultDesign.buttonRadius,
  );
  merged.cardStyle = pick(
    input.cardStyle,
    ["plain", "soft", "bordered"] as const,
    defaultDesign.cardStyle,
  );
  merged.imageAspectRatio = pick(
    input.imageAspectRatio,
    ["square", "portrait", "landscape"] as const,
    defaultDesign.imageAspectRatio,
  );
  merged.headerStyle = resolveHeaderStyle(input.headerStyle);
  merged.heroLayout = pick(
    input.heroLayout,
    HERO_LAYOUTS,
    defaultDesign.heroLayout,
  );
  merged.productLayout = pick(
    input.productLayout,
    [
      "app",
      "editorial",
      "split",
      "gallery-left",
      "gallery-right",
      "wide",
      "portrait",
      "stacked",
    ] as const,
    defaultDesign.productLayout,
  );
  merged.productButtonStyle = pick(
    input.productButtonStyle,
    ["solid", "outline", "rounded"] as const,
    defaultDesign.productButtonStyle,
  );
  for (const key of ["productButtonText", "productRelatedTitle"] as const) {
    const v = input[key];
    merged[key] = typeof v === "string" ? v.slice(0, 60) : defaultDesign[key];
  }
  merged.bannerTone = pick(
    input.bannerTone,
    ["dark", "brand", "light"] as const,
    defaultDesign.bannerTone,
  );
  merged.categoryStyle = pick(
    input.categoryStyle,
    CATEGORY_STYLES,
    defaultDesign.categoryStyle,
  );
  merged.categoryOptions = sanitizeCategoryOptions(input.categoryOptions);
  for (const key of [
    "primaryColor",
    "secondaryColor",
    "bgColor",
    "textColor",
  ] as const) {
    if (!HEX.test(String(merged[key] ?? ""))) merged[key] = defaultDesign[key];
  }
  const perRow = Number(merged.productsPerRow);
  merged.productsPerRow = Number.isFinite(perRow)
    ? Math.min(6, Math.max(2, Math.round(perRow)))
    : defaultDesign.productsPerRow;

  const saved = Array.isArray(input.sections) ? input.sections : [];
  const known = saved.filter((s) => s && s.id in sectionMeta);
  const seen = new Set(known.map((s) => s.id));
  const missing = defaultDesign.sections.filter((s) => !seen.has(s.id));
  merged.sections = [...known, ...missing].map((s) => ({
    ...(defaultDesign.sections.find((d) => d.id === s.id) as HomeSection),
    ...s,
  }));

  return merged;
}