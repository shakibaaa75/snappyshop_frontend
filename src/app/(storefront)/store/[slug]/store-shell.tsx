"use client";

import { useParams } from "next/navigation";
import { CartProvider } from "@/lib/store-design/cart";
import { ScrollToTop } from "@/components/store/ScrollToTop";

export default function StoreSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "unknown";

  return (
    <CartProvider slug={slug}>
      <ScrollToTop />
      {children}
    </CartProvider>
  );
}
