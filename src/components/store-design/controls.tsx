"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ImageIcon,
  Info,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/store-design/api";
import { formatPrice, normalizeHex } from "@/lib/store-design/utilts";
import type { Category, Product } from "@/lib/store-design/types";
import { ProductArt } from "./productArt";

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  const labelClass = "block text-sm font-medium";
  return (
    <div className={cn("space-y-1.5", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
        </label>
      ) : (
        <div className={labelClass}>{label}</div>
      )}
      {children}
      {hint && (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning";
  children: ReactNode;
}) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-3.5 text-xs leading-5",
        tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "bg-accent/5 text-muted-foreground",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "warning" ? "text-amber-700" : "text-accent",
        )}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  inputMode,
  className,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url";
  className?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11"
      />
    </Field>
  );
}

export function NumberField({
  label,
  hint,
  value,
  onChange,
  placeholder = "0",
  className,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={value === 0 ? "" : value}
        placeholder={placeholder}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="h-11"
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[88px] text-sm"
      />
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        "flex min-h-[56px] items-center justify-between gap-4 rounded-xl border px-3.5 py-2.5",
        disabled && "opacity-60",
      )}
    >
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer py-1">
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
            {description}
          </span>
        )}
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-xl bg-muted p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-10 rounded-lg px-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ChoiceGrid<T extends string>({
  value,
  options,
  onChange,
  cols = 3,
  label,
}: {
  value: T;
  options: { value: T; label: string; preview?: ReactNode }[];
  onChange: (v: T) => void;
  cols?: number;
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-accent bg-accent/5 text-foreground ring-1 ring-accent"
                : "text-muted-foreground hover:border-accent/50",
            )}
          >
            {o.preview}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
        danger && "hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Color + images                                                      */
/* ------------------------------------------------------------------ */

export function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const safe = normalizeHex(value, "#ffffff");

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <label
          className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border shadow-sm"
          style={{ backgroundColor: safe }}
        >
          <input
            type="color"
            aria-label={`${label} picker`}
            value={safe}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          aria-label={`${label} hex code`}
          value={text}
          maxLength={7}
          onChange={(e) => {
            setText(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
              onChange(e.target.value.toLowerCase());
            }
          }}
          onBlur={() => {
            const next = normalizeHex(text, value);
            setText(next);
            onChange(next);
          }}
          className="h-11 font-mono text-sm uppercase"
        />
      </div>
    </Field>
  );
}

export function ImageField({
  label,
  hint,
  value,
  onChange,
  maxSize = 1600,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  maxSize?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadImage(file, maxSize));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3 rounded-xl border p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {value ? "Replace" : "Upload image"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              className="h-10 text-destructive hover:text-destructive"
              onClick={() => onChange("")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet: bottom sheet on phones, centered dialog on larger screens    */
/* ------------------------------------------------------------------ */

export function Sheet({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-in fade-in"
      />
      <div className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl animate-in slide-in-from-bottom-8 sm:max-w-2xl sm:rounded-3xl">
        <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product + category pickers                                          */
/* ------------------------------------------------------------------ */

export function ProductPicker({
  label,
  hint,
  products,
  categories,
  selectedIds,
  onChange,
  max,
}: {
  label: string;
  hint?: string;
  products: Product[];
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");

  const selected = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);
  const atMax = max !== undefined && selectedIds.length >= max;

  const move = (i: number, dir: -1 | 1) => {
    const next = [...selectedIds];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else if (!atMax) onChange([...selectedIds, id]);
  };

  const filtered = products.filter(
    (p) =>
      (cat === "all" || p.categoryId === cat) &&
      p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {selected.length}
            {max ? ` of ${max}` : ""} selected
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0"
          onClick={() => setOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {selected.length ? "Edit" : "Choose"}
        </Button>
      </div>

      {hint && (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      )}

      {selected.length === 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed p-5 text-center transition hover:border-accent/60 hover:bg-accent/5"
        >
          <span className="text-sm font-medium">No products chosen yet</span>
          <span className="text-xs text-muted-foreground">
            Tap to pick the products you want to show
          </span>
        </button>
      ) : (
        <ul className="space-y-2">
          {selected.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-2.5 rounded-xl border p-2"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                <ProductArt product={p} emojiClassName="text-lg" width={120} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(p.price)}
                </p>
              </div>
              <IconButton
                label="Move up"
                onClick={() => move(i, -1)}
                disabled={i === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton
                label="Move down"
                onClick={() => move(i, 1)}
                disabled={i === selected.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={`Remove ${p.name}`}
                danger
                onClick={() => toggle(p.id)}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        description={
          max
            ? `Choose up to ${max} products. They show in the order you pick them.`
            : "Tap products to add or remove them."
        }
        footer={
          <div className="flex items-center justify-between gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              disabled={selectedIds.length === 0}
              onClick={() => onChange([])}
            >
              Clear all
            </Button>
            <Button
              type="button"
              variant="accent"
              className="h-11 rounded-full px-8"
              onClick={() => setOpen(false)}
            >
              Done{selectedIds.length ? ` (${selectedIds.length})` : ""}
            </Button>
          </div>
        }
      >
        <div className="sticky top-0 z-10 space-y-3 border-b bg-background p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-11 pl-10"
            />
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
            {[{ id: "all", name: "All" }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cn(
                  "min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-medium transition",
                  cat === c.id
                    ? "border-accent bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
          {atMax && (
            <p className="text-xs text-amber-700">
              You have reached the limit of {max}. Remove one to add another.
            </p>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No products match your search.
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map((p) => {
              const checked = selectedIds.includes(p.id);
              const blocked = !checked && atMax;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => toggle(p.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/50 disabled:opacity-40"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                        checked
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-input",
                      )}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <ProductArt
                        product={p}
                        emojiClassName="text-xl"
                        width={120}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(p.price)} · {p.sold} sold
                        {p.stock === 0 ? " · Out of stock" : ""}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </div>
  );
}

export function CategoryPicker({
  categories,
  products,
  selectedIds,
  onChange,
}: {
  categories: Category[];
  products: Product[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = selectedIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is Category => !!c);
  const rest = categories.filter((c) => !selectedIds.includes(c.id));
  const count = (id: string) =>
    products.filter((p) => p.categoryId === id).length;

  const move = (i: number, dir: -1 | 1) => {
    const next = [...selectedIds];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {selected.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
          No categories chosen yet. Add some below.
        </p>
      ) : (
        <ul className="space-y-2">
          {selected.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-2.5 rounded-xl border p-2"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                {c.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {count(c.id)} products
                </p>
              </div>
              <IconButton
                label="Move up"
                onClick={() => move(i, -1)}
                disabled={i === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton
                label="Move down"
                onClick={() => move(i, 1)}
                disabled={i === selected.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={`Remove ${c.name}`}
                danger
                onClick={() => onChange(selectedIds.filter((x) => x !== c.id))}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {rest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rest.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange([...selectedIds, c.id])}
              className="flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition hover:border-accent/60 hover:bg-accent/5"
            >
              <Plus className="h-3.5 w-3.5 text-accent" />
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
