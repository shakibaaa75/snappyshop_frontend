"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NAME_CHANGE_DISCLAIMER,
  shopNameErrorMessage,
  shopUrlSlug,
} from "@/lib/store-design/api";
import { slugify } from "@/lib/store-design/utilts";

interface Props {
  open: boolean;
  currentName: string;
  currentSlug: string;
  /** Disclaimer text from the server (falls back to the built-in text). */
  disclaimer?: string;
  onClose: () => void;
  /** Performs the rename. Must throw on failure. */
  onConfirm: (name: string, slugOverride?: string) => Promise<void>;
}

/**
 * Two steps: (1) type the new name, (2) read the 30-day disclaimer and
 * confirm. The rename request is only sent from step 2, after the seller
 * ticked the confirmation box.
 */
export function ShopNameChangeDialog({
  open,
  currentName,
  currentSlug,
  disclaimer,
  onClose,
  onConfirm,
}: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [slugOverride, setSlugOverride] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName("");
    setSlugOverride("");
    setAck(false);
    setBusy(false);
    setError(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const trimmed = name.trim().replace(/\s+/g, " ");
  const derived = shopUrlSlug(trimmed);
  const derivedOk = derived.length >= 3;
  const finalSlug = derivedOk ? derived : slugOverride;
  const nameOk = trimmed.length >= 3 && trimmed.length <= 60;
  const slugOk = finalSlug.length >= 3;
  const same = trimmed === currentName.trim();
  const canContinue = nameOk && slugOk && !same;

  const confirm = async () => {
    if (!ack || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(trimmed, derivedOk ? undefined : slugOverride);
      onClose();
    } catch (err) {
      setError(shopNameErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-base font-semibold">
            {step === 1 ? "Change shop name" : "Confirm shop name change"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor={`${titleId}-name`} className="block text-sm font-medium">
                New shop name
              </label>
              <Input
                id={`${titleId}-name`}
                ref={inputRef}
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Luna Boutique"
                className="h-11"
              />
              {same && (
                <p className="text-xs text-destructive">
                  This is already your shop name.
                </p>
              )}
            </div>

            {trimmed.length >= 3 && !derivedOk && (
              <div className="space-y-1.5">
                <label
                  htmlFor={`${titleId}-slug`}
                  className="block text-sm font-medium"
                >
                  Shop URL
                </label>
                <Input
                  id={`${titleId}-slug`}
                  value={slugOverride}
                  maxLength={40}
                  onChange={(e) => setSlugOverride(slugify(e.target.value))}
                  placeholder="your-shop-name"
                  className="h-11 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This name has no letters or numbers a–z / 0–9, so choose the
                  web address yourself.
                </p>
              </div>
            )}

            <p className="text-xs leading-5 text-muted-foreground">
              Your shop URL will become{" "}
              <span className="font-mono text-foreground">
                shopbd.com/store/{finalSlug || "…"}
              </span>
              .
            </p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="accent"
                disabled={!canContinue}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm leading-5">
                {disclaimer || NAME_CHANGE_DISCLAIMER}
              </p>
            </div>

            <dl className="space-y-1 rounded-xl bg-muted/50 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">New name</dt>
                <dd className="truncate font-medium">{trimmed}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">New URL</dt>
                <dd className="truncate font-mono text-xs">
                  /store/{finalSlug}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Current URL</dt>
                <dd className="truncate font-mono text-xs">
                  /store/{currentSlug} (will stop working)
                </dd>
              </div>
            </dl>

            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                disabled={busy}
                className="mt-1 h-4 w-4"
              />
              <span>
                I understand I can&apos;t change my shop name again for 30 days.
              </span>
            </label>

            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="accent"
                disabled={!ack || busy}
                onClick={confirm}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing…
                  </>
                ) : (
                  "Confirm change"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
