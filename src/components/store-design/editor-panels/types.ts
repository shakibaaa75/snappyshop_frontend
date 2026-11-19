import {
  type Category,
  type Product,
  type StoreDesign,
} from "@/lib/store-design/types";

export interface PanelProps {
  design: StoreDesign;
  previewTemplate?: StoreDesign["template"] | null;
  onPreviewTemplate?: (id: StoreDesign["template"] | null) => void;
  update: (patch: Partial<StoreDesign>) => void;
  products: Product[];
  categories: Category[];
  verified: boolean;
  /** When false, the store address field is read-only (30-day cooldown). */
  canChangeSlug?: boolean;
  /** Shown under the store address field when locked. */
  slugLockMessage?: string | null;
  /** Shop name rules: one change after registration, 30-day lock. */
  shop?: ShopNameControls;
  /**
   * Called by a panel that saves on its own button (not the draft autosave)
   * to say whether it holds unsaved changes. The editor asks before leaving.
   */
  onDirtyChange?: (dirty: boolean) => void;
}
export interface ShopNameControls {
  canChange: boolean;
  remaining: number;
  nextChangeAt: string | null;
  disclaimer?: string;
  /** Performs the confirmed rename; throws on failure. */
  rename: (name: string, slugOverride?: string) => Promise<void>;
}
