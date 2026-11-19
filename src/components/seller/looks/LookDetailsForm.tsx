"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadImageFile } from "@/lib/api/products";
import type { LookGender, LookInput } from "@/lib/api/looks";
import { cn } from "@/lib/utils";

/**
 * Title, model gender and the main model image. Used to create a look and to
 * edit its details. The model image is a showcase only, never a product.
 */
export function LookDetailsForm({
  value,
  onChange,
  errors,
}: {
  value: LookInput;
  onChange: (v: LookInput) => void;
  errors?: Record<string, string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      const url = await uploadImageFile(file, "look_model");
      onChange({ ...value, modelImageUrl: url });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const genders: { id: LookGender | ""; label: string }[] = [
    { id: "", label: "Not set" },
    { id: "female", label: "Female" },
    { id: "male", label: "Male" },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40 text-xs text-muted-foreground transition hover:bg-muted"
        >
          {value.modelImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.modelImageUrl}
              alt="Model"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex flex-col items-center gap-1.5 p-3 text-center">
              <Upload className="h-5 w-5" />
              Upload main model image
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
        {value.modelImageUrl && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 text-xs font-medium underline underline-offset-2"
          >
            Replace image
          </button>
        )}
        {(uploadError || errors?.modelImageUrl) && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {uploadError ?? errors?.modelImageUrl}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium" htmlFor="look-title">
            Look name
          </label>
          <input
            id="look-title"
            value={value.title}
            maxLength={80}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="e.g. Weekend casual"
            className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          {errors?.title && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.title}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">Model</p>
          <div className="mt-1.5 flex gap-2">
            {genders.map((g) => (
              <button
                key={g.id || "none"}
                type="button"
                onClick={() => onChange({ ...value, gender: g.id })}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition",
                  value.gender === g.id
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-muted",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          The model photo is only a showcase. It is not a product and never
          appears in listings or search.
        </p>
      </div>
    </div>
  );
}
