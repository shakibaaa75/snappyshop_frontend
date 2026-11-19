"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, X } from "lucide-react";
import { adminCategories } from "@/lib/api/adminCategories";
import { resizeAndUpload } from "@/lib/api/uploads";
import { CategoryThumb } from "@/components/seller/CategoryThumb";
import { cn } from "@/lib/utils";

/**
 * Round picture for a main type or a category in the admin panel.
 * Click it to choose a photo; it is uploaded and saved straight away.
 * The small x removes the picture again.
 */
export function CategoryImagePicker({
  id,
  name,
  imageUrl,
  size = "sm",
}: {
  id: string;
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "lg";
}) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const dims = size === "lg" ? "h-14 w-14" : "h-8 w-8";

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    void qc.invalidateQueries({ queryKey: ["category-tree"] });
  };

  const save = async (url: string) => {
    setBusy(true);
    setError("");
    try {
      await adminCategories.setImage(id, url);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the picture.");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await resizeAndUpload(file, "category", {
        maxSize: 600,
        quality: 0.85,
        presignPath: "/admin/uploads/presign",
      });
      await adminCategories.setImage(id, url);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <span className="relative inline-flex shrink-0 items-center gap-2">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        aria-label={`Change picture for ${name}`}
        title="Change picture"
        className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait"
      >
        <CategoryThumb
          name={name}
          imageUrl={imageUrl}
          className={dims}
          textClassName={size === "lg" ? "text-lg" : "text-xs"}
        />
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white transition",
            busy
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </span>
      </button>

      {imageUrl && !busy && (
        <button
          type="button"
          onClick={() => void save("")}
          aria-label={`Remove picture for ${name}`}
          title="Remove picture"
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border bg-white text-neutral-600 shadow-sm hover:text-red-600"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {error && (
        <span role="alert" className="max-w-[16rem] text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
