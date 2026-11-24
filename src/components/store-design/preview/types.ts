import {
  type Category,
  type Product,
  type StoreDesign,
} from "@/lib/store-design/types";
import { type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PreviewDevice = "desktop" | "mobile";
export const STORE_TABS = [
  { id: "shop", label: "Shop", url: "" },
  { id: "about", label: "About", url: "/about" },
  { id: "contact", label: "Contact", url: "/contact" },
  { id: "wishlist", label: "Wishlist", url: "/wishlist" },
] as const;
export type StoreTabId = (typeof STORE_TABS)[number]["id"];
export interface PreviewProps {
  design: StoreDesign;
  products: Product[];
  categories: Category[];
  device: PreviewDevice;
  verified?: boolean;
  interactive?: boolean;
  loading?: boolean;
  activeTab?: "shop" | "about" | "contact" | "wishlist";
  tabContent?: ReactNode;
  /** Extra block shown at the end of the store home (Try the Look row). */
  looksSlot?: ReactNode;
  /** "products" renders the full products page (category chips + all products). */
  page?: "home" | "products";
  /** Category id to preselect on the products page (from ?category=). */
  initialCategory?: string;
  /** Hide the in-page WhatsApp button (the editor device frame draws its own). */
  hideFab?: boolean;
}
export interface Ctx {
  d: StoreDesign;
  mobile: boolean;
  radius: number;
  products: Product[];
  categories: Category[];
  verified: boolean;
  interactive: boolean;
  openCart?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}