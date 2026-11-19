"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/store-design/utilts";
import { ImageField, Panel, TextAreaField, TextField } from "../controls";
import { ShopNameChangeDialog } from "../ShopNameChangeDialog";
import { shopNameHint } from "./shared";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export function IdentityPanel({
  design,
  update,
  canChangeSlug = true,
  slugLockMessage,
  shop,
}: PanelProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const addressHint = slugLockMessage
    ? slugLockMessage
    : `shopbd.com/store/${design.storeSlug || "your-store-name"}`;

  return (
    <div className="space-y-5">
      <Panel title="Store basics" description="The first things shoppers see.">
        <div className="space-y-1.5">
          <div className="text-sm font-medium">Store name</div>
          <div className="flex items-center gap-2">
            <Input
              value={design.storeName}
              readOnly
              aria-readonly="true"
              className="h-11 flex-1"
            />
            {shop && (
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0"
                disabled={!shop.canChange}
                onClick={() => setRenameOpen(true)}
              >
                Change name
              </Button>
            )}
          </div>
          {shop && (
            <p className="text-xs leading-5 text-muted-foreground">
              {shopNameHint(shop)}
            </p>
          )}
        </div>
        {shop && (
          <ShopNameChangeDialog
            open={renameOpen}
            currentName={design.storeName}
            currentSlug={design.storeSlug}
            disclaimer={shop.disclaimer}
            onClose={() => setRenameOpen(false)}
            onConfirm={shop.rename}
          />
        )}
        <TextField
          label="Store address"
          value={design.storeSlug}
          onChange={(v) => update({ storeSlug: slugify(v) })}
          placeholder="your-store-name"
          hint={addressHint}
          maxLength={40}
          disabled={!canChangeSlug}
        />
        <TextField
          label="Tagline"
          value={design.tagline}
          onChange={(v) => update({ tagline: v })}
          placeholder="Your style, your way"
          maxLength={80}
        />
        <TextAreaField
          label="Store description"
          hint="Tell shoppers what makes your store special."
          value={design.description}
          onChange={(v) => update({ description: v })}
          rows={4}
          maxLength={300}
        />
      </Panel>

      <Panel
        title="Brand images"
        description="Images are resized automatically."
      >
        <ImageField
          label="Logo"
          hint="A square image works best."
          value={design.logoUrl}
          onChange={(v) => update({ logoUrl: v })}
          maxSize={512}
        />
        <ImageField
          label="Cover image"
          hint="A wide photo used on your About section and when your store is shared."
          value={design.coverUrl}
          onChange={(v) => update({ coverUrl: v })}
        />
      </Panel>
    </div>
  );
}
