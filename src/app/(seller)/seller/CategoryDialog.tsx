"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { sellerCategories, type SellerCategory } from "@/lib/api/categories";

const MAX_IMAGE_MB = 5;

const RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

/* Add category: step 1 = name, step 2 = image */

export function CategoryDialog({
  existing,
  onClose,
  onCreated,
}: {
  existing: SellerCategory[];
  onClose: () => void;
  onCreated: (c: SellerCategory) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const goToImage = (e: FormEvent) => {
    e.preventDefault();
    // Don't let this submit a surrounding form (e.g. the product form).
    e.stopPropagation();
    const n = name.trim();
    if (n.length < 2) return setNameError("Enter at least 2 characters.");
    if (n.length > 40) return setNameError("Keep it under 40 characters.");
    if (existing.some((c) => c.name.trim().toLowerCase() === n.toLowerCase()))
      return setNameError("You already have a category with this name.");
    setNameError(null);
    setStep(2);
  };

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/"))
      return setImageError("Choose an image file (JPG, PNG or WebP).");
    if (f.size > MAX_IMAGE_MB * 1024 * 1024)
      return setImageError(`Image must be under ${MAX_IMAGE_MB} MB.`);
    setImageError(null);
    setFile(f);
  };

  const save = async () => {
    setSaving(true);
    setSubmitError(null);
    try {
      const created = await sellerCategories.create({
        name: name.trim(),
        image: file,
      });
      onCreated(created);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not add category.",
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cat-dialog-title"
        className="w-full max-w-md rounded-t-[26px] bg-white p-6 shadow-[0_8px_32px_-8px_rgba(0,0,0,.35)] sm:rounded-[26px]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="cat-dialog-title"
              className="text-xl font-semibold tracking-tight"
            >
              {step === 1 ? "Name your category" : "Add a category image"}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              {step === 1
                ? "Shoppers will see this name on your storefront."
                : `Shown with “${name.trim()}”. You can skip this and add one later.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40",
              RING,
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={goToImage} className="mt-5">
            <label htmlFor="cat-name" className="text-sm font-medium">
              Category name
            </label>
            <input
              id="cat-name"
              ref={nameRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              maxLength={40}
              placeholder="e.g. Shoes"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "cat-name-error" : undefined}
              className={cn(
                "mt-2 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-neutral-500 focus:ring-2 focus:ring-emerald-600/40",
                nameError ? "border-red-600" : "border-neutral-300",
              )}
            />
            {nameError && (
              <p
                id="cat-name-error"
                role="alert"
                className="mt-2 text-sm text-red-700"
              >
                {nameError}
              </p>
            )}
            <DialogFooter step={1}>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "h-11 rounded-full px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100",
                  RING,
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(
                  "h-11 rounded-full bg-emerald-700 px-6 text-sm font-medium text-white transition hover:bg-emerald-800",
                  RING,
                )}
              >
                Next
              </button>
            </DialogFooter>
          </form>
        ) : (
          <div className="mt-5">
            {preview ? (
              <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={`Preview for ${name.trim()}`}
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
              <label
                className={cn(
                  "flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-center transition hover:border-emerald-600 hover:bg-emerald-50/50",
                  "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-700",
                )}
              >
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

            {(imageError || submitError) && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {imageError || submitError}
              </p>
            )}

            <DialogFooter step={2}>
              <button
                type="button"
                onClick={() => setStep(1)}
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
                onClick={save}
                disabled={saving}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full bg-emerald-700 px-6 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60",
                  RING,
                )}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {file ? "Add category" : "Skip and add"}
              </button>
            </DialogFooter>
          </div>
        )}
      </div>
    </div>
  );
}

function DialogFooter({
  step,
  children,
}: {
  step: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <span className="text-xs tabular-nums text-neutral-600">
        Step {step} of 2
      </span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
