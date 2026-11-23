"use client";

import {
  galleryImagePosition,
  galleryOptions,
  isScrollingGallery,
  templateGallery,
} from "@/lib/store-design/template-gallery";
import { type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { UpgradeNotice } from "@/components/seller/plan-lock";
import { useEntitlements } from "@/lib/query/entitlements";
import { premiumDesignAllowed } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import {
  type GalleryItem,
  MAX_GALLERY_ITEMS,
  uid,
} from "@/lib/store-design/types";
import {
  ChoiceGrid,
  ColorField,
  IconButton,
  ImageField,
  Segmented,
  TextField,
  ToggleRow,
} from "../controls";
import { type PanelProps } from "./types";

import { StoreLinkPicker } from "./store-link-picker";

export function GallerySettings({
  titleNode,
  products,
  categories,
  design,
  update,
}: { titleNode: ReactNode } & Pick<
  PanelProps,
  "design" | "update" | "products" | "categories"
>) {
  const { entitlements } = useEntitlements();
  const premium = premiumDesignAllowed(entitlements);
  const items = design.galleryItems;
  const gallery = templateGallery(design.template, design.galleryLayout);
  const duo = gallery.base === "duo";
  const bento = gallery.base === "bento" || duo;

  const patch = (id: string, p: Partial<GalleryItem>) =>
    update({
      galleryItems: items.map((g) => (g.id === id ? { ...g, ...p } : g)),
    });

  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    update({ galleryItems: next });
  };

  return (
    <div className="space-y-4">
      {!premium && (
        <UpgradeNotice title="Image gallery is a premium section">
          Upgrade to show it on your store. You can prepare your photos now.
        </UpgradeNotice>
      )}
      {titleNode}
      {!bento && (
        <TextField
          label="Text beside the title"
          value={design.gallerySubtitle}
          onChange={(v) => update({ gallerySubtitle: v })}
          maxLength={140}
          placeholder="A short line about this collection"
        />
      )}
      <div className="space-y-3">
        <p className="text-sm font-medium">Gallery layout</p>
        <ChoiceGrid
          label="Gallery layout"
          cols={2}
          value={gallery.id}
          onChange={(id) => {
            const option = templateGallery(design.template, id);
            update({ galleryLayout: option.id, galleryStyle: option.base });
          }}
          options={galleryOptions(design.template).map((option) => ({
            value: option.id,
            label:
              option.name + (isScrollingGallery(option) ? " · Scroll" : ""),
            preview: (
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  width: 84,
                  height: 52,
                  overflow: "hidden",
                  gap: 2,
                  gridTemplateColumns: `repeat(${option.mode === "rail" ? 4 : option.columns}, 1fr)`,
                  gridAutoRows: 7,
                }}
              >
                {Array.from(
                  { length: Math.min(6, Math.max(3, option.cells.length)) },
                  (_, index) => {
                    const cell = option.cells[index % option.cells.length];
                    return (
                      <span
                        key={index}
                        className="bg-foreground/30"
                        style={{
                          gridColumn: `span ${option.mode === "rail" ? 1 : cell.columns}`,
                          gridRow: `span ${cell.rows}`,
                          borderRadius:
                            option.shape === "circle"
                              ? "50%"
                              : option.shape === "arch"
                                ? "50% 50% 0 0"
                                : 2,
                          marginTop: index % 2 && option.stagger ? 3 : 0,
                        }}
                      />
                    );
                  },
                )}
              </span>
            ),
          }))}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Six choices for this template, including your original gallery
          designs. Photos and positioning stay saved when you switch.
        </p>
      </div>
      <div className="space-y-3 rounded-xl border p-4">
        {isScrollingGallery(gallery) ? (
          <>
            <ToggleRow
              label="Auto-scroll gallery"
              checked={design.galleryAutoScroll ?? false}
              onChange={(value) => update({ galleryAutoScroll: value })}
            />
            {design.galleryAutoScroll && (
              <label className="block space-y-2 text-xs">
                <span>
                  Scroll speed — {design.galleryScrollSpeed ?? 28} px/sec
                </span>
                <input
                  type="range"
                  min={10}
                  max={80}
                  step={2}
                  className="w-full"
                  value={design.galleryScrollSpeed ?? 28}
                  onChange={(event) =>
                    update({ galleryScrollSpeed: Number(event.target.value) })
                  }
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              Pauses on hover, focus and touch. Visitors can pause it, and
              reduced-motion preferences are respected.
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Auto-scroll is available on filmstrip, marquee, coverflow and
            scrolling-row layouts.
          </p>
        )}
      </div>
      {items.map((g, i) => (
        <div key={g.id} className="space-y-3 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {bento ? "Tile" : "Photo"} {i + 1}
            </p>
            <div className="flex items-center gap-1">
              <IconButton
                label={`Move photo ${i + 1} up`}
                onClick={() => move(i, -1)}
                disabled={i === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={`Move photo ${i + 1} down`}
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={`Delete photo ${i + 1}`}
                danger
                onClick={() =>
                  update({ galleryItems: items.filter((x) => x.id !== g.id) })
                }
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
          <ImageField
            label="Photo"
            hint="Upload a photo, then adjust its position inside the frame below."
            value={g.imageUrl}
            onChange={(v) => patch(g.id, { imageUrl: v })}
          />
          <StoreLinkPicker
            label="Image link"
            url={g.url}
            slug={design.storeSlug}
            products={products}
            categories={categories}
            onChange={(url) => patch(g.id, { url })}
          />
          <label className="block space-y-1 text-xs font-medium">
            <span>Position in gallery</span>
            <select
              className="h-9 w-full rounded-md border bg-background px-2"
              value={i}
              onChange={(event) => {
                const next = [...items];
                const [item] = next.splice(i, 1);
                next.splice(Number(event.target.value), 0, item);
                update({ galleryItems: next });
              }}
            >
              {items.map((item, index) => (
                <option key={item.id} value={index}>
                  Position {index + 1}
                </option>
              ))}
            </select>
          </label>
          {g.imageUrl && (
            <div className="space-y-3 rounded-lg bg-muted/40 p-3">
              <div className="relative h-32 overflow-hidden rounded-md bg-background">
                <img
                  src={g.imageUrl}
                  alt="Photo positioning preview"
                  className="h-full w-full"
                  style={{
                    objectFit: g.imageFit ?? "cover",
                    objectPosition: galleryImagePosition(g),
                  }}
                />
              </div>
              <label className="block space-y-1 text-xs font-medium">
                <span>Image fitting</span>
                <select
                  className="h-9 w-full rounded-md border bg-background px-2"
                  value={g.imageFit ?? "cover"}
                  onChange={(event) =>
                    patch(g.id, {
                      imageFit:
                        event.target.value === "contain" ? "contain" : "cover",
                    })
                  }
                >
                  <option value="cover">Fill frame (crop)</option>
                  <option value="contain">Show full image</option>
                </select>
              </label>
              <label className="block space-y-1 text-xs">
                <span>Horizontal position — {g.imagePositionX ?? 50}%</span>
                <input
                  className="w-full"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={g.imagePositionX ?? 50}
                  onChange={(event) =>
                    patch(g.id, { imagePositionX: Number(event.target.value) })
                  }
                />
              </label>
              <label className="block space-y-1 text-xs">
                <span>Vertical position — {g.imagePositionY ?? 50}%</span>
                <input
                  className="w-full"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={g.imagePositionY ?? 50}
                  onChange={(event) =>
                    patch(g.id, { imagePositionY: Number(event.target.value) })
                  }
                />
              </label>
              <p className="text-[11px] text-muted-foreground">
                Position moves the photo where cropping or empty space allows.
                Check the store preview for the actual frame.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  patch(g.id, { imagePositionX: 50, imagePositionY: 50 })
                }
              >
                Center image
              </Button>
            </div>
          )}
          {bento ? (
            <>
              <TextField
                label="Small line above (optional)"
                value={g.eyebrow ?? ""}
                onChange={(v) => patch(g.id, { eyebrow: v })}
                maxLength={32}
                placeholder="NEW SEASON"
              />
              <TextField
                label="Headline"
                value={g.caption}
                onChange={(v) => patch(g.id, { caption: v })}
                maxLength={60}
                placeholder="Jackets for the modern man"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Big text (optional)"
                  value={g.badge ?? ""}
                  onChange={(v) => patch(g.id, { badge: v })}
                  maxLength={12}
                  placeholder="50%"
                />
                <TextField
                  label="Button text"
                  value={g.buttonText ?? ""}
                  onChange={(v) => patch(g.id, { buttonText: v })}
                  maxLength={24}
                  placeholder="Shop now"
                />
              </div>
              {g.imageUrl ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Text color on the photo</p>
                  <Segmented
                    label="Text color on the photo"
                    value={g.tone ?? "dark"}
                    onChange={(v) => patch(g.id, { tone: v })}
                    options={[
                      { value: "dark", label: "Dark (light photo)" },
                      { value: "light", label: "Light (dark photo)" },
                    ]}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <ColorField
                    label="Tile color"
                    hint="Used when there is no photo. Text color is picked for you."
                    value={g.color || design.primaryColor}
                    onChange={(v) => patch(g.id, { color: v })}
                  />
                  {g.color && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-2 text-xs"
                      onClick={() => patch(g.id, { color: "" })}
                    >
                      Use my store&apos;s main color
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <TextField
                label="Caption"
                value={g.caption}
                onChange={(v) => patch(g.id, { caption: v })}
                maxLength={60}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Price (optional)"
                  value={g.price}
                  onChange={(v) => patch(g.id, { price: v })}
                  maxLength={24}
                  placeholder="Tk 1,799"
                />
              </div>
            </>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={items.length >= MAX_GALLERY_ITEMS}
        onClick={() =>
          update({
            galleryItems: [
              ...items,
              {
                id: uid(),
                imageUrl: "",
                caption: "",
                price: "",
                url: "",
                eyebrow: "",
                buttonText: bento ? "Shop now" : "",
                badge: "",
                color: "",
                tone: "dark",
              },
            ],
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Add photo
        {items.length > 0 ? ` (${items.length}/${MAX_GALLERY_ITEMS})` : ""}
      </Button>
    </div>
  );
}
