"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { personalApi, type PersonalInfo } from "@/lib/api/personal";
import { deleteUpload, resizeAndUploadImage } from "@/lib/api/uploads";
import { Button } from "@/components/ui/button";
import { BuyerAvatar } from "@/components/account/BuyerAvatar";
import { parseError } from "./helpers";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // shrunk in the browser before upload

/**
 * The owner's own picture. Uploaded through the normal image pipeline (kind
 * "avatar", stored in its own R2 folder), then attached to the account by id.
 * It is not the store logo.
 */
export function AvatarEditor({
  name,
  avatarUrl,
  onChange,
}: {
  name: string;
  avatarUrl: string;
  onChange: (p: PersonalInfo) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const up = await resizeAndUploadImage(file, "avatar", { maxSize: 512, quality: 0.88 });
      try {
        return await personalApi.setAvatar(up.id);
      } catch (e) {
        // Don't leave an unused file behind.
        void deleteUpload(up.id).catch(() => undefined);
        throw e;
      }
    },
    onMutate: () => setError(""),
    onSuccess: onChange,
    onError: (e) =>
      setError(parseError(e, e instanceof Error ? e.message : "We couldn't upload that photo.").message),
  });

  const remove = useMutation({
    mutationFn: personalApi.removeAvatar,
    onMutate: () => setError(""),
    onSuccess: onChange,
    onError: (e) => setError(parseError(e, "We couldn't remove the photo.").message),
  });

  const busy = upload.isPending || remove.isPending;

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Use a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("That photo is too large. Choose one under 8 MB.");
      return;
    }
    upload.mutate(file);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border pb-5">
      <BuyerAvatar name={name} src={avatarUrl || undefined} className="h-20 w-20 text-xl" />
      <div className="min-w-0">
        <p className="text-sm font-medium">Profile picture</p>
        <p className="text-xs text-muted-foreground">
          Only you see this. JPG, PNG or WebP.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose a profile picture"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = ""; // allow choosing the same file again
            }}
          />
          <Button size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            {upload.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {avatarUrl ? "Change photo" : "Upload photo"}
          </Button>
          {avatarUrl && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => remove.mutate()}>
              {remove.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Remove
            </Button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
