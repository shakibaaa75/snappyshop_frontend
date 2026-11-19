export type UserRole = "BUYER" | "SELLER" | "ADMIN";

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  image?: string;
}

export interface StoreCustomization {
  primaryColor?: string;
  bannerUrl?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  logo: string;
  banner?: string;
  customization?: StoreCustomization;
  isVerified: boolean;
  productCount?: number;
  rating?: number;
  category?: string;
  followers?: string;
  /** Short public store description (never private seller data). */
  description?: string;
  /** Completed (delivered) orders, when the API provides it. */
  completedOrders?: number;
  /** Number of seller reviews behind `rating`, when provided. */
  reviewCount?: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  store: Store;
  category: Category;
  rating: number;
  reviewCount?: number;
  sold?: number;
  badge?: string;
  description?: string;
  inStock?: boolean;
  /** True when the buyer must pick a size/colour first (open the product page). */
  hasVariants?: boolean;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  /** Present for sellers who have completed store setup. */
  storeSlug?: string;
  createdAt: string;
}