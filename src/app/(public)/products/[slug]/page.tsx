import { productHref } from "@/lib/query/marketplace-links";
import { notFound, redirect } from "next/navigation";
import { toProduct } from "@/lib/api/marketplace";

// Resolve older slug-only links to the marketplace product page.
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
          target = productHref(p);
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
