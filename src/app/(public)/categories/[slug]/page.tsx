import { redirect } from "next/navigation";
import { homeHref } from "@/lib/query/category-nav";

/** Old category URLs land on the marketplace homepage's category view. */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(homeHref({ category: decodeURIComponent(slug) }));
}
