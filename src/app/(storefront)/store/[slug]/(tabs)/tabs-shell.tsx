"use client";

import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LiveStorePreview } from "@/components/store-design/Storepreview";
import { ApiError } from "@/lib/api/http";
import { fetchPublicStore } from "@/lib/store-design/api";
import type { PublicStoreData } from "@/lib/store-design/server";
import { AboutContent } from "../_components/AboutContent";
import { ContactContent } from "../_components/ContactContent";
import { WishlistContent } from "../_components/WishlistContent";
import { StoreLooksTeaser } from "@/components/seller/looks/Storelooksteaser";

type StoreTab = "shop" | "about" | "contact" | "wishlist";

function tabFromPath(pathname: string, slug: string): StoreTab {
  const rest = pathname.replace(`/store/${slug}`, "").replace(/\/+$/, "");
  if (rest === "/about") return "about";
  if (rest === "/contact") return "contact";
  if (rest === "/wishlist") return "wishlist";
  return "shop";
}

export function StoreTabsShell({
  initialData,
}: {
  initialData: PublicStoreData;
}) {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? initialData.design.storeSlug;
  const pathname = usePathname() ?? "";

  const { data, error } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: () => fetchPublicStore(slug),
    initialData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });

  const activeTab = tabFromPath(pathname, slug);
  const design = data?.design;
  const products = data?.products;

  const tabContent = useMemo(() => {
    if (!design || !products) return undefined;
    if (activeTab === "about") return <AboutContent design={design} />;
    if (activeTab === "contact") return <ContactContent design={design} />;
    if (activeTab === "wishlist")
      return <WishlistContent design={design} products={products} />;
    return undefined;
  }, [activeTab, design, products]);

  if (error || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">
          {notFound ? "Store not found" : "Couldn't refresh store"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {notFound
            ? `No published store exists at /store/${slug}.`
            : "Showing a cached version. Refresh to try again."}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div style={{ background: data.design.bgColor }}>
      <LiveStorePreview
        design={data.design}
        products={data.products}
        categories={data.categories}
        device="desktop"
        verified={false}
        interactive
        activeTab={activeTab}
        tabContent={tabContent}
        looksSlot={
          activeTab === "shop" ? <StoreLooksTeaser store={slug} /> : undefined
        }
      />
    </div>
  );
}
