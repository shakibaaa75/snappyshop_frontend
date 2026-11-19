"use client";

import { BaseCardPreview } from "@/components/store-design/Storepreview";
import { type ComponentType } from "react";
import { Check } from "lucide-react";
import { LockBadge, UpgradeNotice } from "@/components/seller/plan-lock";
import { useEntitlements } from "@/lib/query/entitlements";
import { premiumDesignAllowed } from "@/lib/subscription";
import {
  CARD_VARIANT_LABELS,
  CardPreview,
  pickPreviewProduct,
} from "@/components/features/Storecards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTemplate } from "@/lib/store-design/templates";
import {
  CARD_VARIANTS,
  type CardCustom,
  type CardVariant,
  defaultCardCustom,
} from "@/lib/store-design/types";
import { ColorField, Panel, Segmented } from "../controls";
import { PngTip } from "@/lib/store-design/PngTip";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* Product card designs                                                */
/* ------------------------------------------------------------------ */

const BASE_CARDS: Partial<Record<CardVariant, ComponentType<any>>> = {
  /* eslint-disable-line @typescript-eslint/no-explicit-any */
  classic: BaseCardPreview,
  tile: BaseCardPreview,
  minimal: BaseCardPreview,
  editorial: BaseCardPreview,
};
export function ProductCardsPanel({
  design,
  update,
  products,
  categories,
}: PanelProps) {
  const previewProduct = pickPreviewProduct(products, categories);
  const { entitlements } = useEntitlements();
  const premium = premiumDesignAllowed(entitlements);

  const cs: CardCustom = design.cardCustom ?? defaultCardCustom;
  const setStyle = (patch: Partial<CardCustom>) =>
    update({ cardCustom: { ...cs, ...patch } });

  return (
    <div className="space-y-5">
      <Panel
        title="Choose your product card"
        description="Pick how products appear in your storefront. Previews show one of your real products using your current colors, font and card settings."
      >
        {!premium && (
          <UpgradeNotice title="Gallery grid is a premium card">
            The flat, edge-to-edge grid is included with a paid plan.
          </UpgradeNotice>
        )}
        {design.cardVariant === "pookie" && <PngTip />}
        <div
          role="radiogroup"
          aria-label="Product card design"
          className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3"
        >
          {CARD_VARIANTS.map((v) => {
            const active = design.cardVariant === v;
            const locked = v === "grid" && !premium;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={locked}
                title={
                  locked
                    ? "Premium: upgrade your plan to use this card"
                    : undefined
                }
                onClick={() => {
                  if (locked) return;
                  update({ cardVariant: v });
                }}
                className={cn(
                  "group relative flex min-w-0 flex-col items-stretch gap-2 rounded-2xl border p-2 text-left transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-accent ring-1 ring-accent"
                    : "hover:border-accent/50",
                  locked && "cursor-not-allowed opacity-70 hover:border-border",
                )}
              >
                <CardPreview
                  variant={v}
                  design={{ ...design, cardVariant: v }}
                  categories={categories}
                  product={previewProduct}
                  registry={BASE_CARDS}
                />
                <span className="flex items-center justify-between gap-2 px-1">
                  <span className="truncate text-sm font-semibold">
                    {CARD_VARIANT_LABELS[v]}
                  </span>
                  {locked && <LockBadge />}
                  {active && <Check className="h-4 w-4 shrink-0 text-accent" />}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {products.length === 0
            ? "Add a product to see the preview with your real listings."
            : `Preview uses “${previewProduct.name}” from your store.`}
        </p>
      </Panel>

      <Panel
        title="Customize your card"
        description="These settings apply to whichever card design you choose, and the previews above update live."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Card background"
            value={cs.bg || design.bgColor}
            onChange={(v) => setStyle({ bg: v })}
          />
          <ColorField
            label="Text color"
            value={cs.text || design.textColor}
            onChange={(v) => setStyle({ text: v })}
          />
          <ColorField
            label="Title color"
            value={cs.title || design.textColor}
            onChange={(v) => setStyle({ title: v })}
          />
          <ColorField
            label="Price & button color"
            value={cs.accent || design.primaryColor}
            onChange={(v) =>
              setStyle({
                accent: v,
                // Keep template accents in step, but only if they are already set.
                highlight: cs.highlight ? v : "",
                accent2: cs.accent2 ? v : "",
              })
            }
          />
          <ColorField
            label="Border color"
            value={cs.border || design.textColor}
            onChange={(v) => setStyle({ border: v })}
          />
          <ColorField
            label="Sale badge & heart"
            hint="Discount badge and saved heart."
            value={cs.sale || "#dc2626"}
            onChange={(v) => setStyle({ sale: v })}
          />
          <ColorField
            label="Dark card color"
            hint="Fade, Noir, Luxe and Glass cards."
            value={cs.dark || "#17181a"}
            onChange={(v) => setStyle({ dark: v })}
          />
          <ColorField
            label="Highlight color"
            hint="Stars, rings, edges and the Luxe gold."
            value={cs.highlight || design.secondaryColor}
            onChange={(v) => setStyle({ highlight: v })}
          />
          <ColorField
            label="Second accent"
            hint="Bar at the bottom of the card and buttons on dark cards."
            value={cs.accent2 || design.secondaryColor}
            onChange={(v) => setStyle({ accent2: v })}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Card corners</p>
          <Segmented
            label="Card corners"
            value={cs.radius}
            onChange={(v) => setStyle({ radius: v })}
            options={[
              { value: -1, label: "Default" },
              { value: 0, label: "Square" },
              { value: 12, label: "Slight" },
              { value: 20, label: "Round" },
              { value: 32, label: "Extra" },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Button corners</p>
          <Segmented
            label="Card button corners"
            value={cs.buttonRadius}
            onChange={(v) => setStyle({ buttonRadius: v })}
            options={[
              { value: -1, label: "Default" },
              { value: 0, label: "Square" },
              { value: 10, label: "Slight" },
              { value: 48, label: "Pill" },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Shadow</p>
          <Segmented
            label="Card shadow"
            value={cs.shadow}
            onChange={(v) => setStyle({ shadow: v })}
            options={[
              { value: "default", label: "Default" },
              { value: "none", label: "None" },
              { value: "soft", label: "Soft" },
              { value: "strong", label: "Strong" },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Photo size</p>
          <Segmented
            label="Card photo size"
            value={cs.imageRatio ?? "auto"}
            onChange={(v) => setStyle({ imageRatio: v })}
            options={[
              { value: "auto", label: "Default" },
              { value: "square", label: "Square" },
              { value: "portrait", label: "Tall" },
              { value: "landscape", label: "Wide" },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Photo fit</p>
          <Segmented
            label="Card photo fit"
            value={cs.imageFit ?? "auto"}
            onChange={(v) => setStyle({ imageFit: v })}
            options={[
              { value: "auto", label: "Default" },
              { value: "cover", label: "Fill" },
              { value: "contain", label: "Whole" },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Card button</p>
          <Segmented
            label="Card button"
            value={cs.button ?? "cart"}
            onChange={(v) => setStyle({ button: v })}
            options={[
              { value: "cart", label: "Add to cart" },
              { value: "buy", label: "Buy now" },
              { value: "both", label: "Both" },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Buy now adds the product to the cart and opens checkout. Both shows
            the two buttons side by side. Products with sizes or colors still
            open their page so the buyer can pick.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={() =>
            update({
              // Back to the current template's card colors, not blank.
              cardCustom: {
                ...defaultCardCustom,
                ...(getTemplate(design.template)?.cardColors ?? {}),
              },
            })
          }
        >
          Reset card style
        </Button>
      </Panel>
    </div>
  );
}
