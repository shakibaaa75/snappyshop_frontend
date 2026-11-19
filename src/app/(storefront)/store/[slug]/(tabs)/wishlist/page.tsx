import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Wishlist — ${slug.replace(/-/g, " ")}`,
    robots: { index: false, follow: false },
  };
}

// Rendered by the persistent shell in ../layout.tsx.
export default function StoreWishlistPage() {
  return null;
}
