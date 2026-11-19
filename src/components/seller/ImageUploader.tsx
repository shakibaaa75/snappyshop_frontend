"use client";

import { useRef, useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImageFile } from "@/lib/api/products";

export function ImageUploader({
  value,
  onChange,
  label,
  hint,
  aspect = "square",
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  hint?: string;
  aspect?: "square" | "portrait" | "landscape";
  maxSize?: number; // kept for backwards compatibility; ignored
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImageFile(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const ratio =
    aspect === "portrait"
      ? "3 / 4"
      : aspect === "landscape"
        ? "4 / 3"
        : "1 / 1";

  return (
    <div className={compact ? "" : "space-y-2"}>
      {label && !compact && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{label}</p>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "group relative w-full overflow-hidden rounded-lg border transition",
          value
            ? "border-border"
            : "border-dashed border-muted-foreground/30 hover:border-accent",
        )}
        style={{ aspectRatio: ratio }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center gap-1 bg-muted/30 text-muted-foreground",
              compact ? "p-1" : "px-3",
            )}
          >
            {compact ? (
              <Plus className="h-4 w-4" />
            ) : (
              <>
                <ImageIcon className="h-5 w-5" />
                <span className="text-xs font-medium">Upload image</span>
                <span className="text-[10px] opacity-70">JPG · PNG · WebP</span>
              </>
            )}
          </div>
        )}

        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}

        {value && !busy && !compact && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
            <Upload className="mr-1 h-3.5 w-3.5" /> Replace
          </span>
        )}

        {value && !busy && compact && (
          <button
            type="button"
            aria-label="Remove image"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </button>

      {hint && !error && !compact && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
      {error && !compact && (
        <p className="text-[11px] text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
