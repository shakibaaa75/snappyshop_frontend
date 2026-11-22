import { saveDraft } from "@/lib/store-design/api";
import { defaultDesign } from "@/lib/store-design/types";
import { slugify } from "@/lib/store-design/utilts";
import { ONBOARDING_STORE_KEY } from "@/lib/store-design/purge";
import { normalizeSellingCategory } from "@/lib/store-design/selling-categories";

type Saved = {
  userId?: string;
  sellingCategory?: string;
  storeDescription?: string;
  brandColor?: string;
  productLayout?: string;
  storeName?: string;
  storeSlug?: string;
};

/**
 * Creates the seller's store from the details they typed in the registration
 * wizard (kept in sessionStorage), so there is no second setup form.
 *
 * Returns the new store address, or null when no usable details were kept
 * (storage blocked, another user's data, ...). Throws the API error when the
 * server refuses (for example the address is already taken).
 */
export async function createStoreFromOnboarding(
  userId: string,
): Promise<string | null> {
  let saved: Saved | null = null;
  try {
    const raw = window.sessionStorage.getItem(ONBOARDING_STORE_KEY);
    if (raw) saved = JSON.parse(raw) as Saved;
  } catch {
    saved = null;
  }
  if (!saved || saved.userId !== userId) return null;

  const storeName = String(saved.storeName ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
  const storeSlug = slugify(String(saved.storeSlug ?? "") || storeName);
  const sellingCategory = normalizeSellingCategory(saved.sellingCategory);
  if (storeName.length < 3 || storeSlug.length < 3 || !sellingCategory) {
    return null;
  }

  await saveDraft({
    ...defaultDesign,
    sellingCategory,
    description: String(saved.storeDescription ?? "").slice(0, 1000),
    primaryColor: /^#[0-9a-f]{6}$/i.test(saved.brandColor ?? "")
      ? (saved.brandColor as string)
      : defaultDesign.primaryColor,
    productsPerRow:
      saved.productLayout === "compact"
        ? 4
        : saved.productLayout === "large"
          ? 2
          : 3,
    storeName,
    storeSlug,
  });
  try {
    window.sessionStorage.removeItem(ONBOARDING_STORE_KEY);
  } catch {
    /* Storage may be blocked. */
  }
  return storeSlug;
}
