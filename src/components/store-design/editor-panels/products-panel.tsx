"use client";

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
