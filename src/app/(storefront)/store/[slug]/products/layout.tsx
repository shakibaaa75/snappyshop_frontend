import { headers } from "next/headers";
import { StoreRoot } from "./store-root";

const MOBILE_UA = /Mobi|Android|iPhone|iPod|Windows Phone/i;

export default async function StoreSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const h = await headers();
  // Client hints first (Chromium), User-Agent as the fallback (Safari/Firefox).
  const hint = h.get("sec-ch-ua-mobile");
  const initialMobile =
    hint != null ? hint === "?1" : MOBILE_UA.test(h.get("user-agent") ?? "");

  return (
    <StoreRoot slug={slug} initialMobile={initialMobile}>
      {children}
    </StoreRoot>
  );
}
