"use client";

import { type ReactNode } from "react";
import { Panel, TextAreaField, TextField } from "../controls";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* SEO                                                                 */
/* ------------------------------------------------------------------ */

export function SeoPanel({ design, update }: PanelProps) {
  const title = design.seoTitle || design.storeName || "Your store";
  const desc =
    design.seoDescription ||
    design.description ||
    "Your description will appear here.";
  const url = `shopbd.com/store/${design.storeSlug || "your-store"}`;

  const Label = ({ children }: { children: ReactNode }) => (
    <p className="text-xs font-medium text-muted-foreground">{children}</p>
  );

  return (
    <div className="space-y-5">
      <Panel
        title="Search results"
        description="How your store appears on Google."
      >
        <TextField
          label="Page title"
          hint={`${design.seoTitle.length}/60. Shorter titles display fully.`}
          value={design.seoTitle}
          onChange={(v) => update({ seoTitle: v })}
          maxLength={70}
        />
        <TextAreaField
          label="Description"
          hint={`${design.seoDescription.length}/160. Describe what you sell in a sentence or two.`}
          value={design.seoDescription}
          onChange={(v) => update({ seoDescription: v })}
          rows={3}
          maxLength={180}
        />
        <div className="space-y-2 rounded-xl border bg-background p-4">
          <Label>Google preview</Label>
          <p className="truncate text-lg text-blue-700">{title}</p>
          <p className="truncate text-xs text-primary">{url}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{desc}</p>
        </div>
      </Panel>

      <Panel
        title="Link sharing"
        description="How your store looks when shared on Facebook or WhatsApp."
      >
        <div className="overflow-hidden rounded-xl border bg-background">
          <div
            className="flex aspect-[1.91/1] items-center justify-center bg-muted text-sm text-muted-foreground"
            style={
              design.coverUrl
                ? {
                    backgroundImage: `url(${design.coverUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {!design.coverUrl && "Add a cover image in Store identity"}
          </div>
          <div className="space-y-0.5 border-t p-3">
            <p className="truncate text-[11px] text-muted-foreground">{url}</p>
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
