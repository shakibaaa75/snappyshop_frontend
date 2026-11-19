"use client";

import { useState } from "react";
import { RotateCcw, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  ProductCombination,
  ProductOption,
  ProductOptionValue,
  VariantImageMode,
} from "@/lib/api/products";
import {
  MAX_COMBINATIONS,
  MAX_OPTIONS,
  MAX_VALUES_PER_OPTION,
  MAX_VARIANT_IMAGES,
  adoptGroupImages,
  blockEnterSubmit,
  countCombinations,
  deriveImageGroup,
  hasImageConflict,
  isColorName,
  rebuildCombinations,
  restoreCombinations,
  setGroupImage,
  syncGroupImages,
  uid,
  type ImageGroup,
} from "@/lib/api/product-variants";
import { ImageUploader } from "./ImageUploader";

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const PRESET_COLORS: { label: string; hex: string }[] = [
  { label: "Black", hex: "#1c1c1c" },
  { label: "White", hex: "#ffffff" },
  { label: "Charcoal", hex: "#3f4551" },
  { label: "Cream", hex: "#ece5d8" },
  { label: "Sky Blue", hex: "#a8c0dd" },
  { label: "Navy", hex: "#1e3a8a" },
  { label: "Olive", hex: "#65a30d" },
  { label: "Rose", hex: "#f43f5e" },
  { label: "Red", hex: "#dc2626" },
  { label: "Blue", hex: "#2563eb" },
];

const norm = (s: string) => s.trim().toLowerCase();
const newOption = (name = ""): ProductOption => ({
  id: uid("opt"),
  name,
  values: [],
});

const COLS = "sm:grid-cols-[minmax(0,1.4fr)_90px_110px_minmax(0,1fr)_36px]";

type Props = {
  options: ProductOption[];
  combinations: ProductCombination[];
  basePrice: number;
  variantImageMode: VariantImageMode;
  onChangeOptions: (o: ProductOption[]) => void;
  onChangeCombinations: (c: ProductCombination[]) => void;
  onChangeImageMode: (m: VariantImageMode) => void;
};

export function VariantsEditor({
  options,
  combinations,
  basePrice,
  variantImageMode,
  onChangeOptions,
  onChangeCombinations,
  onChangeImageMode,
}: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [group, setGroup] = useState<ImageGroup>(() =>
    deriveImageGroup(options, combinations, variantImageMode),
  );
  // Once the seller picks a photo style themselves, we stop choosing for them.
  const [chosen, setChosen] = useState(false);

  const withValues = options.filter((o) => o.values.length > 0);

  /** The group actually in effect (an option may have been removed since it was chosen). */
  const effGroup: ImageGroup =
    group === "shared" || group === "each"
      ? group === "each" && withValues.length < 2
        ? withValues.length === 1
          ? withValues[0].id
          : "shared"
        : group
      : withValues.some((o) => o.id === group)
        ? group
        : withValues.length === 1
          ? withValues[0].id
          : withValues.length > 1
            ? "each"
            : "shared";

  const groupOption = withValues.find((o) => o.id === effGroup);

  /** Structure changed (value/option added or removed): rebuild variants, keep their data. */
  const applyStructure = (next: ProductOption[]) => {
    onChangeOptions(next);
    let combos = rebuildCombinations(options, next, combinations);

    let target: ImageGroup = effGroup;
    if (!chosen && effGroup === "shared") {
      // First colour added on a fresh product: photos by colour is almost always what's wanted.
      const color = next.find(
        (o) => isColorName(o.name) && o.values.length > 0,
      );
      if (color) {
        target = color.id;
        setGroup(color.id);
        onChangeImageMode("per-variant");
      }
    }
    if (target !== "shared" && target !== "each")
      combos = syncGroupImages(combos, target);
    onChangeCombinations(combos);
  };

  /* ---------- Step 1: options and values ---------- */

  const addOptions = (names: string[]) => {
    const room = MAX_OPTIONS - options.length;
    if (room <= 0) {
      setNotice(`You can add up to ${MAX_OPTIONS} options.`);
      return;
    }
    setNotice(null);
    onChangeOptions([...options, ...names.slice(0, room).map(newOption)]);
  };

  const renameOption = (id: string, name: string) =>
    onChangeOptions(options.map((o) => (o.id === id ? { ...o, name } : o)));

  const removeOption = (id: string) => {
    setNotice(null);
    applyStructure(options.filter((o) => o.id !== id));
  };

  /** Accepts "S, M, L" or a single label. Skips blanks and duplicates. */
  const addValues = (optionId: string, raw: string, colorHex?: string) => {
    const opt = options.find((o) => o.id === optionId);
    if (!opt) return;
    const labels = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (labels.length === 0) return;

    const values = [...opt.values];
    for (const label of labels) {
      if (values.length >= MAX_VALUES_PER_OPTION) break;
      if (values.some((v) => norm(v.label) === norm(label))) continue;
      values.push({ id: uid("val"), label, colorHex });
    }
    if (values.length === opt.values.length) {
      setNotice(
        values.length >= MAX_VALUES_PER_OPTION
          ? `An option can have up to ${MAX_VALUES_PER_OPTION} values.`
          : null,
      );
      return;
    }
    const next = options.map((o) => (o.id === optionId ? { ...o, values } : o));
    if (countCombinations(next) > MAX_COMBINATIONS) {
      setNotice(
        `That would create more than ${MAX_COMBINATIONS} variants. Remove some values first.`,
      );
      return;
    }
    setNotice(null);
    applyStructure(next);
  };

  /** Label/colour edits don't change which variants exist. */
  const updateValue = (
    optionId: string,
    valueId: string,
    patch: Partial<ProductOptionValue>,
  ) =>
    onChangeOptions(
      options.map((o) =>
        o.id === optionId
          ? {
              ...o,
              values: o.values.map((v) =>
                v.id === valueId ? { ...v, ...patch } : v,
              ),
            }
          : o,
      ),
    );

  const removeValue = (optionId: string, valueId: string) => {
    setNotice(null);
    applyStructure(
      options.map((o) =>
        o.id === optionId
          ? { ...o, values: o.values.filter((v) => v.id !== valueId) }
          : o,
      ),
    );
  };

  /* ---------- Step 2: photos ---------- */

  const chooseGroup = (next: ImageGroup) => {
    setChosen(true);
    if (next === "shared") {
      setGroup("shared");
      onChangeImageMode("shared");
      return;
    }
    if (next !== "each") {
      if (
        hasImageConflict(combinations, next) &&
        !window.confirm(
          "Some variants in the same group have different photos. Use the first set for the whole group?",
        )
      ) {
        return;
      }
      onChangeCombinations(adoptGroupImages(combinations, next));
    }
    setGroup(next);
    onChangeImageMode("per-variant");
  };

  const setComboImage = (c: ProductCombination, slot: number, url: string) => {
    const next = [...c.imageUrls];
    while (next.length < MAX_VARIANT_IMAGES) next.push("");
    next[slot] = url;
    onChangeCombinations(
      combinations.map((x) => (x.id === c.id ? { ...x, imageUrls: next } : x)),
    );
  };

  /* ---------- Step 3: price, stock, SKU ---------- */

  const updateCombination = (id: string, patch: Partial<ProductCombination>) =>
    onChangeCombinations(
      combinations.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );

  const applyToAll = (patch: Partial<ProductCombination>) =>
    onChangeCombinations(combinations.map((c) => ({ ...c, ...patch })));

  const removedCount = Math.max(
    0,
    countCombinations(options) - combinations.length,
  );
  const hasOptions = options.length > 0;

  return (
    <div className="space-y-6" onKeyDown={blockEnterSubmit}>
      {/* ------------------------------------------------ Empty state */}
      {!hasOptions && (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">
            Does this product come in different versions?
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Example: a T-shirt in Red, Black and Blue is{" "}
            <strong>one product</strong> with three colors. Each color gets its
            own photos, price and stock. Skip this section if your product has
            only one version.
          </p>
          <p className="mt-3 text-xs font-medium">
            What changes between versions?
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <QuickStart onClick={() => addOptions(["Color"])}>Color</QuickStart>
            <QuickStart onClick={() => addOptions(["Size"])}>Size</QuickStart>
            <QuickStart onClick={() => addOptions(["Color", "Size"])}>
              Color and Size
            </QuickStart>
            <QuickStart dashed onClick={() => addOptions([""])}>
              Something else
            </QuickStart>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ Step 1 */}
      {hasOptions && (
        <div className="space-y-3">
          <StepHeader
            n={1}
            title="What changes between versions?"
            hint="Name each option, then add its values. Type a value and press Enter, or tap a suggestion."
          />
          {options.map((option, oi) => (
            <OptionCard
              key={option.id}
              index={oi}
              option={option}
              nameTaken={
                !!option.name.trim() &&
                options.some(
                  (o) =>
                    o.id !== option.id && norm(o.name) === norm(option.name),
                )
              }
              onRename={(n) => renameOption(option.id, n)}
              onRemove={() => removeOption(option.id)}
              onAddValues={(raw, hex) => addValues(option.id, raw, hex)}
              onUpdateValue={(vid, patch) => updateValue(option.id, vid, patch)}
              onRemoveValue={(vid) => removeValue(option.id, vid)}
            />
          ))}
          {options.length < MAX_OPTIONS && (
            <div className="flex flex-wrap gap-1.5">
              {["Color", "Size", "Material"]
                .filter((n) => !options.some((o) => norm(o.name) === norm(n)))
                .map((n) => (
                  <QuickStart
                    key={n}
                    dashed
                    muted
                    onClick={() => addOptions([n])}
                  >
                    + {n}
                  </QuickStart>
                ))}
              <QuickStart dashed muted onClick={() => addOptions([""])}>
                + Custom option
              </QuickStart>
            </div>
          )}
        </div>
      )}

      {notice && (
        <p role="alert" className="text-xs text-destructive">
          {notice}
        </p>
      )}

      {/* ------------------------------------------------ Step 2 */}
      {combinations.length > 0 && (
        <div className="space-y-3 border-t pt-5">
          <StepHeader
            n={2}
            title="Photos"
            hint="The first photo is the cover. Shoppers see these photos when they pick that version."
          />

          <div
            role="group"
            aria-label="How do photos differ"
            className="grid gap-2 sm:grid-cols-2"
          >
            <ChoiceCard
              active={effGroup === "shared"}
              onClick={() => chooseGroup("shared")}
              title="Same photos for every version"
              desc="Uses the product gallery above."
            />
            {withValues.map((o) => (
              <ChoiceCard
                key={o.id}
                active={effGroup === o.id}
                onClick={() => chooseGroup(o.id)}
                title={`Different photos for each ${o.name.trim() || "option"}`}
                desc={
                  withValues.length > 1
                    ? `Upload once per ${o.name.trim().toLowerCase() || "value"}. Used for every ${withValues
                        .filter((x) => x.id !== o.id)
                        .map((x) => x.name.trim().toLowerCase() || "option")
                        .join("/")}.`
                    : `One set of photos for each ${o.name.trim().toLowerCase() || "value"}.`
                }
                badge={isColorName(o.name) ? "Recommended" : undefined}
              />
            ))}
            {withValues.length > 1 && (
              <ChoiceCard
                active={effGroup === "each"}
                onClick={() => chooseGroup("each")}
                title="Different photos for every combination"
                desc="Most work. Only if each combination looks unique."
              />
            )}
          </div>

          {groupOption && (
            <div className="grid gap-3 sm:grid-cols-2">
              {groupOption.values.map((v) => {
                const rows = combinations.filter(
                  (c) => c.valueIds[groupOption.id] === v.id,
                );
                if (rows.length === 0) return null;
                return (
                  <PhotoCard
                    key={v.id}
                    title={v.label || "Unnamed"}
                    swatch={v.colorHex}
                    urls={rows[0].imageUrls}
                    note={
                      rows.length > 1
                        ? `Used for ${rows.length} variants`
                        : undefined
                    }
                    onChange={(slot, url) =>
                      onChangeCombinations(
                        setGroupImage(
                          combinations,
                          groupOption.id,
                          v.id,
                          slot,
                          url,
                        ),
                      )
                    }
                  />
                );
              })}
            </div>
          )}

          {effGroup === "each" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {combinations.map((c) => (
                <PhotoCard
                  key={c.id}
                  title={comboLabel(options, c)}
                  urls={c.imageUrls}
                  onChange={(slot, url) => setComboImage(c, slot, url)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ Step 3 */}
      {combinations.length > 0 && (
        <div className="space-y-3 border-t pt-5">
          <StepHeader
            n={3}
            title="Price, stock and SKU"
            hint={`Stock is required for each version. Leave price empty to use the base price${
              basePrice > 0 ? ` (৳${basePrice})` : ""
            }. It is saved with that version, so changing the base price later will not change it.`}
          />

          <BulkRow onApply={applyToAll} />

          <div className="overflow-hidden rounded-lg border">
            <div
              aria-hidden
              className={cn(
                "hidden bg-muted/40 text-[11px] font-medium text-muted-foreground sm:grid sm:gap-2 sm:px-3 sm:py-2",
                COLS,
              )}
            >
              <span>Version</span>
              <span>Stock</span>
              <span>Price</span>
              <span>SKU</span>
              <span />
            </div>

            <ul className="divide-y">
              {combinations.map((c) => {
                const remove = () =>
                  onChangeCombinations(
                    combinations.filter((x) => x.id !== c.id),
                  );
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "grid grid-cols-2 gap-x-2 gap-y-3 p-3 sm:items-center sm:gap-2 sm:py-2.5",
                      COLS,
                    )}
                  >
                    <div className="col-span-2 flex min-w-0 items-start justify-between gap-2 sm:col-span-1">
                      <ComboChips options={options} combo={c} />
                      <RemoveButton onClick={remove} className="sm:hidden" />
                    </div>

                    <Cell label="Stock">
                      <Input
                        type="number"
                        min={0}
                        value={c.stock === 0 ? "" : c.stock}
                        onChange={(e) =>
                          updateCombination(c.id, {
                            stock: Math.max(
                              0,
                              Math.floor(Number(e.target.value) || 0),
                            ),
                          })
                        }
                        placeholder="0"
                        className="h-9 text-sm"
                      />
                    </Cell>

                    <Cell label="Price (৳)">
                      <Input
                        type="number"
                        min={0}
                        value={c.price ? c.price : ""}
                        onChange={(e) =>
                          updateCombination(c.id, {
                            price:
                              Math.max(0, Number(e.target.value) || 0) ||
                              undefined,
                          })
                        }
                        placeholder={basePrice ? `৳${basePrice}` : "Base price"}
                        className="h-9 text-sm"
                      />
                    </Cell>

                    <Cell label="SKU" className="col-span-2 sm:col-span-1">
                      <Input
                        value={c.sku ?? ""}
                        maxLength={40}
                        onChange={(e) =>
                          updateCombination(c.id, { sku: e.target.value })
                        }
                        placeholder="Optional"
                        className="h-9 font-mono text-xs"
                      />
                    </Cell>

                    <RemoveButton onClick={remove} className="hidden sm:flex" />
                  </li>
                );
              })}
            </ul>
          </div>

          {removedCount > 0 && (
            <button
              type="button"
              onClick={() =>
                onChangeCombinations(restoreCombinations(options, combinations))
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-accent"
            >
              <RotateCcw className="h-3 w-3" />
              Restore {removedCount} removed{" "}
              {removedCount === 1 ? "version" : "versions"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */

function comboLabel(options: ProductOption[], c: ProductCombination) {
  return options
    .map((o) => o.values.find((v) => v.id === c.valueIds[o.id])?.label)
    .filter(Boolean)
    .join(" / ");
}

function ComboChips({
  options,
  combo,
}: {
  options: ProductOption[];
  combo: ProductCombination;
}) {
  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {options.map((o) => {
        const value = o.values.find((v) => v.id === combo.valueIds[o.id]);
        if (!value) return null;
        return (
          <span
            key={o.id}
            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
          >
            {value.colorHex && (
              <span
                className="h-2.5 w-2.5 rounded-full border"
                style={{ background: value.colorHex }}
              />
            )}
            <span className="text-muted-foreground">{o.name || "Option"}:</span>
            {value.label || "—"}
          </span>
        );
      })}
    </div>
  );
}

function StepHeader({
  n,
  title,
  hint,
}: {
  n: number;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function QuickStart({
  children,
  onClick,
  dashed,
  muted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  dashed?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition hover:border-accent hover:text-accent",
        dashed && "border-dashed",
        muted && "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ChoiceCard({
  active,
  title,
  desc,
  badge,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition",
        active
          ? "border-accent bg-accent/5 ring-1 ring-accent"
          : "hover:border-accent/50",
      )}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        {title}
        {badge && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
            {badge}
          </span>
        )}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function PhotoCard({
  title,
  swatch,
  urls,
  note,
  onChange,
}: {
  title: string;
  swatch?: string;
  urls: string[];
  note?: string;
  onChange: (slot: number, url: string) => void;
}) {
  const count = urls.filter((u) => u.trim()).length;
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
          {swatch && (
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border"
              style={{ background: swatch }}
            />
          )}
          <span className="truncate">{title}</span>
        </p>
        <span className="shrink-0 text-xs text-muted-foreground">
          {count} of {MAX_VARIANT_IMAGES}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: MAX_VARIANT_IMAGES }, (_, i) => (
          <ImageUploader
            key={i}
            label=""
            value={urls[i] ?? ""}
            onChange={(v) => onChange(i, v)}
            aspect="square"
            compact
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {count === 0
          ? "No photos yet. Shoppers will see the product gallery."
          : note}
      </p>
    </div>
  );
}

function OptionCard({
  index,
  option,
  nameTaken,
  onRename,
  onRemove,
  onAddValues,
  onUpdateValue,
  onRemoveValue,
}: {
  index: number;
  option: ProductOption;
  nameTaken: boolean;
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddValues: (raw: string, colorHex?: string) => void;
  onUpdateValue: (valueId: string, patch: Partial<ProductOptionValue>) => void;
  onRemoveValue: (valueId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const color = isColorName(option.name);
  const size = norm(option.name) === "size";

  const commit = () => {
    onAddValues(draft);
    setDraft("");
  };

  const problem = (v: ProductOptionValue) =>
    !v.label.trim() ||
    option.values.some((o) => o.id !== v.id && norm(o.label) === norm(v.label));

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <label
          htmlFor={`opt-name-${option.id}`}
          className="text-xs font-medium text-muted-foreground"
        >
          Option {index + 1}
        </label>
        <Input
          id={`opt-name-${option.id}`}
          value={option.name}
          maxLength={30}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Color, Size, Material…"
          aria-invalid={nameTaken}
          className={cn(
            "h-8 max-w-[200px] text-sm font-medium",
            nameTaken && "border-destructive",
          )}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove option ${option.name}`}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {nameTaken && (
        <p className="text-xs text-destructive">
          Another option already uses this name.
        </p>
      )}

      {option.values.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {option.values.map((v) => (
            <span
              key={v.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full border bg-background py-1 pl-1.5 pr-1 text-xs font-medium",
                problem(v) && "border-destructive",
              )}
            >
              {color && (
                <span
                  className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full border"
                  style={{ background: v.colorHex || "#888" }}
                >
                  <input
                    type="color"
                    value={v.colorHex || "#888888"}
                    onChange={(e) =>
                      onUpdateValue(v.id, { colorHex: e.target.value })
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label={`${v.label || "Value"} swatch color`}
                  />
                </span>
              )}
              <input
                value={v.label}
                maxLength={40}
                onChange={(e) => onUpdateValue(v.id, { label: e.target.value })}
                placeholder="Value"
                aria-label="Value name"
                aria-invalid={problem(v)}
                className="min-w-0 bg-transparent pl-1 text-xs font-medium outline-none"
                style={{ width: `${Math.max(4, v.label.length + 1)}ch` }}
              />
              <button
                type="button"
                aria-label={`Remove ${v.label || "value"}`}
                onClick={() => onRemoveValue(v.id)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (
            e.key === "Backspace" &&
            !draft &&
            option.values.length > 0
          ) {
            onRemoveValue(option.values[option.values.length - 1].id);
          }
        }}
        onBlur={commit}
        placeholder={
          color
            ? "Type a color and press Enter, e.g. Red"
            : size
              ? "Type a size and press Enter, e.g. M"
              : "Type a value and press Enter, or paste: A, B, C"
        }
        aria-label={`Add a value to ${option.name || "option"}`}
        className="h-9 text-sm"
      />

      {color && (
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.filter(
            (pc) =>
              !option.values.some((v) => norm(v.label) === norm(pc.label)),
          ).map((pc) => (
            <button
              key={pc.label}
              type="button"
              onClick={() => onAddValues(pc.label, pc.hex)}
              className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition hover:border-accent"
            >
              <span
                className="h-3 w-3 rounded-full border"
                style={{ background: pc.hex }}
              />
              {pc.label}
            </button>
          ))}
        </div>
      )}

      {size && (
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SIZES.filter(
            (s) => !option.values.some((v) => norm(v.label) === norm(s)),
          ).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onAddValues(s)}
              className="rounded-md border px-2 py-0.5 text-[11px] font-semibold transition hover:border-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BulkRow({
  onApply,
}: {
  onApply: (patch: Partial<ProductCombination>) => void;
}) {
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const btn =
    "h-9 rounded-md border px-3 text-xs font-medium transition hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-inherit";

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2 rounded-lg bg-muted/40 p-3">
      <div className="flex items-end gap-2">
        <label className="space-y-1">
          <span className="block text-[11px] font-medium text-muted-foreground">
            Same price for all (৳)
          </span>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-9 w-32 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={price === ""}
          className={btn}
          onClick={() => {
            onApply({ price: Math.max(0, Number(price) || 0) || undefined });
            setPrice("");
          }}
        >
          Apply
        </button>
      </div>
      <div className="flex items-end gap-2">
        <label className="space-y-1">
          <span className="block text-[11px] font-medium text-muted-foreground">
            Same stock for all
          </span>
          <Input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="h-9 w-28 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={stock === ""}
          className={btn}
          onClick={() => {
            onApply({ stock: Math.max(0, Math.floor(Number(stock) || 0)) });
            setStock("");
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

/** Label is visible on mobile only; on desktop the table header names the column. */
function Cell({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block space-y-1 sm:space-y-0", className)}>
      <span className="block text-[11px] font-medium text-muted-foreground sm:sr-only">
        {label}
      </span>
      {children}
    </label>
  );
}

function RemoveButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Remove this version"
      onClick={onClick}
      className={cn(
        "h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive",
        className?.includes("hidden") ? className : cn("flex", className),
      )}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export default VariantsEditor;
