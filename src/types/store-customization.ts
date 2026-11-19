
export interface StoreDesignValues {
  // 1. Identity
  storeName: string;
  tagline: string;

  // 2. Colors & Typography
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  buttonRadius: "none" | "sm" | "md" | "lg" | "full";

  // 3. Product Display
  layout: "grid" | "compact" | "large";
  imageAspectRatio: "square" | "portrait" | "landscape";
  showRatings: boolean;
  showStockStatus: boolean;
  showSaleBadge: boolean;

  // 4. Homepage Sections
  showHeroBanner: boolean;
  showFeaturedProducts: boolean;
  showNewArrivals: boolean;
  featuredTitle: string;
  newArrivalsTitle: string;

  // 5. Navigation
  headerStyle: "standard" | "centered" | "minimal";
  isStickyHeader: boolean;
  showAnnouncementBar: boolean;
  announcementText: string;

  // 6. Trust & Info
  showVerifiedBadge: boolean;
  showReturnPolicy: boolean;
  showContactInfo: boolean;

  // Keep all your other existing properties here.
}

export const defaultStoreDesign: StoreDesignValues = {
  storeName: "Your Store",
  tagline: "Discover something you love",

  primaryColor: "#15343c",
  secondaryColor: "#d97706",
  bgColor: "#ffffff",
  buttonRadius: "md",

  layout: "grid",
  imageAspectRatio: "square",
  showRatings: true,
  showStockStatus: true,
  showSaleBadge: true,

  showHeroBanner: true,
  showFeaturedProducts: true,
  showNewArrivals: true,
  featuredTitle: "Featured products",
  newArrivalsTitle: "New arrivals",

  headerStyle: "standard",
  isStickyHeader: false,
  showAnnouncementBar: false,
  announcementText: "Welcome to our store",

  showVerifiedBadge: true,
  showReturnPolicy: true,
  showContactInfo: true,

  // Keep the default values for all your other existing properties.
};