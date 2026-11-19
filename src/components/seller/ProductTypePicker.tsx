"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_TYPE_GROUPS } from "@/lib/api/productTypes";

export function ProductTypePicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered groups, plus a flat list for keyboard navigation.
  const { groups, flat } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = PRODUCT_TYPE_GROUPS.map((g) => ({
      group: g.group,
      types: g.types.filter(
        (t) =>
          !q ||
          t.toLowerCase().includes(q) ||
          g.group.toLowerCase().includes(q),
      ),
    })).filter((g) => g.types.length > 0);
    return { groups, flat: groups.flatMap((g) => g.types) };
  }, [query]);

  useEffect(() => setActive(0), [query]);

  // Close on outside click and discard whatever was typed.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const select = (t: string) => {
    onChange(t);
    setOpen(false);
    setQuery("");
  };

  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && flat[active]) select(flat[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    } else if (e.key === "Backspace" && !query && value) {
      // Backspace on an empty search removes the selected type.
      onChange("");
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={cn(
          "flex min-h-10 w-full cursor-text items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm",
          "focus-within:ring-2 focus-within:ring-ring/40",
          error && "border-destructive",
        )}
      >
        {value && (
          <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-600 bg-emerald-600 py-0.5 pl-2.5 pr-1 text-sm font-medium text-white">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{value}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="ml-0.5 rounded-full p-0.5 text-white hover:bg-emerald-800"
              aria-label={`Remove ${value}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value ? "Change type…" : "Search product type…"}
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!error}
          autoComplete="off"
          className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
          {flat.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No matching product type. Try a different word.
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.group}>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.group}
                </p>
                {g.types.map((t) => {
                  const idx = flat.indexOf(t);
                  const selected = t === value;
                  return (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => select(t)}
                      onMouseEnter={() => setActive(idx)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm",
                        idx === active && "bg-muted",
                        selected &&
                          "font-medium text-emerald-700 dark:text-emerald-300",
                      )}
                    >
                      {t}
                      {selected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ProductTypePicker;
