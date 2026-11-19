"use client";

import { useEffect } from "react";
import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { LockBadge, useUpgradeHref } from "@/components/seller/plan-lock";
import { useEntitlements } from "@/lib/query/entitlements";
import {
  premiumDesignAllowed,
  templateAllowed,
  themeAllowed,
} from "@/lib/subscription";
import { cn } from "@/lib/utils";
import {
  applyColorway,
  applyTemplate,
  getTemplate,
  getVariants,
} from "@/lib/store-design/templates";
import {
  fontOptions,
  type StoreDesign,
  themePresets,
} from "@/lib/store-design/types";
import { contrastRatio, loadFont } from "@/lib/store-design/utilts";
import { ColorField, Notice, Panel, Segmented } from "../controls";
import { TemplatePicker } from "../TemplatePicker";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

export function ThemePanel({
  design,
  products,
  categories,
  update,
  previewTemplate,
  onPreviewTemplate,
}: PanelProps) {
  const { entitlements } = useEntitlements();
  const upgradeHref = useUpgradeHref();
  const lockedCount = themePresets.filter(
    (p) => !themeAllowed(entitlements, p.id),
  ).length;

  useEffect(() => {
    fontOptions.forEach((f) => loadFont(f.id));
  }, []);

  const textContrast = contrastRatio(design.textColor, design.bgColor);
  const linkContrast = contrastRatio(design.primaryColor, design.bgColor);

  const colors = [
    {
      key: "primaryColor",
      label: "Main color",
      hint: "Buttons, links and highlights",
    },
    {
      key: "secondaryColor",
      label: "Accent color",
      hint: "Sale badges and small details",
    },
    { key: "bgColor", label: "Background", hint: "Your page background" },
    { key: "textColor", label: "Text", hint: "Headings and body text" },
  ] as const;

  return (
    <div className="space-y-5">
      <Panel
        title="Template"
        description="Changes the layout, colors, font and product cards. Your name, logo, text and products stay as they are, and you can still edit everything below."
      >
        <TemplatePicker
          design={design}
          products={products}
          categories={categories}
          previewTemplate={previewTemplate}
          allowed={(id) => templateAllowed(entitlements, id)}
          onCategoryChange={(sellingCategory) => update({ sellingCategory })}
          onSelect={(t) => {
            const locked = !templateAllowed(entitlements, t.id);
            loadFont(t.patch.fontFamily ?? design.fontFamily);
            if (locked) {
              onPreviewTemplate?.(t.id);
              return;
            }
            onPreviewTemplate?.(null);
            const next = applyTemplate(design, t.id);
            if (!premiumDesignAllowed(entitlements)) {
              // Template bundles include a gallery, but choosing a free
              // template must not enable a separately paid feature.
              next.sections = next.sections.map((section) =>
                section.id === "gallery"
                  ? { ...section, enabled: false }
                  : section,
              );
              if (next.cardVariant === "grid") next.cardVariant = "classic";
              // Reapplying the same template must not count as a paid
              // section rearrangement on the server.
              if (design.template === t.id) {
                const sections = new Map(
                  next.sections.map((section) => [section.id, section]),
                );
                const existing = new Set(
                  design.sections.map((section) => section.id),
                );
                next.sections = [
                  ...design.sections.map(
                    (section) => sections.get(section.id) ?? section,
                  ),
                  ...next.sections.filter(
                    (section) => !existing.has(section.id),
                  ),
                ];
              }
            }
            update(next);
          }}
        />

        {(() => {
          const t = getTemplate(design.template);
          if (!t || !templateAllowed(entitlements, t.id)) return null;
          const variants = getVariants(t);
          if (variants.length < 2) return null;
          return (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">{t.name} colors</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const on =
                    v.patch.primaryColor === design.primaryColor &&
                    v.patch.bgColor === design.bgColor;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={on}
                      title={v.name}
                      onClick={() => update(applyColorway(design, t.id, v.id))}
                      className={cn(
                        "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        on
                          ? "border-accent ring-1 ring-accent"
                          : "hover:border-accent/50",
                      )}
                    >
                      <span
                        className="relative h-6 w-6 overflow-hidden rounded-full border"
                        style={{ background: v.swatch[0] }}
                      >
                        <span
                          className="absolute inset-y-0 right-0 w-1/2"
                          style={{ background: v.swatch[1] }}
                        />
                      </span>
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Panel>

      <Panel
        title="Color theme"
        description="Start with a theme, then fine-tune below."
      >
        {lockedCount > 0 && (
          <p className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="flex-1">
              Your plan includes the first {themePresets.length - lockedCount}{" "}
              themes. The rest are locked.
            </span>
            <Link href={upgradeHref} className="font-semibold underline">
              Upgrade
            </Link>
          </p>
        )}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {themePresets.map((p) => {
            const active = design.themePreset === p.id;
            const locked = !themeAllowed(entitlements, p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                disabled={locked}
                aria-disabled={locked}
                title={
                  locked
                    ? "Locked: upgrade your plan to use this theme"
                    : undefined
                }
                onClick={() =>
                  !locked &&
                  update({
                    themePreset: p.id,
                    primaryColor: p.primary,
                    secondaryColor: p.secondary,
                    bgColor: p.bg,
                    textColor: p.text,
                  })
                }
                className={cn(
                  "relative space-y-2 rounded-xl border p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-accent ring-1 ring-accent"
                    : "hover:border-accent/50",
                  locked && "cursor-not-allowed opacity-60 hover:border-border",
                )}
              >
                {locked && (
                  <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow ring-1 ring-border">
                    <Lock
                      className="h-3.5 w-3.5 text-amber-700"
                      aria-label="Locked"
                    />
                  </span>
                )}
                <span
                  className="flex h-12 items-center gap-1.5 rounded-lg border px-2.5"
                  style={{ background: p.bg }}
                >
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{ background: p.primary }}
                  />
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: p.secondary }}
                  />
                  <span
                    className="ml-auto h-1.5 w-6 rounded"
                    style={{ background: p.text, opacity: 0.5 }}
                  />
                </span>
                <span className="flex items-center justify-between px-0.5 text-xs font-medium">
                  {p.name}
                  {active && <Check className="h-3.5 w-3.5 text-accent" />}
                  {locked && <LockBadge />}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Custom colors">
        <div className="grid gap-4 sm:grid-cols-2">
          {colors.map((c) => (
            <ColorField
              key={c.key}
              label={c.label}
              hint={c.hint}
              value={design[c.key]}
              onChange={(v) =>
                update({
                  [c.key]: v,
                  themePreset: "custom",
                } as Partial<StoreDesign>)
              }
            />
          ))}
        </div>
        {(textContrast < 4.5 || linkContrast < 3) && (
          <Notice tone="warning">
            {textContrast < 4.5
              ? "Your text and background colors are too similar, so some shoppers will find it hard to read. "
              : "Your main color is hard to see on your background, so links may be hard to spot. "}
            Try a darker or lighter color.
          </Notice>
        )}
        <p className="text-xs text-muted-foreground">
          Button text switches between white and black automatically so it stays
          readable.
        </p>
      </Panel>

      <Panel
        title="Font"
        description="Hind Siliguri works well for Bangla and English."
      >
        <div className="grid grid-cols-2 gap-2.5">
          {fontOptions.map((f) => {
            const active = design.fontFamily === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => update({ fontFamily: f.id })}
                className={cn(
                  "rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-accent bg-accent/5 ring-1 ring-accent"
                    : "hover:border-accent/50",
                )}
                style={{ fontFamily: f.stack }}
              >
                <span className="block text-2xl leading-none">
                  {f.sample ?? "Aa"}
                </span>
                <span className="mt-2 block text-xs text-muted-foreground">
                  {f.id}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Shape and style">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Button corners</p>
          <Segmented
            label="Button corners"
            value={design.buttonRadius}
            onChange={(v) => update({ buttonRadius: v })}
            options={[
              { value: "none", label: "Square" },
              { value: "sm", label: "Slight" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Round" },
              { value: "full", label: "Pill" },
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}
