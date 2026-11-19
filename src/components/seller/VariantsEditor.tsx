"use client";

import { useState } from "react";
import {
  Check,
  Palette,
  Plus,
  RotateCcw,
  Ruler,
  Tag,
  Trash2,
  X,
} from "lucide-react";
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
  blockEnterSubmit,
  countCombinations,
  isColorName,
  rebuildCombinations,
  restoreCombinations,
  uid,
} from "@/lib/api/product-variants";
import {
  inheritScopedImages,
  orderedOptions,
  readAssignments,
  type PhotoSlice,
} from "@/lib/api/product-gallery";

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

const plural = (name: string) => {
  const n = name.trim() || "Value";
  return /s$/i.test(n) ? n : `${n}s`;
};

const COLS = "sm:grid-cols-[minmax(0,1.4fr)_90px_110px_minmax(0,1fr)_36px]";

type Props = {
  options: ProductOption[];
  combinations: ProductCombination[];
  basePrice: number;
  variantImageMode: VariantImageMode;
  onChangeOptions: (o: ProductOption[]) => void;
  onChangeCombinations: (c: ProductCombination[]) => void;
  /** No longer used: photo mode is set when a photo is linked to a variant. */
  onChangeImageMode?: (m: VariantImageMode) => void;
  /** Scrolls up to the Product photos section, where photos are linked to variants. */
  onManagePhotos?: () => void;
};

export function VariantsEditor({
  options,
  combinations,
  basePrice,
  variantImageMode,
  onChangeOptions,
  onChangeCombinations,
  onManagePhotos,
}: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingOption, setAddingOption] = useState(false);

  const activeOption = options.find((o) => o.id === activeId) ?? options[0];

  /** Structure changed (value/option added or removed): rebuild variants, keep their data. */
  const applyStructure = (next: ProductOption[]) => {
    onChangeOptions(next);
    // Photos linked to a color/size follow to any new rows (a new size of
    // "Red" starts with Red's photos), so nothing is assigned twice.
    const before: PhotoSlice = {
      mainImageUrl: "",
      imageUrls: [],
      options,
      combinations,
      variantImageMode,
    };
    onChangeCombinations(
      inheritScopedImages(
        before,
        rebuildCombinations(options, next, combinations),
      ),
    );
  };

  /* ---------- Options and values ---------- */

  const addOptions = (names: string[]) => {
    const room = MAX_OPTIONS - options.length;
    if (room <= 0) {
      setNotice(`You can add up to ${MAX_OPTIONS} options.`);
      return;
    }
    setNotice(null);
    const created = names.slice(0, room).map(newOption);
    onChangeOptions([...options, ...created]);
    if (created[0]) setActiveId(created[0].id);
    setAddingOption(false);
  };

  const renameOption = (id: string, name: string) =>
    onChangeOptions(options.map((o) => (o.id === id ? { ...o, name } : o)));

  const removeOption = (id: string) => {
    setNotice(null);
    setActiveId(null);
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

  /* ---------- Price, stock, SKU ---------- */

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

  // How many photos each value of the main photo option has (read-only here).
  const photoOption = orderedOptions(options)[0];
  const photoAssignments = readAssignments({
    mainImageUrl: "",
    imageUrls: [],
    options,
    combinations,
    variantImageMode,
  });
  const photoCounts = photoOption
    ? photoOption.values.map((v) => ({
        id: v.id,
        label: v.label.trim() || "Unnamed",
        hex: v.colorHex,
        count: [...photoAssignments.values()].filter(
          (a) => a.optionId === photoOption.id && a.valueId === v.id,
        ).length,
      }))
    : [];

  return (
    <div className="space-y-6" onKeyDown={blockEnterSubmit}>
      {/* ------------------------------------------------ Empty state */}
      {!hasOptions && (
        <div className="rounded-xl border border-dashed p-4">
          <p className="text-sm font-medium">What changes between versions?</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Example: a T-shirt in Red, Black and Blue is{" "}
            <strong>one product</strong> with three colors. Each color can have
            its own photos, price and stock.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
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

      {hasOptions && activeOption && (
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-0">
          {/* ---------------------------------------------- Options */}
          <div className="min-w-0 space-y-4 lg:pr-6">
            <div className="flex flex-wrap items-center gap-2">
              {options.map((o) => {
                const on = o.id === activeOption.id;
                const Icon = isColorName(o.name)
                  ? Palette
                  : norm(o.name) === "size"
                    ? Ruler
                    : Tag;
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setActiveId(o.id)}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
                      on
                        ? "border-accent bg-accent/10 text-accent ring-1 ring-accent"
                        : "hover:border-accent/60",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {o.name.trim() || "Option"} ({o.values.length})
                  </button>
                );
              })}

              {options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={() => setAddingOption((v) => !v)}
                  aria-expanded={addingOption}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition hover:border-accent hover:text-accent"
                >
                  <Plus className="h-4 w-4" /> Add variant
                </button>
              )}
            </div>

            {addingOption && (
              <div className="flex flex-wrap gap-1.5 rounded-lg bg-muted/40 p-2.5">
                {["Color", "Size", "Material", "Style"]
                  .filter((n) => !options.some((o) => norm(o.name) === norm(n)))
                  .map((n) => (
                    <QuickStart key={n} onClick={() => addOptions([n])}>
                      {n}
                    </QuickStart>
                  ))}
                <QuickStart dashed onClick={() => addOptions([""])}>
                  Custom…
                </QuickStart>
              </div>
            )}

            <OptionPanel
              key={activeOption.id}
              option={activeOption}
              nameTaken={
                !!activeOption.name.trim() &&
                options.some(
                  (o) =>
                    o.id !== activeOption.id &&
                    norm(o.name) === norm(activeOption.name),
                )
              }
              onRename={(n) => renameOption(activeOption.id, n)}
              onRemove={() => removeOption(activeOption.id)}
              onAddValues={(raw, hex) => addValues(activeOption.id, raw, hex)}
              onUpdateValue={(vid, patch) =>
                updateValue(activeOption.id, vid, patch)
              }
              onRemoveValue={(vid) => removeValue(activeOption.id, vid)}
            />
          </div>

          {/* ---------------------------------------------- Photos live in the gallery */}
          <div className="min-w-0 space-y-3 lg:border-l lg:pl-6">
            <div>
              <h3 className="text-sm font-semibold">Variant photos</h3>
              <p className="text-xs text-muted-foreground">
                Managed in Product photos
              </p>
            </div>

            <div className="rounded-xl border border-dashed p-4">
              <p className="text-sm font-medium">One gallery for all photos</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Upload each photo once in Product photos, then link it to a
                variant there. Pick a variant in the gallery filter to see its
                photos, or change a photo&apos;s variant without uploading it
                again.
              </p>
              {onManagePhotos && (
                <button
                  type="button"
                  onClick={onManagePhotos}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-accent hover:text-accent"
                >
                  Open product photos
                </button>
              )}
            </div>

            {photoCounts.length > 0 && (
              <ul className="divide-y rounded-xl border">
                {photoCounts.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm"
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border bg-muted"
                      style={v.hex ? { background: v.hex } : undefined}
                    />
                    <span className="min-w-0 flex-1 truncate">{v.label}</span>
                    <span
                      className={cn(
                        "text-xs",
                        v.count === 0 ? "text-muted-foreground" : "text-accent",
                      )}
                    >
                      {v.count === 0
                        ? "No photos yet"
                        : `${v.count} ${v.count === 1 ? "photo" : "photos"}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {notice && (
        <p role="alert" className="text-xs text-destructive">
          {notice}
        </p>
      )}

      {/* ------------------------------------------------ Price, stock, SKU */}
      {combinations.length > 0 && (
        <div className="space-y-3 border-t pt-5">
          <div>
            <h3 className="text-sm font-semibold">Price, stock &amp; SKU</h3>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Stock is required for each version. Leave price empty to use the
              base price{basePrice > 0 ? ` (৳${basePrice})` : ""}.
            </p>
          </div>

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
                onChangeCombinations(
                  inheritScopedImages(
                    {
                      mainImageUrl: "",
                      imageUrls: [],
                      options,
                      combinations,
                      variantImageMode,
                    },
                    restoreCombinations(options, combinations),
                  ),
                )
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

function QuickStart({
  children,
  onClick,
  dashed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  dashed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border bg-background px-3 py-1 text-xs font-medium transition hover:border-accent hover:text-accent",
        dashed && "border-dashed",
      )}
    >
      {children}
    </button>
  );
}

/** One option (Color, Size…): its name, its values as chips, and an add box. */
function OptionPanel({
  option,
  nameTaken,
  onRename,
  onRemove,
  onAddValues,
  onUpdateValue,
  onRemoveValue,
}: {
  option: ProductOption;
  nameTaken: boolean;
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddValues: (raw: string, colorHex?: string) => void;
  onUpdateValue: (valueId: string, patch: Partial<ProductOptionValue>) => void;
  onRemoveValue: (valueId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(option.values.length === 0);
  const color = isColorName(option.name);
  const size = norm(option.name) === "size";
  const singular = option.name.trim().toLowerCase() || "value";

  const commit = () => {
    onAddValues(draft);
    setDraft("");
  };

  const problem = (v: ProductOptionValue) =>
    !v.label.trim() ||
    option.values.some((o) => o.id !== v.id && norm(o.label) === norm(v.label));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">
          {plural(option.name)} ({option.values.length})
        </h3>
        <Input
          value={option.name}
          maxLength={30}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Name: Color, Size…"
          aria-label="Option name"
          aria-invalid={nameTaken}
          className={cn(
            "ml-auto h-8 max-w-[170px] text-xs",
            nameTaken && "border-destructive",
          )}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${option.name || "this option"}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {nameTaken && (
        <p className="text-xs text-destructive">
          Another option already uses this name.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {option.values.map((v) => (
          <span
            key={v.id}
            className={cn(
              "flex h-10 items-center gap-2 rounded-full border bg-background pl-2 pr-1.5 text-sm font-medium",
              problem(v) && "border-destructive",
            )}
          >
            {color && (
              <span
                className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border"
                style={{ background: v.colorHex || "#888" }}
                title="Change swatch color"
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
              className="min-w-0 bg-transparent text-sm font-medium outline-none"
              style={{ width: `${Math.max(4, v.label.length + 1)}ch` }}
            />
            <button
              type="button"
              aria-label={`Remove ${v.label || "value"}`}
              onClick={() => onRemoveValue(v.id)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-dashed px-4 text-sm font-medium text-muted-foreground transition hover:border-accent hover:text-accent"
          >
            <Plus className="h-4 w-4" /> Add {singular}
          </button>
        )}
      </div>

      {adding && (
        <div className="space-y-2.5 rounded-xl bg-muted/40 p-3">
          <Input
            autoFocus={option.values.length > 0}
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
            onBlur={() => {
              commit();
            }}
            placeholder={
              color
                ? "Type a color and press Enter, e.g. Red"
                : size
                  ? "Type a size and press Enter, e.g. M"
                  : "Type a value and press Enter, or paste: A, B, C"
            }
            aria-label={`Add a ${singular}`}
            className="h-9 bg-background text-sm"
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
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onAddValues(pc.label, pc.hex)}
                  className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium transition hover:border-accent"
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
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onAddValues(s)}
                  className="rounded-md border bg-background px-2 py-0.5 text-[11px] font-semibold transition hover:border-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {option.values.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                commit();
                setAdding(false);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent"
            >
              <Check className="h-3.5 w-3.5" /> Done
            </button>
          )}
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
    "h-9 rounded-md border bg-background px-3 text-xs font-medium transition hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-inherit";

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
            className="h-9 w-32 bg-background text-sm"
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
            className="h-9 w-28 bg-background text-sm"
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
