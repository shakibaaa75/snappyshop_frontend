"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";

interface ImageDropzoneProps {
  onChange: (files: File[]) => void;
}

// FIX: Ensure this is a NAMED export, not `export default`
export function ImageDropzone({ onChange }: ImageDropzoneProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newPreviews = acceptedFiles.map((file) =>
        URL.createObjectURL(file),
      );
      setPreviews((prev) => [...prev, ...newPreviews]);
      onChange(acceptedFiles);
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  const removeImage = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-accent bg-accent/5"
            : "border-muted hover:border-accent/50"
        }`}
      >
        <input {...getInputProps()} />
        <ImagePlus className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground text-center">
          Drag & drop product images here, or{" "}
          <span className="text-accent font-medium">browse</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, WEBP up to 5MB
        </p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {previews.map((src, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-lg overflow-hidden border group"
            >
              <Image
                src={src}
                alt={`Preview ${idx}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
