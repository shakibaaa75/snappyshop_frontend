"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ring =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#FF6845] focus-visible:ring-offset-2";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

type OffcanvasProps = {
  open: boolean;
  onClose: () => void;
  /** Edge the panel slides in from. */
  side?: "left" | "right";
  /** Accessible name for the dialog. */
  label: string;
  /** Content shown at the left of the top bar (title or logo). */
  heading?: ReactNode;
  /** Pinned to the bottom of the panel (actions such as Log out). */
  footer?: ReactNode;
  id?: string;
  children: ReactNode;
};

/**
 * Slide-in side panel.
 * - Rendered in a portal: the sticky header uses backdrop-blur, which would
 *   otherwise trap a `fixed` panel inside the header's box.
 * - Locks page scroll, closes on Escape / backdrop tap, keeps focus inside
 *   and gives it back to the trigger on close.
 */
export function Offcanvas({
  open,
  onClose,
  side = "right",
  label,
  heading,
  footer,
  id,
  children,
}: OffcanvasProps) {
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => closeBtn.current?.focus(), 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = panel.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] transition-[visibility] duration-300 motion-reduce:transition-none",
        open ? "visible delay-0" : "pointer-events-none invisible delay-300",
      )}
      inert={!open}
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-[#0F2E2B]/50 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Panel */}
      <div
        ref={panel}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "absolute inset-y-0 flex w-[88vw] max-w-sm flex-col bg-background shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none",
          side === "right" ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : side === "right"
              ? "translate-x-full"
              : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#E6DDD0] dark:border-border px-4 pt-[env(safe-area-inset-top)] box-content">
          <div className="min-w-0 text-base font-semibold text-[#17645F] dark:text-white">
            {heading}
          </div>
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E6DDD0] bg-white text-[#17645F] transition-colors hover:bg-[#EAE2D7] dark:border-border dark:bg-card dark:text-white dark:hover:bg-muted",
              ring,
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-[#E6DDD0] dark:border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
