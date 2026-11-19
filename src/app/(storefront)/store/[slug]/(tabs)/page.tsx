import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug.replace(/-/g, " "),
    robots: { index: true, follow: true },
  };
}

// Rendered by the persistent shell in ./layout.tsx.
export default function StorePage() {
  return null;
}
