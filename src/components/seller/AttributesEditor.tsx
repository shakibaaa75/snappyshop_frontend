"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProductAttribute } from "@/lib/api/products";
import { MAX_ATTRIBUTES, blockEnterSubmit } from "@/lib/api/product-variants";

const SUGGESTIONS = [
  "Material",
  "Fabric",
  "Weight",
  "Dimensions",
  "Care instructions",
  "Country of origin",
  "Warranty",
  "Model number",
];

const norm = (s: string) => s.trim().toLowerCase();

export function AttributesEditor({
  attributes,
  onChange,
}: {
  attributes: ProductAttribute[];
  onChange: (v: ProductAttribute[]) => void;
}) {
  const update = (i: number, patch: Partial<ProductAttribute>) =>
    onChange(attributes.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  const remove = (i: number) =>
    onChange(attributes.filter((_, idx) => idx !== i));

  const add = (key = "") => {
    if (attributes.length >= MAX_ATTRIBUTES) return;
    onChange([...attributes, { key, value: "" }]);
  };

  const counts = new Map<string, number>();
  for (const a of attributes) {
    const k = norm(a.key);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const usedKeys = new Set(counts.keys());
  const atLimit = attributes.length >= MAX_ATTRIBUTES;

  return (
    <div className="space-y-3" onKeyDown={blockEnterSubmit}>
      <datalist id="attribute-key-suggestions">
        {SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {attributes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Add specs that help shoppers decide: material, weight, care, anything
          you want to publish. Skip this if you don&apos;t need it.
        </p>
      ) : (
        <ul className="space-y-2">
          {attributes.map((a, i) => {
            const duplicate =
              !!norm(a.key) && (counts.get(norm(a.key)) ?? 0) > 1;
            return (
              <li key={i} className="space-y-1">
                <div className="grid grid-cols-[minmax(0,1fr)_36px] gap-2 sm:grid-cols-[200px_minmax(0,1fr)_36px] sm:items-center">
                  <Input
                    value={a.key}
                    list="attribute-key-suggestions"
                    maxLength={40}
                    onChange={(e) => update(i, { key: e.target.value })}
                    placeholder="Name, e.g. Material"
                    aria-label={`Specification ${i + 1} name`}
                    aria-invalid={duplicate}
                    className={cn(
                      "h-9 text-sm",
                      duplicate && "border-destructive",
                    )}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${a.key || "specification"}`}
                    onClick={() => remove(i)}
                    className="flex h-8 w-8 items-center justify-center self-center justify-self-end rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive sm:order-last"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <Input
                    value={a.value}
                    maxLength={160}
                    onChange={(e) => update(i, { value: e.target.value })}
                    placeholder="Value, e.g. 100% cotton"
                    aria-label={`Specification ${i + 1} value`}
                    className="col-span-2 h-9 text-sm sm:col-span-1"
                  />
                </div>
                {duplicate && (
                  <p className="text-xs text-destructive">
                    “{a.key.trim()}” is listed more than once.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => add()}
          disabled={atLimit}
          className="flex h-8 items-center gap-1.5 rounded-md border border-dashed px-2.5 text-xs font-medium text-muted-foreground transition hover:border-accent hover:text-accent disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
          Add spec
        </button>
        {!atLimit &&
          SUGGESTIONS.filter((s) => !usedKeys.has(norm(s)))
            .slice(0, 5)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="h-8 rounded-full border px-2.5 text-xs text-muted-foreground transition hover:border-accent hover:text-accent"
              >
                + {s}
              </button>
            ))}
        {atLimit && (
          <span className="text-xs text-muted-foreground">
            Up to {MAX_ATTRIBUTES} specifications.
          </span>
        )}
      </div>
    </div>
  );
}

export default AttributesEditor;
