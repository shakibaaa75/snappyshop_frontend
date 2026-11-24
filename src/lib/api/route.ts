import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { storeTag } from "@/lib/store-design/server";

/**
 * POST /internal/revalidate
 *
 * Lets the Go API clear a store's cached data the moment something changes,
 * so storefront pages can be cached safely instead of rebuilt on every visit.
 *
 *   Header:  x-revalidate-secret: <REVALIDATE_SECRET>
 *   Body:    { "slugs": ["luna-boutique", "old-slug-if-renamed"] }
 *
 * The Go API should call it after: publishing a design, changing a shop name
 * or URL (send BOTH the old and the new slug), an admin changing a seller's
 * visibility, and creating, editing or deleting a product.
 *
 * Fails closed: without REVALIDATE_SECRET set, every request is refused.
 */
export const dynamic = "force-dynamic";

const MAX_SLUGS = 50;

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = req.headers.get("x-revalidate-secret") ?? "";
  if (!secret || !sameSecret(given, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { slugs?: unknown };
  try {
    body = (await req.json()) as { slugs?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const slugs = Array.isArray(body.slugs)
    ? body.slugs.filter(
        (s): s is string =>
          typeof s === "string" && s.trim() !== "" && s.length <= 100,
      )
    : [];
  if (slugs.length === 0 || slugs.length > MAX_SLUGS) {
    return NextResponse.json(
      { error: `send 1 to ${MAX_SLUGS} slugs` },
      { status: 400 },
    );
  }

  for (const slug of slugs) revalidateTag(storeTag(slug));
  return NextResponse.json({ revalidated: slugs.length });
}