import { apiFetch } from "@/lib/api/http";

/**
 * Image / video upload to Cloudflare R2.
 *
 * Images: POST the file to the backend (multipart). The backend checks the
 * real file type, re-encodes it to clean WebP, stores it in R2 and returns
 * the public URL. The browser never talks to R2 for images.
 *
 * Videos (banner_video only): short-lived presigned link, PUT straight to R2.
 */

export type UploadKind =
  | "product"
  | "category"
  | "seller_cover"
  | "seller_profile"
  | "avatar" // the owner's personal picture (not the storefront image)
  | "homepage"
  | "banner_video"
  | "look_model";

interface PresignResponse {
  uploadUrl: string;
  headers: Record<string, string>;
  publicUrl: string;
  key: string;
}

interface UploadResponse {
  id: string;
  key: string;
  publicUrl: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadToR2(
  file: Blob,
  kind: UploadKind,
  contentType: string = file.type,
  /** Sellers use the default. The admin panel passes "/admin/uploads/presign". */
  presignPath: string = "/seller/uploads/presign",
  opts: { productId?: string } = {},
): Promise<string> {
  if (kind !== "banner_video") {
    return (await uploadImage(file, kind, presignPath, opts)).publicUrl;
  }

  // Video: presigned PUT (the backend cannot process video).
  const presign = await apiFetch<PresignResponse>(presignPath, {
    method: "POST",
    body: { kind, contentType, size: file.size },
  });
  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: presign.headers,
    body: file,
  });
  if (!put.ok) {
    throw new Error(
      `Upload failed (${put.status}). Check the R2 bucket CORS settings.`,
    );
  }
  return presign.publicUrl;
}

/** POST /{seller|admin}/uploads (multipart). Returns id + key + publicUrl. */
export async function uploadImage(
  file: Blob,
  kind: Exclude<UploadKind, "banner_video">,
  presignPath: string = "/seller/uploads/presign",
  opts: { productId?: string } = {},
): Promise<UploadResponse> {
  const path = presignPath.replace(/\/presign$/, ""); // "/seller/uploads"
  const form = new FormData();
  form.append("kind", kind);
  if (opts.productId) form.append("productId", opts.productId);
  // Name and type are ignored by the server; it reads the real bytes.
  form.append("file", file, "image");

  // IMPORTANT: apiFetch must send FormData untouched (no JSON.stringify and
  // no Content-Type header) and keep cookies + the X-Requested-With header.
  return apiFetch<UploadResponse>(path, { method: "POST", body: form });
}

/** Delete an uploaded image you own. */
export async function deleteUpload(
  id: string,
  uploadsPath: string = "/seller/uploads",
): Promise<void> {
  await apiFetch<void>(`${uploadsPath}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * Resize an image in the browser, then upload it.
 * Small JPEG/PNG/WebP files that are already small enough are sent as they are.
 * Returns only the public URL. Use resizeAndUploadImage when you also need the
 * upload id/key (for example to delete the file again if a later save fails).
 */
export async function resizeAndUpload(
  file: File,
  kind: UploadKind,
  opts: {
    maxSize?: number;
    quality?: number;
    presignPath?: string;
    productId?: string;
  } = {},
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  const { blob, type } = await prepareImage(
    file,
    opts.maxSize ?? 1600,
    opts.quality ?? 0.85,
  );
  return uploadToR2(blob, kind, type, opts.presignPath, {
    productId: opts.productId,
  });
}

/** Like resizeAndUpload for images, but returns { id, key, publicUrl }. */
export async function resizeAndUploadImage(
  file: File,
  kind: Exclude<UploadKind, "banner_video">,
  opts: {
    maxSize?: number;
    quality?: number;
    presignPath?: string;
    productId?: string;
  } = {},
): Promise<UploadResponse> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  const { blob } = await prepareImage(
    file,
    opts.maxSize ?? 1600,
    opts.quality ?? 0.85,
  );
  return uploadImage(blob, kind, opts.presignPath, {
    productId: opts.productId,
  });
}

async function prepareImage(
  file: File,
  maxSize: number,
  quality: number,
): Promise<{ blob: Blob; type: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that image."));
      el.src = url;
    });

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    if (scale >= 1 && file.size < 800_000 && IMAGE_TYPES.includes(file.type)) {
      return { blob: file, type: file.type };
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that image.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const keepsAlpha = file.type === "image/png" || file.type === "image/webp";
    const type = keepsAlpha ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality),
    );
    if (!blob) throw new Error("Could not compress that image.");
    return { blob, type };
  } finally {
    URL.revokeObjectURL(url);
  }
}