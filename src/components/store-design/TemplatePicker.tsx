"use client";

import { useId, useMemo, useState } from "react";
import { ArrowUpRight, Check, Lock, Search, Sparkles } from "lucide-react";
import type {
  Category,
  Product,
  StoreDesign,
  TemplateId,
} from "@/lib/store-design/types";
import {
  storeTemplates,
  type StoreTemplate,
} from "@/lib/store-design/templates";
import {
  getSellingCategory,
  inferSellingCategory,
  normalizeSellingCategory,
  recommendedTemplates,
  sellingCategories,
} from "@/lib/store-design/selling-categories";

/** Lightweight layout illustrations, not live storefronts: no iframes, product
 * fetching, animation, or extra preview trees for every template in the list. */
export function TemplateThumbnail({
  template: t,
}: {
  template: StoreTemplate;
}) {
  const [bg, primary, accent, ink] = t.swatch;
  const family = ["fashion", "boutique", "lookbook", "casual"].includes(t.id)
    ? "editorial"
    : ["tech", "edge"].includes(t.id)
      ? "tech"
      : ["beauty", "skincare"].includes(t.id)
        ? "beauty"
        : ["grocery", "marketplace", "bangla-bazaar"].includes(t.id)
          ? "catalog"
          : ["streetwear", "yokai", "urban", "sport"].includes(t.id)
            ? "bold"
            : ["promo", "night-sale"].includes(t.id)
              ? "sale"
              : t.id === "kids"
                ? "playful"
                : "minimal";
  const centered = ["premium", "boutique", "beauty", "kids"].includes(t.id);
  const tile = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    kind = 0,
  ) => (
    <g key={`${x}-${y}`}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={family === "bold" ? 2 : 5}
        fill={ink}
        opacity=".07"
      />
      {family === "beauty" ? (
        <g fill={color}>
          <rect
            x={x + w * 0.35}
            y={y + h * 0.26}
            width={w * 0.3}
            height={h * 0.55}
            rx="5"
          />
          <rect
            x={x + w * 0.41}
            y={y + h * 0.16}
            width={w * 0.18}
            height={h * 0.14}
            rx="2"
          />
          <rect
            x={x + w * 0.4}
            y={y + h * 0.48}
            width={w * 0.2}
            height={h * 0.15}
            fill={bg}
            opacity=".7"
          />
        </g>
      ) : family === "tech" ? (
        <g>
          <rect
            x={x + w * 0.3}
            y={y + h * 0.15}
            width={w * 0.4}
            height={h * 0.7}
            rx="5"
            fill={color}
          />
          <rect
            x={x + w * 0.34}
            y={y + h * 0.21}
            width={w * 0.32}
            height={h * 0.51}
            rx="2"
            fill={bg}
            opacity=".5"
          />
        </g>
      ) : family === "catalog" || family === "playful" || t.id === "living" ? (
        <g fill={color}>
          <ellipse
            cx={x + w * 0.5}
            cy={y + h * 0.55}
            rx={w * 0.23}
            ry={h * 0.28}
          />
          <path
            d={`M${x + w * 0.5} ${y + h * 0.32} q-${w * 0.12} -${h * 0.18} ${w * 0.09} -${h * 0.15}`}
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
        </g>
      ) : (
        <path
          d={`M${x + w * 0.34} ${y + h * 0.22} L${x + w * 0.18} ${y + h * 0.32} L${x + w * 0.25} ${y + h * 0.48} L${x + w * 0.34} ${y + h * 0.43} V${y + h * 0.8} H${x + w * 0.66} V${y + h * 0.43} L${x + w * 0.75} ${y + h * 0.48} L${x + w * 0.82} ${y + h * 0.32} L${x + w * 0.66} ${y + h * 0.22} Q${x + w * 0.5} ${y + h * (kind ? 0.42 : 0.34)} ${x + w * 0.34} ${y + h * 0.22}`}
          fill={color}
        />
      )}
    </g>
  );
  const lines = (x: number, y: number, wide: number, color = ink) => (
    <g fill={color}>
      <rect x={x} y={y} width={wide} height="5" rx="2" />
      <rect
        x={x}
        y={y + 10}
        width={wide * 0.65}
        height="3"
        rx="1.5"
        opacity=".4"
      />
    </g>
  );
  return (
    <svg
      viewBox="0 0 320 220"
      className="block w-full"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="320" height="220" fill={bg} />
      <rect width="320" height="7" fill={primary} />
      <rect
        x={centered ? 135 : 18}
        y="18"
        width="50"
        height="6"
        rx="2"
        fill={ink}
      />
      <g fill={ink} opacity=".4">
        <circle cx="275" cy="21" r="2.5" />
        <circle cx="288" cy="21" r="2.5" />
        <circle cx="301" cy="21" r="2.5" />
      </g>
      <path d="M18 35H302" stroke={ink} opacity=".12" />
      {family === "editorial" ? (
        <>
          {lines(18, 67, 106)}
          <rect x="18" y="92" width="55" height="16" rx="2" fill={primary} />
          {tile(158, 45, 144, 112, primary)}
          {tile(18, 171, 89, 49, accent)}
          {tile(116, 171, 89, 49, primary, 1)}
          {tile(214, 171, 88, 49, ink)}
        </>
      ) : family === "bold" || family === "sale" ? (
        <>
          <rect
            x="18"
            y="45"
            width="284"
            height="108"
            rx={t.id === "yokai" ? 18 : 3}
            fill={primary}
          />
          {lines(32, 67, 111, bg)}
          <rect x="32" y="98" width="59" height="17" rx="8" fill={accent} />
          {tile(181, 53, 109, 91, accent)}
          <rect x="18" y="160" width="284" height="12" fill={accent} />
          {tile(18, 181, 89, 55, primary)}
          {tile(116, 181, 89, 55, accent)}
          {tile(214, 181, 88, 55, ink)}
        </>
      ) : family === "catalog" ? (
        <>
          <rect
            x="18"
            y="44"
            width="55"
            height="158"
            rx="4"
            fill={ink}
            opacity=".06"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x="26"
              y={56 + i * 18}
              width={i % 2 ? 28 : 37}
              height="4"
              rx="2"
              fill={ink}
              opacity=".35"
            />
          ))}
          <rect x="83" y="44" width="219" height="41" rx="4" fill={primary} />
          {lines(94, 57, 90, bg)}
          {[0, 1, 2].map((i) =>
            tile(83 + i * 75, 96, 69, 49, i % 2 ? accent : primary),
          )}
          {[0, 1, 2].map((i) =>
            tile(83 + i * 75, 156, 69, 49, i % 2 ? primary : accent),
          )}
        </>
      ) : family === "beauty" || family === "tech" ? (
        <>
          <rect
            x="18"
            y="45"
            width="284"
            height="102"
            rx={family === "beauty" ? 24 : 4}
            fill={ink}
            opacity=".05"
          />
          {lines(33, 70, 110)}
          <rect
            x="33"
            y="98"
            width="61"
            height="16"
            rx={family === "beauty" ? 8 : 2}
            fill={primary}
          />
          {tile(180, 50, 112, 91, primary)}
          {tile(18, 161, 89, 59, primary)}
          {tile(116, 161, 89, 59, accent)}
          {tile(214, 161, 88, 59, primary)}
        </>
      ) : (
        <>
          {lines(centered ? 105 : 18, 48, 110)}
          {tile(18, 78, 137, 93, primary)}
          {tile(165, 78, 137, 93, accent, 1)}
          {lines(18, 184, 97)}
          {lines(165, 184, 97)}
          <rect
            x="18"
            y="210"
            width="284"
            height="10"
            fill={ink}
            opacity=".08"
          />
        </>
      )}
    </svg>
  );
}

type Props = {
  design: StoreDesign;
  products: Product[];
  categories: Category[];
  previewTemplate?: TemplateId | null;
  allowed: (id: TemplateId) => boolean;
  onSelect: (template: StoreTemplate) => void;
  onCategoryChange: (category: StoreDesign["sellingCategory"]) => void;
};

export function TemplatePicker({
  design,
  products,
  categories,
  previewTemplate,
  allowed,
  onSelect,
  onCategoryChange,
}: Props) {
  const uid = useId();
  const [filter, setFilter] = useState<"all" | "included">("all");
  const [query, setQuery] = useState("");
  const savedCategory = normalizeSellingCategory(design.sellingCategory);
  const inferredCategory = useMemo(
    () => inferSellingCategory(categories, products),
    [categories, products],
  );
  const category = savedCategory || inferredCategory;
  const ids = recommendedTemplates(category || "general");
  const matches = ids.flatMap((id) => {
    const template = storeTemplates.find((t) => t.id === id);
    return template ? [template] : [];
  });
  const visible = storeTemplates.filter(
    (t) =>
      (filter === "all" || allowed(t.id)) &&
      `${t.name} ${t.blurb}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const card = (t: StoreTemplate, recommended = false) => {
    const selected = (previewTemplate ?? design.template) === t.id;
    const included = allowed(t.id);
    return (
      <button
        key={t.id}
        type="button"
        aria-pressed={selected}
        aria-label={`${t.name}, ${included ? "included in your plan" : "upgrade to publish"}${selected ? ", selected" : ""}`}
        onClick={() => onSelect(t)}
        className={`group min-w-0 overflow-hidden rounded-2xl border bg-background text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${selected ? "border-accent ring-1 ring-accent" : "hover:border-accent/60"}`}
      >
        <span className="relative block overflow-hidden border-b">
          <TemplateThumbnail template={t} />
          {selected && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm">
              <Check className="h-3 w-3" />
              {previewTemplate === t.id ? "Previewing" : "Current template"}
            </span>
          )}
        </span>
        <span className="block space-y-2 p-3 sm:p-4">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">{t.name}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${included ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
            >
              {!included && <Lock className="h-3 w-3" aria-hidden />}
              {included ? "Included" : "Locked"}
            </span>
          </span>
          <span className="block min-h-[2.5rem] text-xs leading-5 text-muted-foreground">
            {t.blurb}
          </span>
          <span className="flex items-center justify-between gap-2 border-t pt-2 text-[11px] font-medium">
            <span>{included ? "Use this layout" : "Preview only"}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </span>
          {recommended && (
            <span className="sr-only">Recommended for your products</span>
          )}
        </span>
      </button>
    );
  };
  return (
    <div className="space-y-7">
      <div className="rounded-2xl border bg-accent/5 p-4">
        <label
          htmlFor={`${uid}-category`}
          className="block text-sm font-semibold"
        >
          What do you sell?
        </label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Recommendations are available on every plan. Choose a category to find
          your best fit.
        </p>
        <select
          id={`${uid}-category`}
          value={category}
          onChange={(e) =>
            onCategoryChange(normalizeSellingCategory(e.target.value))
          }
          className="mt-3 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground"
        >
          <option value="" disabled>
            Choose your main product category
          </option>
          {sellingCategories.map((c) => (
            <option value={c.id} key={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {!savedCategory && inferredCategory && (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Suggested from your products and categories. Choose another category
            if needed.
          </p>
        )}
      </div>

      <section aria-labelledby={`${uid}-recommended`}>
        <div className="mb-4 flex items-start gap-2.5">
          <Sparkles
            className="mt-0.5 h-4 w-4 shrink-0 text-accent"
            aria-hidden
          />
          <div>
            <h3 id={`${uid}-recommended`} className="text-sm font-semibold">
              {category
                ? `Recommended for ${getSellingCategory(category)?.label.toLowerCase()}`
                : "Popular starting points"}
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {category
                ? "Layouts selected for your product category. You can still choose any template below."
                : "Pick a product category above for personalised matches."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
          {matches.map((t) => card(t, true))}
        </div>
      </section>

      <section aria-labelledby={`${uid}-all`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 id={`${uid}-all`} className="text-sm font-semibold">
            Explore all templates
          </h3>
          <span className="text-xs text-muted-foreground">
            {storeTemplates.length} layouts
          </span>
        </div>
        <div className="mb-4 space-y-3">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Template availability"
          >
            {(
              [
                ["all", "All templates"],
                ["included", "Included in my plan"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded-full border px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${filter === value ? "border-foreground bg-foreground text-background" : "bg-background text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            <input
              aria-label="Search templates"
              placeholder="Search templates…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
          {visible.map((t) => card(t))}
        </div>
        {visible.length === 0 && (
          <p
            role="status"
            className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground"
          >
            No matching templates. Try another search or select All templates.
          </p>
        )}
      </section>
      <p className="text-xs leading-5 text-muted-foreground">
        Thumbnails illustrate the layout. Select a template to see it with your
        store content in the live preview. Premium templates can be previewed on
        every plan; publishing them requires an upgrade.
      </p>
    </div>
  );
}
