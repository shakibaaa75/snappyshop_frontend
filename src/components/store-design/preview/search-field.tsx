"use client";

import {
  type CSSProperties,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import {
  formatPrice,
  normalizeHex,
  readableOn,
} from "@/lib/store-design/utilts";
import { Link, PreviewNavigation } from "./blocks";
import { searchStoreProducts } from "./search";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Feed sections                                                       */
/* ------------------------------------------------------------------ */

export function SearchField({
  ctx,
  compact = false,
  autoFocus = false,
  mobileHeader = false,
  bg = "var(--s-surface)",
}: {
  ctx: Ctx;
  compact?: boolean;
  autoFocus?: boolean;
  mobileHeader?: boolean;
  bg?: string;
}) {
  const { d, products, interactive, searchQuery = "", setSearchQuery } = ctx;
  const previewNavigate = useContext(PreviewNavigation);
  const resultsId = useId();
  const searchBg = normalizeHex(bg.startsWith("#") ? bg : d.bgColor, "#ffffff");
  const searchInk = readableOn(searchBg);
  const searchSurface: CSSProperties = {
    background: searchBg,
    color: searchInk,
    border: `1px solid color-mix(in srgb, ${searchInk} 30%, ${searchBg})`,
  };
  const [open, setOpen] = useState(false);
  const [localQ, setLocalQ] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const base = `/store/${d.storeSlug}`;

  useEffect(() => {
    setLocalQ(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const q = localQ.trim();
  const results = useMemo(
    () => searchStoreProducts(products, ctx.categories, q, 8),
    [products, ctx.categories, q],
  );

  const commit = (value: string) => {
    setLocalQ(value);
    setSearchQuery?.(value);
    setOpen(!!value.trim());
  };

  const shell = cn(
    "flex items-center gap-2.5 rounded-full",
    mobileHeader ? "h-11 px-3" : compact ? "px-4 py-2" : "h-12 px-5",
  );

  if (!interactive && !previewNavigate) {
    return (
      <div className={shell} style={searchSurface}>
        <Search className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1 truncate text-sm opacity-80">
          Search products
        </span>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={cn("w-full", !mobileHeader && "relative")}>
      <div className={shell} style={searchSurface}>
        <Search
          className="h-4 w-4 shrink-0 opacity-80"
          style={{ color: searchInk }}
        />
        <input
          ref={inputRef}
          style={{ color: searchInk }}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search products"
          aria-expanded={open && q.length > 0}
          aria-controls={open && q.length > 0 ? resultsId : undefined}
          placeholder="Search products…"
          value={localQ}
          onChange={(e) => commit(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          className={cn(
            "appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none min-w-0 flex-1 bg-transparent outline-none placeholder:text-current placeholder:opacity-70",
            mobileHeader
              ? "text-base"
              : compact
                ? "text-sm"
                : "text-base sm:text-sm",
          )}
        />
        {localQ && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              commit("");
              inputRef.current?.focus();
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{ color: searchInk }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && q.length > 0 && (
        <div
          id={resultsId}
          role="listbox"
          className={cn(
            "absolute z-50 max-h-[min(70vh,360px)] overflow-y-auto rounded-[24px] shadow-xl",
            mobileHeader
              ? "inset-x-4 top-full"
              : "left-0 right-0 top-[calc(100%+8px)]",
          )}
          style={searchSurface}
        >
          {results.length === 0 ? (
            <p
              className="px-4 py-6 text-center text-sm"
              style={{ color: searchInk }}
            >
              No products match “{localQ.trim()}”
            </p>
          ) : (
            <ul className="py-1.5">
              {results.map((p) => (
                <li key={p.id} role="option">
                  <Link
                    on={interactive}
                    href={`${base}/products/${p.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[var(--s-surface)]"
                    onClick={() => {
                      setOpen(false);
                      commit("");
                    }}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg"
                      style={{ background: "var(--s-surface)" }}
                    >
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img(p.imageUrl, { width: 88, height: 88 })}
                          alt=""
                          width={44}
                          height={44}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{p.emoji || "·"}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {p.name}
                      </span>
                      <span className="text-xs" style={{ color: searchInk }}>
                        {formatPrice(p.price)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
