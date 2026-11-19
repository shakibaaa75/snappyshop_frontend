"use client";

import { CardScope } from "@/lib/store-design/card-style";
import { type ComponentType, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  type CardVariant,
  type Category,
  type Product,
  type StoreDesign,
} from "@/lib/store-design/types";
import { CARD_VARIANT_LABELS } from "./labels";
import { EXTRA_CARDS } from "./registry";
import { type CardProps } from "./types";

/* ------------------------------------------------------------------ */
/* Preview helpers (unchanged)                                         */
/* ------------------------------------------------------------------ */

/**
 * Pick a real product from the seller's catalog to drive the preview.
 * Prefers one with a photo and stock so the card looks representative.
 */
export function pickPreviewProduct(
  products: Product[],
  categories: Category[] = [],
): Product {
  if (products.length === 0) {
    return {
      id: "preview",
      name: "Your first product",
      price: 1290,
      comparePrice: 1690,
      stock: 7,
      rating: 4.8,
      reviews: 42,
      sold: 320,
      hue: 220,
      emoji: "🛍️",
      imageUrl: undefined,
      categoryId: categories[0]?.id ?? "",
    } as unknown as Product;
  }

  return (
    products.find((p) => !!p.imageUrl && p.stock > 0) ??
    products.find((p) => p.stock > 0) ??
    products.find((p) => !!p.imageUrl) ??
    products[0]
  );
}
/**
 * Renders the real card at `stageWidth`, measures its natural height,
 * then scales the whole stage into a box of the requested `width`.
 * Height comes from the *measured* content, so no variant is ever clipped.
 */
export function CardPreview({
  variant,
  design,
  categories = [],
  product,
  registry,
  stageWidth = 280,
  className,
}: {
  variant: CardVariant;
  design: StoreDesign;
  categories?: Category[];
  product?: Product;
  registry?: Partial<Record<CardVariant, ComponentType<CardProps>>>;
  stageWidth?: number;
  className?: string;
}) {
  const Comp = (registry?.[variant] ?? EXTRA_CARDS[variant]) as
    | ComponentType<CardProps>
    | undefined;

  const boxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const stage = stageRef.current;
    if (!box) return;

    const measure = () => {
      setBoxWidth(box.clientWidth);
      if (stageRef.current) setNaturalHeight(stageRef.current.offsetHeight);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(box);
    if (stage) ro.observe(stage);
    return () => ro.disconnect();
  }, [Comp, variant, product, design]);

  const scale = boxWidth > 0 ? boxWidth / stageWidth : 1;
  const height =
    naturalHeight > 0 ? Math.ceil(naturalHeight * scale) : undefined;

  const previewProduct = product ?? pickPreviewProduct([], categories);
  const previewDesign: StoreDesign = {
    ...design,
    showAddToCart: false,
    showWishlist: false,
  };

  return (
    <div
      ref={boxRef}
      className={cn("relative w-full", className)}
      style={{ height, minHeight: height ? undefined : 200 }}
    >
      {Comp ? (
        <div
          ref={stageRef}
          className="pointer-events-none absolute left-0 top-0 select-none"
          style={{
            width: stageWidth,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <CardScope d={previewDesign}>
            <Comp
              p={previewProduct}
              ctx={{ d: previewDesign, interactive: false, categories }}
            />
          </CardScope>
        </div>
      ) : (
        <div className="grid h-full min-h-[200px] w-full place-items-center rounded-2xl border border-dashed bg-muted/30 text-[10px] font-medium text-muted-foreground">
          {CARD_VARIANT_LABELS[variant]}
        </div>
      )}
    </div>
  );
}
