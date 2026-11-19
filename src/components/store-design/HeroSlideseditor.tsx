"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  uid,
  type HeroSlide,
  type HeroStyle,
  type StoreDesign,
} from "@/lib/store-design/types";
import { ColorField, IconButton, ImageField, TextField } from "./controls";
import { HeroStyleEditor } from "./HeroStyleEditor";

const MAX_SLIDES = 5;

/**
 * Add, edit, reorder and delete extra hero banners. Every banner has its own
 * text, image AND design (layout, style, alignment, sizes, colors, button).
 * Save as: components/store-design/HeroSlidesEditor.tsx
 */
export function HeroSlidesEditor({
  design,
  update,
}: {
  design: StoreDesign;
  update: (patch: Partial<StoreDesign>) => void;
}) {
  const slides = design.heroSlides ?? [];
  const [designOpen, setDesignOpen] = useState<string | null>(null);

  const set = (next: HeroSlide[]) => update({ heroSlides: next });

  const patch = (id: string, p: Partial<HeroSlide>) =>
    set(slides.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const patchStyle = (id: string, p: Partial<HeroStyle>) =>
    set(
      slides.map((s) =>
        s.id === id ? { ...s, style: { ...s.style, ...p } } : s,
      ),
    );

  const move = (i: number, dir: -1 | 1) => {
    const next = [...slides];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">More banners</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          Extra banners slide in after the main one. Each has its own text,
          image and design. A banner needs a headline to show up.
        </p>
      </div>

      {slides.map((s, i) => {
        const open = designOpen === s.id;
        return (
          <div key={s.id} className="space-y-3 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Banner {i + 2}</p>
              <div className="flex gap-1">
                <IconButton
                  label={`Move banner ${i + 2} up`}
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Move banner ${i + 2} down`}
                  onClick={() => move(i, 1)}
                  disabled={i === slides.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Delete banner ${i + 2}`}
                  danger
                  onClick={() => set(slides.filter((x) => x.id !== s.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>

            <TextField
              label="Headline"
              value={s.title}
              onChange={(v) => patch(s.id, { title: v })}
              maxLength={70}
            />
            <TextField
              label="Supporting text"
              value={s.subtitle}
              onChange={(v) => patch(s.id, { subtitle: v })}
              maxLength={140}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Button text"
                value={s.buttonText}
                onChange={(v) => patch(s.id, { buttonText: v })}
                maxLength={24}
              />
              <TextField
                label="Button link"
                value={s.url}
                onChange={(v) => patch(s.id, { url: v })}
                placeholder="/products"
              />
            </div>
            <ImageField
              label="Banner image"
              hint="Optional. Without one, the banner color is used."
              value={s.imageUrl}
              onChange={(v) => patch(s.id, { imageUrl: v })}
            />
            <ColorField
              label="Brand banner color"
              hint="Used when the style is Brand color and no custom background is set."
              value={s.color || design.primaryColor}
              onChange={(v) => patch(s.id, { color: v })}
            />

            <button
              type="button"
              aria-expanded={open}
              onClick={() => setDesignOpen(open ? null : s.id)}
              className="flex min-h-11 w-full items-center justify-between rounded-lg bg-muted/50 px-3 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Design this banner
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
            {open && (
              <HeroStyleEditor
                value={{
                  layout: design.heroLayout,
                  tone: design.bannerTone,
                  ...s.style,
                }}
                onChange={(p) => patchStyle(s.id, p)}
              />
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={slides.length >= MAX_SLIDES}
        onClick={() =>
          set([
            ...slides,
            {
              id: uid(),
              title: "New banner",
              subtitle: "Tell shoppers what this banner is about",
              buttonText: "Shop now",
              url: "/products",
              imageUrl: "",
              color: design.primaryColor,
            },
          ])
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        {slides.length >= MAX_SLIDES
          ? `Maximum of ${MAX_SLIDES + 1} banners`
          : "Add banner"}
      </Button>
    </div>
  );
}
