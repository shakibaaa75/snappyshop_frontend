"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type {
  HeroAlign,
  HeroButtonShape,
  HeroButtonStyle,
  HeroFocus,
  HeroLayout,
  HeroRadius,
  HeroSize,
  HeroStyle,
  HeroValign,
  BannerTone,
} from "@/lib/store-design/types";
import {
  ChoiceGrid,
  ColorField,
  Segmented,
  TextField,
  ToggleRow,
} from "./controls";

const Box = ({ className }: { className?: string }) => (
  <span className={`block rounded-sm bg-foreground/25 ${className ?? ""}`} />
);

const Row = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <p className="text-sm font-medium">{title}</p>
    {children}
  </div>
);

/**
 * Design controls for ONE banner.
 * Save as: components/store-design/HeroStyleEditor.tsx (next to controls.tsx)
 *
 * `value` is the banner's current look (already merged with defaults).
 * `onChange` receives only what the seller just changed.
 */
export function HeroStyleEditor({
  value,
  onChange,
}: {
  value: HeroStyle;
  onChange: (patch: Partial<HeroStyle>) => void;
}) {
  const layout: HeroLayout = value.layout ?? "split";
  const usesPhoto =
    layout === "image" ||
    layout === "card" ||
    layout === "split" ||
    layout === "stacked";
  const hasOverlay = layout === "image" || layout === "card";
  const hasCustomColors = !!(
    value.textColor ||
    value.bgColor ||
    value.bgColor2
  );

  return (
    <div className="space-y-5">
      <Row title="Layout">
        <ChoiceGrid<HeroLayout>
          label="Banner layout"
          cols={4}
          value={layout}
          onChange={(v) => onChange({ layout: v })}
          options={[
            {
              value: "split",
              label: "Split",
              preview: (
                <span className="flex h-8 w-full items-center gap-1">
                  <span className="flex flex-1 flex-col gap-1">
                    <Box className="h-1.5 w-full" />
                    <Box className="h-1.5 w-2/3" />
                  </span>
                  <Box className="h-8 w-6" />
                </span>
              ),
            },
            {
              value: "centered",
              label: "Centered",
              preview: (
                <span className="flex h-8 w-full flex-col items-center justify-center gap-1">
                  <Box className="h-1.5 w-2/3" />
                  <Box className="h-1.5 w-1/3" />
                </span>
              ),
            },
            {
              value: "image",
              label: "Full photo",
              preview: (
                <span className="flex h-8 w-full items-end rounded-sm bg-foreground/60 p-1">
                  <Box className="h-1.5 w-1/2 bg-background/80" />
                </span>
              ),
            },
            {
              value: "stacked",
              label: "Photo top",
              preview: (
                <span className="flex h-8 w-full flex-col gap-1">
                  <Box className="h-4 w-full bg-foreground/50" />
                  <Box className="h-1.5 w-2/3" />
                </span>
              ),
            },
            {
              value: "card",
              label: "Card",
              preview: (
                <span className="flex h-8 w-full items-center rounded-sm bg-foreground/50 p-1">
                  <span className="flex h-6 w-3/5 flex-col justify-center gap-1 rounded-sm bg-background p-1">
                    <Box className="h-1 w-full" />
                    <Box className="h-1 w-2/3" />
                  </span>
                </span>
              ),
            },
            {
              value: "minimal",
              label: "Text only",
              preview: (
                <span className="flex h-8 w-full flex-col items-start justify-center gap-1">
                  <Box className="h-2 w-5/6" />
                  <Box className="h-1 w-1/2" />
                </span>
              ),
            },
            {
              value: "showcase",
              label: "Products",
              preview: (
                <span className="flex h-8 w-full items-center gap-1">
                  <span className="flex flex-1 flex-col gap-1">
                    <Box className="h-1.5 w-full" />
                    <Box className="h-1.5 w-2/3" />
                  </span>
                  <span className="grid h-8 w-8 grid-cols-2 gap-0.5">
                    <Box className="h-full" />
                    <Box className="h-full" />
                    <Box className="h-full" />
                    <Box className="h-full" />
                  </span>
                </span>
              ),
            },
          ]}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          {layout === "minimal"
            ? "Text only ignores the banner photo."
            : layout === "showcase"
              ? "Shows your first four products next to the text. Needs at least one product."
              : layout === "image"
                ? "Full photo needs a banner image. Without one it falls back to Split."
                : "Pick how the text and photo are arranged."}
        </p>
      </Row>

      <Row title="Style">
        <ChoiceGrid<BannerTone>
          label="Banner style"
          value={value.tone ?? "dark"}
          onChange={(v) => onChange({ tone: v })}
          options={[
            {
              value: "dark",
              label: "Dark",
              preview: (
                <span className="block h-8 w-full rounded-md bg-black" />
              ),
            },
            {
              value: "brand",
              label: "Brand color",
              preview: (
                <span className="block h-8 w-full rounded-md bg-accent" />
              ),
            },
            {
              value: "light",
              label: "Light",
              preview: (
                <span className="block h-8 w-full rounded-md border bg-foreground/5" />
              ),
            },
          ]}
        />
      </Row>

      <TextField
        label="Badge"
        hint="Small label above the headline."
        value={value.badge ?? ""}
        onChange={(v) => onChange({ badge: v })}
        maxLength={24}
        placeholder="NEW, -30%, Eid sale…"
      />

      <Row title="Text alignment">
        <Segmented<HeroAlign>
          label="Text alignment"
          value={
            value.align ??
            (layout === "centered" || layout === "minimal" ? "center" : "left")
          }
          onChange={(v) => onChange({ align: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
        />
      </Row>

      <Row title="Text position">
        <Segmented<HeroValign>
          label="Text position"
          value={value.valign ?? (layout === "image" ? "bottom" : "middle")}
          onChange={(v) => onChange({ valign: v })}
          options={[
            { value: "top", label: "Top" },
            { value: "middle", label: "Middle" },
            { value: "bottom", label: "Bottom" },
          ]}
        />
      </Row>

      <Row title="Headline size">
        <Segmented<HeroSize>
          label="Headline size"
          value={value.titleSize ?? "md"}
          onChange={(v) => onChange({ titleSize: v })}
          options={[
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
            { value: "xl", label: "Huge" },
          ]}
        />
      </Row>

      <Row title="Banner height">
        <Segmented<HeroSize>
          label="Banner height"
          value={value.height ?? "md"}
          onChange={(v) => onChange({ height: v })}
          options={[
            { value: "sm", label: "Short" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Tall" },
            { value: "xl", label: "Huge" },
          ]}
        />
      </Row>

      <Row title="Corners">
        <Segmented<HeroRadius>
          label="Banner corners"
          value={value.radius ?? "xl"}
          onChange={(v) => onChange({ radius: v })}
          options={[
            { value: "none", label: "Square" },
            { value: "md", label: "Soft" },
            { value: "lg", label: "Round" },
            { value: "xl", label: "Extra" },
          ]}
        />
      </Row>

      {usesPhoto && (
        <Row title="Photo focus">
          <Segmented<HeroFocus>
            label="Photo focus"
            value={value.imageFocus ?? "center"}
            onChange={(v) => onChange({ imageFocus: v })}
            options={[
              { value: "top", label: "Top" },
              { value: "center", label: "Center" },
              { value: "bottom", label: "Bottom" },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Choose which part of the photo stays visible when it is cropped.
          </p>
        </Row>
      )}

      {hasOverlay && (
        <Row title="Dark overlay on the photo">
          <Segmented<number>
            label="Image overlay"
            value={value.overlay ?? 70}
            onChange={(v) => onChange({ overlay: v })}
            options={[
              { value: 0, label: "None" },
              { value: 35, label: "Light" },
              { value: 55, label: "Medium" },
              { value: 70, label: "Strong" },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            A stronger overlay makes white text easier to read on busy photos.
          </p>
        </Row>
      )}

      <Row title="Button style">
        <Segmented<HeroButtonStyle>
          label="Button style"
          value={value.buttonStyle ?? "solid"}
          onChange={(v) => onChange({ buttonStyle: v })}
          options={[
            { value: "solid", label: "Solid" },
            { value: "outline", label: "Outline" },
            { value: "soft", label: "Soft" },
            { value: "brand", label: "Brand" },
          ]}
        />
      </Row>

      <Row title="Button shape">
        <Segmented<HeroButtonShape>
          label="Button shape"
          value={value.buttonShape ?? "pill"}
          onChange={(v) => onChange({ buttonShape: v })}
          options={[
            { value: "pill", label: "Pill" },
            { value: "rounded", label: "Rounded" },
            { value: "square", label: "Square" },
          ]}
        />
      </Row>

      <ToggleRow
        label="Show store name"
        description="Small store name above the headline."
        checked={value.showStoreName !== false}
        onChange={(v) => onChange({ showStoreName: v })}
      />

      <div className="space-y-3 rounded-xl border p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Custom colors</p>
          {hasCustomColors && (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() =>
                onChange({ textColor: "", bgColor: "", bgColor2: "" })
              }
            >
              Use automatic colors
            </Button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Text color"
            hint={value.textColor ? undefined : "Automatic"}
            value={value.textColor || "#ffffff"}
            onChange={(v) => onChange({ textColor: v })}
          />
          <ColorField
            label="Background color"
            hint={value.bgColor ? undefined : "Automatic"}
            value={value.bgColor || "#111113"}
            onChange={(v) => onChange({ bgColor: v })}
          />
        </div>
        {value.bgColor && (
          <div className="space-y-2">
            <ColorField
              label="Gradient end color"
              hint={value.bgColor2 ? undefined : "None (solid color)"}
              value={value.bgColor2 || value.bgColor}
              onChange={(v) => onChange({ bgColor2: v })}
            />
            {value.bgColor2 && (
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-2 text-xs"
                onClick={() => onChange({ bgColor2: "" })}
              >
                Remove gradient
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
