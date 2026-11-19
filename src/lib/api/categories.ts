import { apiFetch } from "@/lib/api/http";
import { deleteUpload, resizeAndUploadImage } from "@/lib/api/uploads";

export interface SellerCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  position: number;
  /** Legacy field from the old emoji-based categories. Safe to ignore. */
  emoji?: string;
}

export interface CategoryInput {
  name: string;
  /** New picture. Uploaded to R2; only its https URL is saved. */
  image?: File | null;
  /** Update only: delete the current picture. Ignored when `image` is set. */
  removeImage?: boolean;
  /** Update only: send the current values so the edit does not reset them. */
  position?: number;
  emoji?: string;
}

/** Platform-wide category tree (Fashion -> Hoodie). Same for every seller. */
export interface CategoryTreeNode {
  id: string;
  name: string;
  /** Picture the admin chose (optional). */
  image?: string;
  children: { id: string; name: string; image?: string }[];
}

export const categoryTree = {
  get: () =>
    apiFetch<{ categories: CategoryTreeNode[] }>("/categories/tree").then(
      (r) => r.categories,
    ),
};

/** Typo- and alias-tolerant search over product types ("hodie" -> Hoodie). */
export interface CategorySuggestion {
  id: string;
  name: string;
  parentId: string;
}

export const categorySearch = {
  /** Typo-tolerant search inside ONE Main Type ("hodie" -> Hoodie). */
  inMain: (mainId: string, q: string) =>
    apiFetch<{
      suggestions: { node: CategorySuggestion; score: number }[];
    }>(
      `/categories/suggest?parent=${encodeURIComponent(mainId)}&q=${encodeURIComponent(q)}`,
    ).then((r) => (r.suggestions ?? []).map((s) => s.node)),
  productTypes: (q: string) =>
    apiFetch<{
      suggestions: { node: CategorySuggestion; score: number }[];
    }>(`/categories/suggest?level=sub&q=${encodeURIComponent(q)}`).then((r) =>
      (r.suggestions ?? []).map((s) => s.node),
    ),
};

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Category pictures go to Cloudflare R2 through the backend upload endpoint
 * (POST /seller/uploads, kind "category"). The category row stores only the
 * returned https URL, never the image bytes.
 */
async function uploadCategoryImage(file: File) {
  return resizeAndUploadImage(file, "category", { maxSize: 600, quality: 0.85 });
}

/**
 * Upload the picture (if any), then save the category with its URL. If saving
 * fails after the upload, the new R2 file is deleted so nothing is left behind.
 */
async function saveWithImage<T>(
  input: CategoryInput,
  save: (payload: Record<string, unknown>) => Promise<T>,
): Promise<T> {
  // Bengali-only names slugify to "", but the backend requires a slug.
  const slug =
    slugifyCategory(input.name) || `cat-${Date.now().toString(36)}`;
  const payload: Record<string, unknown> = { name: input.name, slug };
  if (input.position !== undefined) payload.position = input.position;
  if (input.emoji) payload.emoji = input.emoji;
  if (input.removeImage && !input.image) payload.removeImage = true;

  let uploadedId: string | null = null;
  if (input.image) {
    const up = await uploadCategoryImage(input.image);
    uploadedId = up.id;
    payload.imageUrl = up.publicUrl;
  }
  try {
    return await save(payload);
  } catch (err) {
    if (uploadedId) void deleteUpload(uploadedId).catch(() => {});
    throw err;
  }
}

export const sellerCategories = {
  list: () =>
    apiFetch<{ categories: SellerCategory[] }>("/seller/categories").then(
      (r) => r.categories,
    ),

  create: (input: CategoryInput): Promise<SellerCategory> =>
    saveWithImage(input, (body) =>
      apiFetch<{ category: SellerCategory }>("/seller/categories", {
        method: "POST",
        body,
      }).then((r) => r.category),
    ),

  /** No image and no removeImage = keep the current picture. */
  update: (id: string, input: CategoryInput): Promise<SellerCategory> =>
    saveWithImage(input, (body) =>
      apiFetch<{ category: SellerCategory }>(
        `/seller/categories/${encodeURIComponent(id)}`,
        { method: "PUT", body },
      ).then((r) => r.category),
    ),

  remove: async (id: string): Promise<void> => {
    await apiFetch<void>(`/seller/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};