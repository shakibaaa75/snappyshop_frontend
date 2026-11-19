export interface ImageSize {
  width: number;
  height?: number;
  quality?: number | "auto";
}

/**
 * Returns a Cloudinary-optimized URL at the requested size.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function img(url: string | undefined | null, size: ImageSize): string {
  if (!url) return "";

  // Only transform Cloudinary delivery URLs.
  if (!url.includes("res.cloudinary.com") && !url.includes("/image/upload/")) {
    return url;
  }

  const params = [
    `w_${size.width}`,
    size.height ? `h_${size.height}` : "",
    size.height ? "c_fill" : "c_limit",
    `q_${size.quality ?? "auto"}`,
    "f_auto",
  ]
    .filter(Boolean)
    .join(",");

  return url.replace("/image/upload/", `/image/upload/${params}/`);
}