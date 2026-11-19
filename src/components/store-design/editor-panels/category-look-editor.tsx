"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TEMPLATE_CATEGORY_LOOK } from "@/lib/store-design/templates";
import {
  CATEGORY_OPTION_FIELDS,
  type CategoryOptions,
  defaultCategoryOptions,
  type StoreDesign,
} from "@/lib/store-design/types";
import {
  ChoiceGrid,
  Notice,
  Segmented,
  TextField,
  ToggleRow,
} from "../controls";
import { Box } from "./shared";

/* ------------------------------------------------------------------ */
/* Header, menu, footer                                                */
/* ------------------------------------------------------------------ */

const miniBox = "block bg-foreground/20";
export const CATEGORY_STYLE_CHOICES: {
  value: StoreDesign["categoryStyle"];
  label: string;
  preview: ReactNode;
}[] = [
  {
    value: "circles",
    label: "Circles",
    preview: (
      <span className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn(miniBox, "h-6 w-6 rounded-full")} />
        ))}
      </span>
    ),
  },
  {
    value: "cards",
    label: "Cards",
    preview: (
      <span className="flex gap-1.5">
        {[0, 1].map((i) => (
          <Box key={i} className="h-6 w-8 rounded-md" />
        ))}
      </span>
    ),
  },
  {
    value: "chips",
    label: "Chips",
    preview: (
      <span className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn(miniBox, "h-3 w-6 rounded-full")} />
        ))}
      </span>
    ),
  },
  {
    value: "tiles",
    label: "Tiles",
    preview: (
      <span className="grid grid-cols-3 gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn(miniBox, "h-7 w-4")} />
        ))}
      </span>
    ),
  },
  {
    value: "mosaic",
    label: "Mosaic",
    preview: (
      <span className="grid h-7 w-12 grid-cols-3 grid-rows-2 gap-0.5">
        <span className={cn(miniBox, "row-span-2")} />
        <span className={cn(miniBox, "col-span-2")} />
        <span className={miniBox} />
        <span className={miniBox} />
      </span>
    ),
  },
  {
    value: "banner",
    label: "Banner",
    preview: (
      <span className="flex w-12 flex-col gap-0.5">
        <span className={cn(miniBox, "h-3")} />
        <span className={cn(miniBox, "h-3")} />
      </span>
    ),
  },
  {
    value: "strip",
    label: "Strip",
    preview: (
      <span className="flex w-12 gap-0.5 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn(miniBox, "h-7 w-5 shrink-0")} />
        ))}
      </span>
    ),
  },
  {
    value: "rail",
    label: "Rail",
    preview: (
      <span className="flex w-12 gap-0.5 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex shrink-0 flex-col gap-0.5">
            <span className={cn(miniBox, "h-5 w-5")} />
            <span className={cn(miniBox, "h-1 w-3")} />
          </span>
        ))}
      </span>
    ),
  },
  {
    value: "list",
    label: "List",
    preview: (
      <span className="flex w-12 flex-col gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex items-center gap-1">
            <span className={cn(miniBox, "h-1.5 flex-1")} />
            <span className={cn(miniBox, "h-1.5 w-1.5")} />
          </span>
        ))}
      </span>
    ),
  },
];
/**
 * Layout and styling controls for the Category section. Shows only the
 * fields the chosen style uses (CATEGORY_OPTION_FIELDS). Every template
 * pre-fills these; the button at the bottom returns to that starting look.
 */
export function CategoryLookEditor({
  design,
  update,
}: {
  design: StoreDesign;
  update: (p: Partial<StoreDesign>) => void;
}) {
  const o = design.categoryOptions;
  const style = design.categoryStyle;
  const fields = CATEGORY_OPTION_FIELDS[style];
  const has = (k: keyof CategoryOptions) => fields.includes(k);
  const set = (p: Partial<CategoryOptions>) =>
    update({ categoryOptions: { ...o, ...p } });
  const imageStyle = fields.length > 1;
  const onPhoto =
    style === "mosaic" ||
    style === "strip" ||
    (style !== "rail" && o.label !== "below");

  const colChoices = style === "banner" ? [1, 2, 3] : [2, 3, 4, 5];
  const aspectChoices: { value: CategoryOptions["aspect"]; label: string }[] =
    style === "banner"
      ? [
          { value: "wide", label: "Wide" },
          { value: "landscape", label: "Landscape" },
          { value: "square", label: "Square" },
        ]
      : style === "strip"
        ? [
            { value: "portrait", label: "Portrait" },
            { value: "square", label: "Square" },
            { value: "landscape", label: "Landscape" },
          ]
        : [
            { value: "portrait", label: "Portrait" },
            { value: "square", label: "Square" },
            { value: "landscape", label: "Landscape" },
          ];

  const look = TEMPLATE_CATEGORY_LOOK[design.template];
  const reset = () =>
    update({
      ...(look ? { categoryStyle: look.style } : null),
      categoryOptions: { ...defaultCategoryOptions, ...look?.options },
    });

  return (
    <div className="space-y-4 rounded-xl border p-3">
      <p className="text-sm font-semibold">Customize this style</p>
      <TextField
        label="Small line above the title (optional)"
        value={o.eyebrow}
        onChange={(v) => set({ eyebrow: v })}
        maxLength={32}
        placeholder="DISCOVER"
      />
      {!imageStyle && (
        <Notice>
          Tiles, Mosaic, Banner, Strip, Rail and List use your category photos
          and have more layout controls.
        </Notice>
      )}
      {has("columns") && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">
            {style === "strip" || style === "rail"
              ? "Visible at once"
              : "Per row"}
          </p>
          <Segmented
            label="Categories per row"
            value={o.columns}
            onChange={(v) => set({ columns: v })}
            options={colChoices.map((n) => ({ value: n, label: String(n) }))}
          />
        </div>
      )}
      {has("aspect") && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Photo shape</p>
          <Segmented
            label="Photo shape"
            value={o.aspect}
            onChange={(v) => set({ aspect: v })}
            options={aspectChoices}
          />
        </div>
      )}
      {has("label") && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Name position</p>
          <Segmented
            label="Name position"
            value={o.label}
            onChange={(v) => set({ label: v })}
            options={[
              { value: "inside", label: "On photo" },
              { value: "center", label: "Centered" },
              { value: "below", label: "Below" },
            ]}
          />
        </div>
      )}
      {has("overlay") && onPhoto && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Dark fade behind the name</p>
          <Segmented
            label="Text fade"
            value={o.overlay}
            onChange={(v) => set({ overlay: v })}
            options={[
              { value: "none", label: "None" },
              { value: "soft", label: "Soft" },
              { value: "strong", label: "Strong" },
            ]}
          />
        </div>
      )}
      {has("gap") && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Spacing</p>
          <Segmented
            label="Spacing"
            value={o.gap}
            onChange={(v) => set({ gap: v })}
            options={[
              { value: "tight", label: "Tight" },
              { value: "normal", label: "Normal" },
              { value: "loose", label: "Roomy" },
            ]}
          />
        </div>
      )}
      {has("radius") && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Corners</p>
          <ChoiceGrid
            label="Corners"
            value={o.radius}
            onChange={(v) => set({ radius: v })}
            options={[
              { value: "auto", label: "Match store" },
              { value: "none", label: "Square" },
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
              { value: "full", label: "Round" },
            ]}
          />
        </div>
      )}
      {has("align") && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Alignment</p>
          <Segmented
            label="Alignment"
            value={o.align}
            onChange={(v) => set({ align: v })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Centered" },
            ]}
          />
        </div>
      )}
      {has("textCase") && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Name style</p>
          <Segmented
            label="Name style"
            value={o.textCase}
            onChange={(v) => set({ textCase: v })}
            options={[
              { value: "normal", label: "Normal" },
              { value: "upper", label: "UPPERCASE" },
            ]}
          />
        </div>
      )}
      {has("showCount") && (
        <ToggleRow
          label="Show product count"
          checked={o.showCount}
          onChange={(v) => set({ showCount: v })}
        />
      )}
      {has("showArrow") && (
        <ToggleRow
          label="Show arrow"
          checked={o.showArrow}
          onChange={(v) => set({ showArrow: v })}
        />
      )}
      {has("showImage") && (
        <ToggleRow
          label="Show small photos"
          checked={o.showImage}
          onChange={(v) => set({ showImage: v })}
        />
      )}
      <Button
        type="button"
        variant="ghost"
        className="h-9 px-2 text-xs"
        onClick={reset}
      >
        Reset to this template&apos;s look
      </Button>
    </div>
  );
}
