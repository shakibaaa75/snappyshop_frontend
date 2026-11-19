"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small (?) button with a tooltip.
 * Desktop: opens on hover or keyboard focus. Phone: tap to open, tap
 * anywhere else (or press Escape) to close.
 */
export function InfoTip({
  text,
  label = "More info",
  className,
}: {
  text: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const open = hover || pinned;

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setHover(false);
      setPinned(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setPinned((p) => !p);
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onKeyUp={(e) => {
          if (e.key === "Tab") setHover(true);
        }}
        onBlur={() => setHover(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-2 w-64 max-w-[calc(100vw-3rem)] rounded-lg border bg-popover px-3 py-2 text-left text-xs font-normal leading-5 text-popover-foreground shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
