"use client";

import {
  type HomeSection,
  sectionMeta,
  usesYokaiLayout,
} from "@/lib/store-design/types";
import {
  CategoryPicker,
  ChoiceGrid,
  ImageField,
  Notice,
  ProductPicker,
  Segmented,
  SelectField,
  TextAreaField,
  TextField,
  ToggleRow,
} from "../controls";
import { HeroSlidesEditor } from "../HeroSlideseditor";
import {
  CATEGORY_STYLE_CHOICES,
  CategoryLookEditor,
} from "./category-look-editor";
import { ReviewSettings } from "./review-settings";
import { GallerySettings } from "./gallery-settings";
import { MainBannerDesign } from "./main-banner-design";
import { PromoEditor } from "./promo-editor";
import { type PanelProps } from "./types";

export function SectionSettings({
  section,
  patch,
  panel,
}: {
  section: HomeSection;
  patch: (p: Partial<HomeSection>) => void;
  panel: PanelProps;
}) {
  const { design, update, products, categories } = panel;
  const meta = sectionMeta[section.id];

  const titleField = (
    <TextField
      label="Section title"
      value={section.title}
      onChange={(v) => patch({ title: v })}
      maxLength={50}
    />
  );

  switch (meta.kind) {
    case "reviews":
      return <ReviewSettings {...panel} />;
    case "hero":
      return (
        <div className="space-y-4">
          <p className="text-sm font-semibold">Main banner</p>
          <TextField
            label="Headline"
            value={design.heroTitle}
            onChange={(v) => update({ heroTitle: v })}
            maxLength={70}
          />
          <TextField
            label="Supporting text"
            value={design.heroSubtitle}
            onChange={(v) => update({ heroSubtitle: v })}
            maxLength={140}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Button text"
              value={design.heroButtonText}
              onChange={(v) => update({ heroButtonText: v })}
              maxLength={24}
            />
            <TextField
              label="Button link"
              value={design.heroButtonUrl}
              onChange={(v) => update({ heroButtonUrl: v })}
              placeholder="/products"
            />
          </div>
          <ImageField
            label="Banner image"
            hint="Optional. Without one, your theme colors are used."
            value={design.heroImageUrl}
            onChange={(v) => update({ heroImageUrl: v })}
          />
          <MainBannerDesign design={design} update={update} />

          <div className="border-t pt-4">
            <HeroSlidesEditor design={design} update={update} />
          </div>

          <div className="space-y-3 border-t pt-4">
            <ToggleRow
              label="Slide in promo banners"
              description="Your promo banners become extra slides after your banners."
              checked={design.bannerPromos}
              onChange={(v) => update({ bannerPromos: v })}
            />
            <ToggleRow
              label="Show product thumbnails"
              description="Three small product photos under the text."
              checked={design.bannerProducts}
              onChange={(v) => update({ bannerProducts: v })}
            />
            <ToggleRow
              label="Slide automatically"
              description="Pauses when a shopper touches or hovers the banner."
              checked={design.bannerAutoplay}
              onChange={(v) => update({ bannerAutoplay: v })}
            />
          </div>
        </div>
      );

    case "info":
      return (
        <div className="space-y-4">
          {titleField}
          <Notice>
            Delivery, returns, verified badge and payment methods come from the
            Shop options and Trust panels.
          </Notice>
        </div>
      );

    case "categories":
      return (
        <div className="space-y-4">
          {titleField}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Which categories</p>
            <Segmented
              label="Category source"
              value={design.categoriesSource}
              onChange={(v) => update({ categoriesSource: v })}
              options={[
                { value: "auto", label: "Top selling" },
                { value: "manual", label: "I'll choose" },
              ]}
            />
          </div>
          {design.categoriesSource === "manual" ? (
            <CategoryPicker
              categories={categories}
              products={products}
              selectedIds={design.categoryIds}
              onChange={(ids) => update({ categoryIds: ids })}
            />
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">How many</p>
              <Segmented
                label="Category count"
                value={design.categoryLimit}
                onChange={(v) => update({ categoryLimit: v })}
                options={[3, 4, 5, 6].map((n) => ({
                  value: n,
                  label: String(n),
                }))}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Style</p>
            <ChoiceGrid
              label="Category style"
              value={design.categoryStyle}
              onChange={(v) => update({ categoryStyle: v })}
              options={CATEGORY_STYLE_CHOICES}
            />
          </div>
          <CategoryLookEditor design={design} update={update} />
        </div>
      );

    case "products":
      return (
        <div className="space-y-4">
          {titleField}
          {usesYokaiLayout(design) && (
            <TextField
              label="Line under the title"
              value={section.subtitle ?? ""}
              onChange={(v) => patch({ subtitle: v })}
              maxLength={90}
              placeholder="A quick edit of standout pieces"
            />
          )}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Which products</p>
            <Segmented
              label="Product source"
              value={section.source}
              onChange={(v) => patch({ source: v })}
              options={[
                { value: "auto", label: "Automatic" },
                { value: "manual", label: "I'll choose" },
              ]}
            />
          </div>
          {section.source === "manual" ? (
            <ProductPicker
              label={meta.label}
              products={products}
              categories={categories}
              selectedIds={section.productIds}
              onChange={(ids) => patch({ productIds: ids })}
              max={12}
            />
          ) : (
            <>
              {meta.autoHint && (
                <p className="text-xs leading-5 text-muted-foreground">
                  {meta.autoHint}
                </p>
              )}
              <div className="space-y-1.5">
                <p className="text-sm font-medium">How many</p>
                <Segmented
                  label="Product count"
                  value={section.limit}
                  onChange={(v) => patch({ limit: v })}
                  options={[4, 8, 12].map((n) => ({
                    value: n,
                    label: String(n),
                  }))}
                />
              </div>
            </>
          )}
        </div>
      );

    case "spotlight":
      return (
        <div className="space-y-4">
          {titleField}
          <SelectField
            label="Category to highlight"
            hint="Your top selling category is worked out from verified completed orders."
            value={design.spotlightCategoryId}
            onChange={(v) => update({ spotlightCategoryId: v })}
            options={[
              { value: "auto", label: "Automatic: my top selling category" },
              ...categories.map((c) => ({
                value: c.id,
                label: `${c.emoji} ${c.name}`,
              })),
            ]}
          />
          <div className="space-y-1.5">
            <p className="text-sm font-medium">How many products</p>
            <Segmented
              label="Product count"
              value={section.limit}
              onChange={(v) => patch({ limit: v })}
              options={[4, 8].map((n) => ({ value: n, label: String(n) }))}
            />
          </div>
        </div>
      );

    case "promo":
      return (
        <div className="space-y-4">
          {titleField}
          <PromoEditor design={design} update={update} />
        </div>
      );

    case "all":
      return (
        <div className="space-y-4">
          {titleField}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Products shown before &quot;Load more&quot;
            </p>
            <Segmented
              label="Product count"
              value={section.limit}
              onChange={(v) => patch({ limit: v })}
              options={[8, 12, 16, 24].map((n) => ({
                value: n,
                label: String(n),
              }))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Sorting, filters and pinned products are in Shop options.
          </p>
        </div>
      );

    case "gallery":
      return (
        <GallerySettings
          titleNode={titleField}
          design={design}
          update={update}
        />
      );

    case "countdown":
      return (
        <div className="space-y-4">
          {titleField}
          <TextField
            label="Offer ends"
            type="datetime-local"
            value={design.countdownEndsAt}
            onChange={(v) => update({ countdownEndsAt: v })}
            hint="The timer hides itself once this time passes."
          />
          <TextField
            label="Message"
            value={design.countdownSubtitle}
            onChange={(v) => update({ countdownSubtitle: v })}
            maxLength={90}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Button text"
              value={design.countdownButtonText}
              onChange={(v) => update({ countdownButtonText: v })}
              maxLength={24}
            />
            <TextField
              label="Button link"
              value={design.countdownButtonUrl}
              onChange={(v) => update({ countdownButtonUrl: v })}
              placeholder="Leave empty for all products"
            />
          </div>
        </div>
      );

    case "story":
      return (
        <div className="space-y-4">
          {titleField}
          <TextAreaField
            label="Your story"
            value={design.storyText}
            onChange={(v) => update({ storyText: v })}
            rows={5}
            maxLength={500}
            hint="Who you are and why shoppers can trust you."
          />
        </div>
      );

    default:
      return null;
  }
}
