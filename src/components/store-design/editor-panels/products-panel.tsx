"use client";

import { ReviewPicker } from "@/components/reviews/Reviews";
import { ChoiceGrid, Panel, Segmented, ToggleRow } from "../controls";
import { Box } from "./shared";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* Product grid and card content                                       */
/* ------------------------------------------------------------------ */

export function ProductsPanel({ design, update }: PanelProps) {
  return (
    <div className="space-y-5">
      <Panel
        title="Customer reviews"
        description="Feature published reviews from your Reviews dashboard."
      >
        <div className="grid gap-3">
          <label>
            <input
              type="checkbox"
              checked={!!design.reviewSection}
              onChange={(e) => update({ reviewSection: e.target.checked })}
            />{" "}
            Show reviews on the store homepage
          </label>
          <ReviewPicker
            selected={design.reviewIds ?? []}
            change={(reviewIds) => update({ reviewIds })}
          />
          <label>
            Heading{" "}
            <input
              value={design.reviewHeading ?? "Customer reviews"}
              maxLength={80}
              onChange={(e) => update({ reviewHeading: e.target.value })}
            />
          </label>
          <label>
            Layout{" "}
            <select
              value={design.reviewLayout ?? "grid"}
              onChange={(e) =>
                update({
                  reviewLayout: e.target.value as
                    | "grid"
                    | "carousel"
                    | "testimonial",
                })
              }
            >
              <option>grid</option>
              <option>carousel</option>
              <option>testimonial</option>
            </select>
          </label>
          <label>
            Background{" "}
            <input
              type="color"
              value={design.reviewColor ?? "#ffffff"}
              onChange={(e) => update({ reviewColor: e.target.value })}
            />
          </label>
          <label>
            Padding{" "}
            <input
              type="range"
              min={0}
              max={64}
              value={design.reviewPadding ?? 20}
              onChange={(e) =>
                update({ reviewPadding: Number(e.target.value) })
              }
            />{" "}
            {design.reviewPadding ?? 20}px
          </label>
        </div>
      </Panel>
      <Panel
        title="Product grid"
        description="Phones always show two products per row."
      >
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Products per row (desktop)</p>
          <Segmented
            label="Products per row"
            value={design.productsPerRow}
            onChange={(v) => update({ productsPerRow: v })}
            options={[2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Image shape</p>
          <ChoiceGrid
            label="Image shape"
            value={design.imageAspectRatio}
            onChange={(v) => update({ imageAspectRatio: v })}
            options={[
              {
                value: "square",
                label: "Square",
                preview: <Box className="h-8 w-8" />,
              },
              {
                value: "portrait",
                label: "Portrait",
                preview: <Box className="h-9 w-6" />,
              },
              {
                value: "landscape",
                label: "Landscape",
                preview: <Box className="h-6 w-10" />,
              },
            ]}
          />
        </div>
      </Panel>

      <Panel title="What each card shows">
        <ToggleRow
          label="Ratings"
          description="Star rating and review count."
          checked={design.showRatings}
          onChange={(v) => update({ showRatings: v })}
        />
        <ToggleRow
          label="Units sold"
          description="Shows how many people have bought it."
          checked={design.showSoldCount}
          onChange={(v) => update({ showSoldCount: v })}
        />
        <ToggleRow
          label="Stock status"
          description="Shows Sold out and Only a few left."
          checked={design.showStockStatus}
          onChange={(v) => update({ showStockStatus: v })}
        />
        <ToggleRow
          label="Sale badge"
          description="Shows the percentage off on discounted products."
          checked={design.showSaleBadge}
          onChange={(v) => update({ showSaleBadge: v })}
        />
        <ToggleRow
          label="Original price"
          description="Shows the crossed-out price next to the sale price."
          checked={design.showComparePrice}
          onChange={(v) => update({ showComparePrice: v })}
        />
        <ToggleRow
          label="Add to cart button"
          checked={design.showAddToCart}
          onChange={(v) => update({ showAddToCart: v })}
        />
        <ToggleRow
          label="Wishlist heart"
          description="Lets shoppers save products for later."
          checked={design.showWishlist}
          onChange={(v) => update({ showWishlist: v })}
        />
        <ToggleRow
          label="Quick view"
          description="Lets shoppers peek at details from the grid."
          checked={design.showQuickView}
          onChange={(v) => update({ showQuickView: v })}
        />
      </Panel>
    </div>
  );
}
