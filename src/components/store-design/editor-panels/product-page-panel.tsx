"use client";

import { type ReactNode } from "react";
import { type ProductLayout } from "@/lib/store-design/types";
import {
  ChoiceGrid,
  ColorField,
  Panel,
  Segmented,
  TextField,
  ToggleRow,
} from "../controls";
import { Box } from "./shared";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* Product detail page                                                 */
/* ------------------------------------------------------------------ */

export function ProductPagePanel({
  design,
  update,
  reviewPreview,
  setReviewPreview,
}: PanelProps & {
  reviewPreview: boolean;
  setReviewPreview: (value: boolean) => void;
}) {
  const layoutOptions: {
    value: ProductLayout;
    label: string;
    preview: ReactNode;
  }[] = [
    {
      value: "app",
      label: "App",
      preview: (
        <span className="relative block h-10 w-8">
          <Box className="h-full w-full rounded-md bg-foreground/30" />
          <span className="absolute right-0.5 top-1 flex flex-col gap-0.5">
            <Box className="h-1.5 w-1.5" />
            <Box className="h-1.5 w-1.5" />
          </span>
        </span>
      ),
    },
    {
      value: "editorial",
      label: "Editorial",
      preview: (
        <span className="flex h-10 w-16 items-stretch gap-0.5">
          <Box className="w-2" />
          <Box className="flex-1" />
          <Box className="w-4" />
        </span>
      ),
    },
    {
      value: "split",
      label: "Split",
      preview: (
        <span className="flex h-10 w-16 items-stretch gap-0.5">
          <Box className="flex-1" />
          <Box className="flex-1" />
        </span>
      ),
    },
    {
      value: "gallery-left",
      label: "Gallery left",
      preview: (
        <span className="flex h-10 w-16 items-stretch gap-0.5">
          <Box className="w-3" />
          <Box className="flex-1 bg-foreground/30" />
        </span>
      ),
    },
    {
      value: "gallery-right",
      label: "Gallery right",
      preview: (
        <span className="flex h-10 w-16 items-stretch gap-0.5">
          <Box className="flex-1 bg-foreground/30" />
          <Box className="w-3" />
        </span>
      ),
    },
    {
      value: "wide",
      label: "Wide",
      preview: (
        <span className="flex h-10 w-16 items-stretch gap-0.5">
          <Box className="flex-[2] bg-foreground/30" />
          <Box className="flex-1" />
        </span>
      ),
    },
    {
      value: "portrait",
      label: "Portrait",
      preview: (
        <span className="flex h-10 w-16 items-stretch gap-0.5">
          <Box className="w-6 bg-foreground/30" />
          <Box className="flex-1" />
        </span>
      ),
    },
    {
      value: "stacked",
      label: "Stacked",
      preview: (
        <span className="flex h-10 w-12 flex-col gap-0.5">
          <Box className="h-6 w-full bg-foreground/30" />
          <Box className="h-3 w-full" />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Segmented
        label="Edit product page"
        value={reviewPreview ? "reviews" : "details"}
        options={[
          { value: "details", label: "Product details" },
          { value: "reviews", label: "Reviews" },
        ]}
        onChange={(v) => setReviewPreview(v === "reviews")}
      />
      {reviewPreview ? (
        <Panel
          title="Product reviews"
          description="Preview the reviews shoppers see below each product. Publish to apply your changes."
        >
          <ToggleRow
            label="Show reviews on product pages"
            description="Show customer ratings, reviews and the review button on your store’s product pages."
            checked={design.showProductReviews !== false}
            onChange={(showProductReviews) => update({ showProductReviews })}
          />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Review position</legend>
            <p className="text-xs text-muted-foreground">
              Place reviews before or after “
              {design.productRelatedTitle.trim() || "You may also like"}”.
            </p>
            <Segmented
              label="Review position relative to related products"
              value={design.productReviewPosition ?? "before"}
              options={[
                { value: "before", label: "Before products" },
                { value: "after", label: "After products" },
              ]}
              onChange={(productReviewPosition) =>
                update({ productReviewPosition })
              }
            />
          </fieldset>
          <TextField
            label="Section heading"
            value={design.productReviewHeading ?? ""}
            placeholder="Customer reviews"
            maxLength={80}
            onChange={(productReviewHeading) =>
              update({ productReviewHeading })
            }
          />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Review layout</legend>
            <Segmented
              label="Product review layout"
              value={design.productReviewLayout ?? "carousel"}
              options={[
                { value: "carousel", label: "Carousel" },
                { value: "grid", label: "Grid" },
                { value: "testimonial", label: "Testimonials" },
              ]}
              onChange={(productReviewLayout) =>
                update({ productReviewLayout })
              }
            />
          </fieldset>
        </Panel>
      ) : (
        <>
          <Panel
            title="Layout"
            description="How the photos and details are arranged when shoppers open a product. The preview on the right updates as you choose."
          >
            <ChoiceGrid
              label="Product layout"
              cols={2}
              value={design.productLayout}
              onChange={(v) => update({ productLayout: v })}
              options={layoutOptions}
            />
          </Panel>

          <Panel
            title="Product page colors"
            description="Leave a swatch matching your theme to inherit it."
          >
            <ColorField
              label="Background"
              hint="Default matches your store background."
              value={design.productBgColor || design.bgColor}
              onChange={(v) =>
                update({ productBgColor: v === design.bgColor ? "" : v })
              }
            />
            <ColorField
              label="Accent (buttons & highlights)"
              hint="Default matches your store main color."
              value={design.productAccentColor || design.primaryColor}
              onChange={(v) =>
                update({
                  productAccentColor: v === design.primaryColor ? "" : v,
                })
              }
            />
          </Panel>

          <Panel
            title="Add to cart button"
            description="Solid follows your store's corner shape. Pill is always fully rounded."
          >
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Style</p>
              <Segmented
                label="Button style"
                value={design.productButtonStyle}
                onChange={(v) => update({ productButtonStyle: v })}
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "outline", label: "Outline" },
                  { value: "rounded", label: "Pill" },
                ]}
              />
            </div>
            <TextField
              label="Button text"
              value={design.productButtonText}
              onChange={(v) => update({ productButtonText: v })}
              maxLength={30}
              placeholder="Add to bag"
            />
          </Panel>

          <Panel
            title="Product page text"
            description="Return policy text is edited in Shop options."
          >
            <TextField
              label="Related products heading"
              value={design.productRelatedTitle}
              onChange={(v) => update({ productRelatedTitle: v })}
              maxLength={40}
              placeholder="You may also like"
            />
          </Panel>

          <Panel title="What to show on the product page">
            <ToggleRow
              label="Color picker"
              description="Show the color choice. Hidden, the first color is used."
              checked={design.showProductColorPicker}
              onChange={(v) => update({ showProductColorPicker: v })}
            />
            <ToggleRow
              label="Size picker"
              description="Show the size choice. Hidden, the first size is used."
              checked={design.showProductSizePicker}
              onChange={(v) => update({ showProductSizePicker: v })}
            />
            <ToggleRow
              label="Quantity stepper"
              checked={design.showProductQuantity}
              onChange={(v) => update({ showProductQuantity: v })}
            />
            <ToggleRow
              label="Details tabs"
              description="Details / Materials / Size & Fit / Shipping & Returns."
              checked={design.showProductTabs}
              onChange={(v) => update({ showProductTabs: v })}
            />
            <ToggleRow
              label="Trust row"
              description="Shipping, returns and secure-payment badges."
              checked={design.showProductTrustRow}
              onChange={(v) => update({ showProductTrustRow: v })}
            />
            <ToggleRow
              label="You May Also Like"
              description="Related products from the same category."
              checked={design.showProductRelated}
              onChange={(v) => update({ showProductRelated: v })}
            />
          </Panel>
        </>
      )}
    </div>
  );
}
