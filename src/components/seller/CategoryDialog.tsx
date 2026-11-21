"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { sellerCategories, type SellerCategory } from "@/lib/api/categories";

const MAX_IMAGE_MB = 5;

const RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * The one category dialog for sellers.
 *
 *  - Add  (no `category`): step 1 = name, step 2 = optional image.
 *  - Edit (`category` set): one screen to rename and to change or remove
 *    the picture.
 *
 * Pictures are uploaded to R2 by sellerCategories; only the https URL is saved.
 */
export function CategoryDialog({
  existing,
  category,
  onClose,
  onSaved,
}: {
  /** All of the seller's categories (for the duplicate-name check). */
  existing: SellerCategory[];
  /** Set to edit this category instead of adding a new one. */
  category?: SellerCategory | null;
  onClose: () => void;
  /** Called with the saved category after a create or an update. */
  onSaved: (c: SellerCategory, mode: "created" | "updated") => void;
}) {
  const editing = !!category;
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(category?.name ?? "");
  const [file, setFile] = useState<File | null>(null);
  // Edit only: the seller pressed Remove on the current picture.
  const [removeCurrent, setRemoveCurrent] = useState(false);
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

  /** Returns an error message, or null when the name is fine. */
  const checkName = (): string | null => {
    const n = name.trim();
    if (n.length < 2) return "Enter at least 2 characters.";
    if (n.length > 40) return "Keep it under 40 characters.";
    const clash = existing.some(
      (c) =>
        c.id !== category?.id &&
        c.name.trim().toLowerCase() === n.toLowerCase(),
    );
    return clash ? "You already have a category with this name." : null;
  };

  const goToImage = (e: FormEvent) => {
    e.preventDefault();
    // Don't let this submit a surrounding form (e.g. the product form).
    e.stopPropagation();
    const err = checkName();
    if (err) return setNameError(err);
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
    setRemoveCurrent(false);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSubmitError(null);
    try {
      if (category) {
        const updated = await sellerCategories.update(category.id, {
          name: name.trim(),
          image: file,
          removeImage: removeCurrent && !file,
          // The backend overwrites these on update, so send what is there.
          position: category.position,
          emoji: category.emoji,
        });
        onSaved(updated, "updated");
      } else {
        const created = await sellerCategories.create({
          name: name.trim(),
          image: file,
        });
        onSaved(created, "created");
      }
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : editing
              ? "Could not save category."
              : "Could not add category.",
      );
      setSaving(false);
    }
  };

  /** Edit screen: Enter in the name box saves. */
  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const err = checkName();
    if (err) return setNameError(err);
    setNameError(null);
    void save();
  };

  // What the picture area shows right now.
  const shown =
    preview ?? (!removeCurrent ? (category?.imageUrl ?? null) : null);
  const hadPicture = !!category?.imageUrl;
  const changed =
    !!file ||
    (removeCurrent && hadPicture) ||
    (editing && name.trim() !== category?.name);

  const title = editing
    ? "Edit category"
    : step === 1
      ? "Name your category"
      : "Add a category image";
  const subtitle = editing
    ? "Rename it or change the picture. Shoppers see the update on your storefront."
    : step === 1
      ? "Shoppers will see this name on your storefront."
      : `Shown with “${name.trim()}”. You can skip this and add one later.`;

  const picture = (
    <div>
      {shown ? (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shown}
            alt={`Picture for ${name.trim() || "category"}`}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute right-2 top-2 flex gap-2">
            {editing && (
              <label
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-card px-3.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary",
                  saving && "pointer-events-none opacity-40",
                )}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Change
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={saving}
                  onChange={(e) => {
                    pick(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <button
              type="button"
              onClick={() => {
                if (file)
                  setFile(null); // drop the new pick, keep the old
                else setRemoveCurrent(true);
              }}
              disabled={saving}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted disabled:opacity-40",
                RING,
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          className={cn(
            "flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/50 text-center transition hover:border-primary hover:bg-muted",
            "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary",
          )}
        >
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Choose an image
          </span>
          <span className="text-xs text-muted-foreground">
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
    </div>
  );

  const nameField = (
    <>
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
        disabled={saving}
        aria-invalid={!!nameError}
        aria-describedby={nameError ? "cat-name-error" : undefined}
        className={cn(
          "mt-2 h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40",
          nameError ? "border-red-600" : "border-border",
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
    </>
  );

  const cancelBtn = (
    <button
      type="button"
      onClick={onClose}
      disabled={saving}
      className={cn(
        "h-11 rounded-full px-5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-40",
        RING,
      )}
    >
      Cancel
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      // Keep Enter/typing here from reaching a surrounding product form.
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cat-dialog-title"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[26px] bg-card p-6 shadow-[0_8px_32px_-8px_rgba(0,0,0,.35)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="cat-dialog-title"
              className="text-xl font-semibold tracking-tight"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-40",
              RING,
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {editing ? (
          <form onSubmit={submitEdit} className="mt-5 space-y-5">
            <div>{nameField}</div>
            <div>
              <p className="mb-2 text-sm font-medium">Picture</p>
              {picture}
            </div>
            <div className="flex items-center justify-end gap-2">
              {cancelBtn}
              <button
                type="submit"
                disabled={saving || !changed}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60",
                  RING,
                )}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        ) : step === 1 ? (
          <form onSubmit={goToImage} className="mt-5">
            {nameField}
            <DialogFooter step={1}>
              {cancelBtn}
              <button
                type="submit"
                className={cn(
                  "h-11 rounded-full bg-primary px-6 text-sm font-medium text-white transition hover:bg-primary/90",
                  RING,
                )}
              >
                Next
              </button>
            </DialogFooter>
          </form>
        ) : (
          <div className="mt-5">
            {picture}
            <DialogFooter step={2}>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={saving}
                className={cn(
                  "h-11 rounded-full px-5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-40",
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
                  "inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60",
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
      <span className="text-xs tabular-nums text-muted-foreground">
        Step {step} of 2
      </span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export default CategoryDialog;
