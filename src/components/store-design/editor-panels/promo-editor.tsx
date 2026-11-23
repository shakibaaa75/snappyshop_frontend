"use client";

import { StoreLinkPicker } from "./store-link-picker";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type StoreDesign, uid } from "@/lib/store-design/types";
import { ColorField, IconButton, TextField } from "../controls";
import { type PanelProps } from "./types";

export function PromoEditor({
  design,
  products,
  categories,
  update,
}: Pick<PanelProps, "design" | "update" | "products" | "categories">) {
  const patch = (id: string, p: Partial<StoreDesign["promoBanners"][number]>) =>
    update({
      promoBanners: design.promoBanners.map((b) =>
        b.id === id ? { ...b, ...p } : b,
      ),
    });

  return (
    <div className="space-y-3">
      {design.promoBanners.map((b, i) => (
        <div key={b.id} className="space-y-3 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Banner {i + 1}</p>
            <IconButton
              label={`Delete banner ${i + 1}`}
              danger
              onClick={() =>
                update({
                  promoBanners: design.promoBanners.filter(
                    (x) => x.id !== b.id,
                  ),
                })
              }
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
          <TextField
            label="Headline"
            value={b.title}
            onChange={(v) => patch(b.id, { title: v })}
            maxLength={40}
          />
          <TextField
            label="Supporting text"
            value={b.subtitle}
            onChange={(v) => patch(b.id, { subtitle: v })}
            maxLength={80}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Button text"
              value={b.buttonText}
              onChange={(v) => patch(b.id, { buttonText: v })}
              maxLength={24}
            />
            <StoreLinkPicker
              label="Banner link"
              slug={design.storeSlug}
              products={products}
              categories={categories}
              url={b.url}
              onChange={(url) => patch(b.id, { url })}
            />
          </div>
          <ColorField
            label="Banner color"
            value={b.color}
            onChange={(v) => patch(b.id, { color: v })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={design.promoBanners.length >= 3}
        onClick={() =>
          update({
            promoBanners: [
              ...design.promoBanners,
              {
                id: uid(),
                title: "New offer",
                subtitle: "Tell shoppers what's on offer",
                buttonText: "Shop now",
                url: "/",
                color: design.primaryColor,
              },
            ],
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        {design.promoBanners.length >= 3
          ? "Maximum of 3 banners"
          : "Add banner"}
      </Button>
    </div>
  );
}
