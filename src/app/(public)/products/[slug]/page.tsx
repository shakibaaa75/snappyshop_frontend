import { notFound, redirect } from "next/navigation";
import { toProduct } from "@/lib/api/marketplace";

/**
 * Legacy /products/<slug> URL. Product slugs are only unique per seller, so
 * the real product page lives at /store/<seller-slug>/products/<id>. This
 * route looks the product up in the marketplace API and redirects there, so
 * old links keep working. It no longer uses sample data.
 */
// This page runs on the server, so it reaches the API through the private
// API_INTERNAL_URL (the same variable the rest of the server code uses).
const API_BASE = `${(process.env.API_INTERNAL_URL ?? "http://localhost:8080").replace(/\/+$/, "")}/api/v1`;

export default async function ProductRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let target: string | null = null;
  try {
    const q = encodeURIComponent(slug.replace(/-/g, " "));
    const res = await fetch(
      `${API_BASE}/marketplace/products?q=${q}&limit=60`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = (await res.json()) as { products?: unknown[] };
      for (const raw of data.products ?? []) {
        const p = toProduct(raw as Parameters<typeof toProduct>[0]);
        if (p.slug === slug) {
          target = `/store/${p.store.slug}/products/${p.id}`;
          break;
        }
      }
    }
  } catch {
    // fall through to 404
  }

  if (!target) notFound();
  redirect(target);
}
