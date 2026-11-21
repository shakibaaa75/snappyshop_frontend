"use client";

import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const origin = useRef<HTMLSpanElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const container = origin.current?.closest<HTMLElement>(".marketplace-public");

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <span ref={origin} hidden />
      <Dialog.Portal container={container ?? undefined}>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          id={id}
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            opener.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
            closeButton.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (opener.current?.isConnected)
              opener.current.focus({ preventScroll: true });
          }}
          className={cn(
            "fixed top-0 z-[101] flex h-dvh w-[min(88vw,24rem)] flex-col overflow-hidden bg-background text-foreground shadow-xl outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none",
            side === "left"
              ? "left-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
              : "right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          )}
        >
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 pb-3 pt-[calc(.75rem+env(safe-area-inset-top))]">
            <div className="min-w-0 font-semibold">{heading}</div>
            <Dialog.Close
              ref={closeButton}
              aria-label="Close"
              className="grid size-11 shrink-0 place-items-center rounded-full border hover:bg-muted"
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
          {footer && (
            <div className="shrink-0 border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
