"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { chipClass } from "@/components/features/home/SectionState";
import { pageWindow } from "@/lib/query/category-nav";
import { cn } from "@/lib/utils";

const base = cn(chipClass(false), "gap-1 px-4");

/**
 * Page buttons for the product and seller lists.
 * Renders nothing when everything fits on one page.
 */
export function Pager({
  page,
  limit,
  total,
  onPage,
}: {
  page: number;
  limit: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = limit > 0 ? Math.ceil(total / limit) : 1;
  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className={cn(base, "disabled:opacity-40")}
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </button>

      {pageWindow(page, pages).map((n, i) =>
        n === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className="px-1 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            onClick={() => onPage(n)}
            className={cn(chipClass(n === page), "px-3")}
          >
            {n}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className={cn(base, "disabled:opacity-40")}
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
