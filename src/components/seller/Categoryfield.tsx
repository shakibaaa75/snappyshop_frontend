"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: string;
  name: string;
  /** Shown on the right of the row, e.g. the main category ("Fashion"). */
  hint?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function CategoryField({
  options,
  selectedId,
  customText,
  onSelect,
  onCustom,
  onClear,
  search,
  placeholder = "Search or type your own…",
  error,
}: {
  options: CategoryOption[];
  selectedId: string;
  customText: string;
  onSelect: (id: string) => void;
  onCustom: (text: string) => void;
  onClear: () => void;
  /**
   * Optional server search. It finds aliases and typos that the local list
   * cannot ("hodie", "kurta", "punjabi"). Local matches show instantly.
   */
  search?: (q: string) => Promise<CategoryOption[]>;
  placeholder?: string;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<CategoryOption[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === selectedId);
  const hasValue = !!selectedId || !!customText.trim();
  const label = selected?.name ?? (customText.trim() || "Selected");

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Server search, debounced so we don't call it on every keystroke.
  useEffect(() => {
    const q = query.trim();
    if (!search || q.length < 2) {
      setRemote([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      search(q)
        .then((r) => {
          if (!cancelled) setRemote(r);
        })
        .catch(() => {
          if (!cancelled) setRemote([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, search]);

  const matches = useMemo(() => {
    const q = norm(query);
    if (!q) return options.slice(0, 8);

    // Local: name, or the main category ("fashion" lists every fashion type).
    const local = options.filter(
      (o) => norm(o.name).includes(q) || (o.hint && norm(o.hint).includes(q)),
    );

    // Server results (aliases + typos). Use the local copy so the hint shows.
    const byId = new Map(options.map((o) => [o.id, o]));
    const seen = new Set(local.map((o) => o.id));
    const extra: CategoryOption[] = [];
    for (const r of remote) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      extra.push(byId.get(r.id) ?? r);
    }
    return [...local, ...extra].slice(0, 8);
  }, [options, query, remote]);

  const typed = query.trim();
  const exact = options.some((o) => norm(o.name) === norm(typed));
  const showCustom = typed.length >= 2 && !exact;

  const pick = (id: string) => {
    onSelect(id);
    setQuery("");
    setRemote([]);
    setOpen(false);
  };
  const addCustom = () => {
    onCustom(typed);
    setQuery("");
    setRemote([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-2 rounded-md border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/40",
          error ? "border-destructive" : "border-input",
        )}
      >
        {hasValue && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary py-1 pl-2.5 pr-1 text-sm font-medium text-white">
            <Check className="h-3.5 w-3.5" />
            {label}
            {!selectedId && (
              <span className="rounded bg-white/20 px-1 text-[10px] uppercase">
                custom
              </span>
            )}
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={onClear}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/90"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches[0] && norm(query)) pick(matches[0].id);
              else if (showCustom) addCustom();
            } else if (e.key === "Backspace" && !query && hasValue) {
              onClear();
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={hasValue ? "Change…" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && (matches.length > 0 || showCustom) && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-card p-1 shadow-lg">
          {matches.map((o) => {
            const on = o.id === selectedId;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm",
                    on ? "bg-primary text-white" : "hover:bg-muted",
                  )}
                >
                  <span>{o.name}</span>
                  <span className="flex items-center gap-2">
                    {o.hint && (
                      <span
                        className={cn(
                          "text-xs",
                          on ? "text-white/80" : "text-muted-foreground",
                        )}
                      >
                        {o.hint}
                      </span>
                    )}
                    {on && <Check className="h-4 w-4" />}
                  </span>
                </button>
              </li>
            );
          })}
          {showCustom && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={addCustom}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-primary hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Use “{typed}” as custom
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default CategoryField;
