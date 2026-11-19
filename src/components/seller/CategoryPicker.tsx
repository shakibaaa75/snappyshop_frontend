"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { sellerCategories, type SellerCategory } from "@/lib/api/categories";
import { CategoryThumb } from "@/components/seller/CategoryThumb";
import { CategoryDialog } from "@/components/seller/CategoryDialog";

const CATEGORIES_KEY = ["seller", "categories"] as const;
const MAX_CATEGORIES = 5;
const MAX_IMAGE_MB = 5;

export interface CategorySuggestion {
  name: string;
  /** Shown on the right of the row, e.g. "Fashion". */
  hint?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

/* A product can have several categories. Selected ones show as chips; the
   "Add category" button opens a popup with search and suggestions. */

export function CategoryPicker({
  categories,
  values,
  onChange,
  error,
  related = [],
  pool = [],
  search,
  relatedLabel = "Suggested for this product type",
}: {
  /** The seller's own storefront categories. */
  categories: SellerCategory[];
  /** Selected category IDs. */
  values: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  /** Shown when the search box is empty (based on the chosen product type). */
  related?: CategorySuggestion[];
  /** Everything we can suggest while typing (all types and main categories). */
  pool?: CategorySuggestion[];
  /** Optional server search for aliases and typos ("hodie", "tshirt"). */
  search?: (q: string) => Promise<CategorySuggestion[]>;
  relatedLabel?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const selected = values
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is SellerCategory => !!c);

  const remove = (id: string) => onChange(values.filter((v) => v !== id));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((c) => (
          <span
            key={c.id}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-700 pl-2 pr-1.5 text-sm font-medium text-white"
          >
            <CategoryThumb
              name={c.name}
              imageUrl={c.imageUrl}
              className="h-6 w-6"
            />
            {c.name}
            <button
              type="button"
              aria-label={`Remove ${c.name}`}
              onClick={() => remove(c.id)}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full hover:bg-emerald-900",
                RING,
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full border border-dashed px-4 text-sm font-medium text-neutral-700 transition hover:border-emerald-700 hover:text-emerald-800",
            error ? "border-destructive" : "border-neutral-400",
            RING,
          )}
        >
          <Plus className="h-4 w-4" />
          Add category
        </button>
      </div>

      {selected.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">
          Add up to {MAX_CATEGORIES} categories so shoppers can find this
          product.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {open &&
        createPortal(
          <CategoryPopup
            categories={categories}
            values={values}
            onChange={onChange}
            onClose={() => setOpen(false)}
            related={related}
            pool={pool}
            search={search}
            relatedLabel={relatedLabel}
            qc={qc}
          />,
          document.body,
        )}
    </div>
  );
}

function CategoryPopup({
  categories,
  values,
  onChange,
  onClose,
  related,
  pool,
  search,
  relatedLabel,
  qc,
}: {
  categories: SellerCategory[];
  values: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
  related: CategorySuggestion[];
  pool: CategorySuggestion[];
  search?: (q: string) => Promise<CategorySuggestion[]>;
  relatedLabel: string;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<CategorySuggestion[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [popupError, setPopupError] = useState<string | null>(null);
  // Name waiting for its (optional) image before the category is created.
  const [pending, setPending] = useState<string | null>(null);
  // Category waiting for delete confirmation, and the one being deleted.
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Category being edited (rename / change or remove its picture).
  const [editing, setEditing] = useState<SellerCategory | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The latest selection, so adding right after a create never loses a pick.
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const atLimit = values.length >= MAX_CATEGORIES;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || editing) return;
      if (pending) setPending(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending, editing]);

  // Debounced server search (aliases + typos).
  useEffect(() => {
    const q = query.trim();
    if (!search || q.length < 2) {
      setRemote([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      search(q)
        .then((r) => !cancelled && setRemote(r))
        .catch(() => !cancelled && setRemote([]));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, search]);

  const q = norm(query);

  const own = useMemo(
    () => (q ? categories.filter((c) => norm(c.name).includes(q)) : categories),
    [categories, q],
  );

  const suggestions = useMemo(() => {
    const have = new Set(categories.map((c) => norm(c.name)));
    const seen = new Set<string>();
    const out: CategorySuggestion[] = [];
    const add = (s: CategorySuggestion) => {
      const k = norm(s.name);
      if (!k || have.has(k) || seen.has(k)) return;
      seen.add(k);
      out.push(s);
    };
    if (!q) {
      related.forEach(add);
    } else {
      pool
        .filter(
          (s) =>
            norm(s.name).includes(q) || (s.hint && norm(s.hint).includes(q)),
        )
        .forEach(add);
      remote.forEach(add);
    }
    return out.slice(0, 8);
  }, [categories, related, pool, remote, q]);

  const typed = query.trim();
  const exists =
    categories.some((c) => norm(c.name) === norm(typed)) ||
    suggestions.some((s) => norm(s.name) === norm(typed));
  const showCustom = typed.length >= 2 && !exists;

  const toggle = (id: string) => {
    const cur = valuesRef.current;
    if (cur.includes(id)) {
      onChange(cur.filter((v) => v !== id));
    } else if (cur.length < MAX_CATEGORIES) {
      onChange([...cur, id]);
    }
  };

  /** Deletes one of the seller's categories and drops it from this product. */
  const remove = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    setPopupError(null);
    try {
      await sellerCategories.remove(id);
      qc.setQueryData<SellerCategory[]>(CATEGORIES_KEY, (old) =>
        (old ?? []).filter((c) => c.id !== id),
      );
      qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      onChange(valuesRef.current.filter((v) => v !== id));
      setConfirmId(null);
    } catch (err) {
      setPopupError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Could not delete category.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /** Step 1 done: ask for an optional image before creating. */
  const create = (name: string) => {
    const n = name.trim();
    if (n.length < 2 || busy) return;
    if (n.length > 40) return setPopupError("Keep it under 40 characters.");
    if (valuesRef.current.length >= MAX_CATEGORIES) return;
    setPopupError(null);
    setPending(n);
  };

  /** Step 2: create the category (with or without an image) and select it. */
  const confirmCreate = async (file: File | null) => {
    if (!pending || busy) return;
    setBusy(pending);
    setPopupError(null);
    try {
      const c = await sellerCategories.create({ name: pending, image: file });
      qc.setQueryData<SellerCategory[]>(CATEGORIES_KEY, (old) => [
        ...(old ?? []),
        c,
      ]);
      qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      onChange([...valuesRef.current, c.id]);
      setPending(null);
      setQuery("");
      setRemote([]);
    } catch (err) {
      setPopupError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Could not add category.",
      );
    } finally {
      setBusy(null);
    }
  };

  const onEnter = () => {
    if (atLimit) return;
    if (q && own[0] && !values.includes(own[0].id)) toggle(own[0].id);
    else if (q && suggestions[0]) create(suggestions[0].name);
    else if (showCustom) create(typed);
  };

  const empty = own.length === 0 && suggestions.length === 0 && !showCustom;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      // Keep Enter/typing here from reaching the product form.
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cat-popup-title"
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-[26px] bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,.35)] sm:rounded-[26px]"
      >
        {pending ? (
          <ImageStep
            key={pending}
            name={pending}
            saving={!!busy}
            error={popupError}
            onBack={() => {
              setPending(null);
              setPopupError(null);
            }}
            onSave={confirmCreate}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div>
                <h2
                  id="cat-popup-title"
                  className="text-xl font-semibold tracking-tight"
                >
                  Add categories
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Pick a few, or type your own. Up to {MAX_CATEGORIES} per
                  product.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100",
                  RING,
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPopupError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onEnter();
                    }
                  }}
                  maxLength={40}
                  placeholder="Search or type a category"
                  className="h-11 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-500 focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>
              {atLimit && (
                <p className="mt-2 text-xs text-amber-700">
                  You&apos;ve reached {MAX_CATEGORIES} categories. Remove one to
                  add another.
                </p>
              )}
              {popupError && (
                <p role="alert" className="mt-2 text-xs text-red-700">
                  {popupError}
                </p>
              )}
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-4 pb-2">
              {own.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-2 text-xs font-medium text-neutral-500">
                    Your categories
                  </p>
                  <ul>
                    {own.map((c) => {
                      const on = values.includes(c.id);
                      const blocked = !on && atLimit;

                      if (confirmId === c.id) {
                        return (
                          <li key={c.id}>
                            <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-3 py-2 text-sm">
                              <span className="min-w-0 truncate text-red-900">
                                Delete “{c.name}”?
                              </span>
                              <span className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setConfirmId(null)}
                                  disabled={deletingId === c.id}
                                  className={cn(
                                    "h-8 rounded-full px-3 text-xs font-medium text-neutral-700 hover:bg-white disabled:opacity-40",
                                    RING,
                                  )}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => remove(c.id)}
                                  disabled={deletingId === c.id}
                                  className={cn(
                                    "inline-flex h-8 items-center gap-1.5 rounded-full bg-red-700 px-3 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-60",
                                    RING,
                                  )}
                                >
                                  {deletingId === c.id && (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  )}
                                  Delete
                                </button>
                              </span>
                            </div>
                          </li>
                        );
                      }

                      return (
                        <li key={c.id} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggle(c.id)}
                            disabled={blocked}
                            aria-pressed={on}
                            className={cn(
                              "flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition disabled:opacity-40",
                              on
                                ? "bg-emerald-50 text-emerald-900"
                                : "hover:bg-neutral-100",
                              RING,
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2.5">
                              <CategoryThumb
                                name={c.name}
                                imageUrl={c.imageUrl}
                                className="h-7 w-7"
                              />
                              <span className="truncate">{c.name}</span>
                            </span>
                            <Box on={on} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Edit ${c.name}`}
                            onClick={() => {
                              setPopupError(null);
                              setConfirmId(null);
                              setEditing(c);
                            }}
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-emerald-800",
                              RING,
                            )}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${c.name}`}
                            onClick={() => {
                              setPopupError(null);
                              setConfirmId(c.id);
                            }}
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-red-50 hover:text-red-700",
                              RING,
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {suggestions.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-3 text-xs font-medium text-neutral-500">
                    {q ? "Suggestions" : relatedLabel}
                  </p>
                  <ul>
                    {suggestions.map((s) => (
                      <li key={s.name}>
                        <button
                          type="button"
                          onClick={() => create(s.name)}
                          disabled={atLimit || !!busy}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-neutral-100 disabled:opacity-40",
                            RING,
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <CategoryThumb name={s.name} className="h-7 w-7" />
                            {s.name}
                          </span>
                          <span className="flex items-center gap-2">
                            {s.hint && (
                              <span className="text-xs text-neutral-500">
                                {s.hint}
                              </span>
                            )}
                            {busy === s.name ? (
                              <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                            ) : (
                              <Plus className="h-4 w-4 text-neutral-500" />
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {showCustom && (
                <button
                  type="button"
                  onClick={() => create(typed)}
                  disabled={atLimit || !!busy}
                  className={cn(
                    "mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-emerald-700/50 px-3 py-2.5 text-left text-sm font-medium text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-40",
                    RING,
                  )}
                >
                  {busy === typed ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add “{typed}” as new category
                </button>
              )}

              {empty && (
                <p className="px-3 py-6 text-center text-sm text-neutral-600">
                  Type a name to find or create a category.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
              <span className="text-xs text-neutral-600">
                You can add an image when you create a category.
              </span>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "h-11 rounded-full bg-emerald-700 px-6 text-sm font-medium text-white transition hover:bg-emerald-800",
                  RING,
                )}
              >
                {values.length > 0 ? `Done (${values.length})` : "Done"}
              </button>
            </div>
          </>
        )}
      </div>

      {editing && (
        <CategoryDialog
          existing={categories}
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            qc.setQueryData<SellerCategory[]>(CATEGORIES_KEY, (old) =>
              (old ?? []).map((c) => (c.id === updated.id ? updated : c)),
            );
            qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
            qc.invalidateQueries({ queryKey: ["public-store"] });
            qc.invalidateQueries({ queryKey: ["store-design", "categories"] });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* Step 2 of adding a category: optional image. */
function ImageStep({
  name,
  saving,
  error,
  onBack,
  onSave,
}: {
  name: string;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onSave: (file: File | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/"))
      return setImageError("Choose an image file (JPG, PNG or WebP).");
    if (f.size > MAX_IMAGE_MB * 1024 * 1024)
      return setImageError(`Image must be under ${MAX_IMAGE_MB} MB.`);
    setImageError(null);
    setFile(f);
  };

  return (
    <div className="overflow-y-auto p-6">
      <h2 id="cat-popup-title" className="text-xl font-semibold tracking-tight">
        Add a category image
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Shown with “{name}”. You can skip this.
      </p>

      <div className="mt-5">
        {preview ? (
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`Preview for ${name}`}
              className="aspect-[4/3] w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={saving}
              className={cn(
                "absolute right-2 top-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-100 disabled:opacity-40",
                RING,
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        ) : (
          <label className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-center transition hover:border-emerald-600 hover:bg-emerald-50/50 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-700">
            <ImagePlus className="h-6 w-6 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-800">
              Choose an image
            </span>
            <span className="text-xs text-neutral-600">
              JPG, PNG or WebP, up to {MAX_IMAGE_MB} MB
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {(imageError || error) && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {imageError || error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className={cn(
            "h-11 rounded-full px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40",
            RING,
          )}
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onSave(file)}
          disabled={saving}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full bg-emerald-700 px-6 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60",
            RING,
          )}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {file ? "Add category" : "Skip and add"}
        </button>
      </div>
    </div>
  );
}

function Box({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
        on
          ? "border-emerald-700 bg-emerald-700 text-white"
          : "border-neutral-300 bg-white",
      )}
    >
      {on && <Check className="h-3.5 w-3.5" />}
    </span>
  );
}

export default CategoryPicker;
