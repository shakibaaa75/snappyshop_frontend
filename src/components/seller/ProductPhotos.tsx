"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Check,
  Loader2,
  MoreHorizontal,
  Palette,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImageFile, type ProductOption } from "@/lib/api/products";
import { isColorName } from "@/lib/api/product-variants";
import {
  allPhotoUrls,
  assignImage,
  createValue,
  dropImage,
  orderedOptions,
  readAssignments,
  swapImage,
  variantInfoFor,
  type ImageAssignment,
  type ImageVariantInfo,
  type PhotoSlice,
} from "@/lib/api/product-gallery";
import { InfoTip } from "@/components/ui/info-tip";

export const MAX_PRODUCT_PHOTOS = 10;

export const VARIANT_TIP =
  "Pick which variant (like Red or Blue) this photo belongs to. When a shopper chooses that variant, the page jumps straight to this photo. The main image still always shows first.";

type Props = {
  /** Main image, gallery and variants: everything the gallery reads and writes. */
  value: PhotoSlice;
  onChange: (patch: Partial<PhotoSlice>) => void;
  max?: number;
  /** Product has no variants yet: offers to add some. */
  onStartVariants?: () => void;
  /** Scrolls to the Variants section (to set stock for a value created here). */
  onManageVariants?: () => void;
};

/** Main image first, then the gallery, with blanks and repeats removed. */
export function combinePhotos(main: string, gallery: string[]): string[] {
  return [
    ...new Set([main, ...gallery].map((u) => u?.trim()).filter(Boolean)),
  ] as string[];
}

const patchFrom = (list: string[]) => ({
  mainImageUrl: list[0] ?? "",
  imageUrls: list.slice(1),
});

const KEY_SEP = "::";
const chipKey = (a: ImageAssignment) => `${a.optionId}${KEY_SEP}${a.valueId}`;
const parseKey = (k: string): ImageAssignment | null => {
  const [optionId, valueId] = k.split(KEY_SEP);
  return optionId && valueId ? { optionId, valueId } : null;
};

export function ProductPhotos({
  value,
  onChange,
  max = MAX_PRODUCT_PHOTOS,
  onStartVariants,
  onManageVariants,
}: Props) {
  const photos = useMemo(() => allPhotoUrls(value), [value]);
  const assignments = useMemo(() => readAssignments(value), [value]);
  const usable = useMemo(() => orderedOptions(value.options), [value.options]);
  const namedOptions = useMemo(
    () => value.options.filter((o) => o.name.trim() || o.values.length > 0),
    [value.options],
  );
  const hasVariants = usable.length > 0;

  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [assigning, setAssigning] = useState<string | null>(null);

  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceUrl = useRef("");

  // Uploads finish after the render that started them, so always read the
  // latest data instead of what was captured when the upload began.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  });

  /* ---------- Filter chips (built from the variants) ---------- */

  const chips = useMemo(
    () =>
      usable.flatMap((o) =>
        o.values.map((v) => {
          const key = chipKey({ optionId: o.id, valueId: v.id });
          const count = photos.filter((u) => {
            const a = assignments.get(u);
            return a?.optionId === o.id && a.valueId === v.id;
          }).length;
          return {
            key,
            optionName: o.name.trim(),
            label: v.label.trim() || "Unnamed",
            colorHex: v.colorHex,
            count,
          };
        }),
      ),
    [usable, photos, assignments],
  );

  // A filter that points at a removed variant falls back to "all".
  const activeFilter =
    filter === "all" || filter === "none" || chips.some((c) => c.key === filter)
      ? filter
      : "all";
  const activeChip = chips.find((c) => c.key === activeFilter);
  const unassignedCount = photos.filter(
    (u) => !variantInfoFor(value, u, assignments),
  ).length;

  const visible = photos.filter((u) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "none") return !variantInfoFor(value, u, assignments);
    const a = assignments.get(u);
    const want = parseKey(activeFilter);
    return (
      !!a &&
      !!want &&
      a.optionId === want.optionId &&
      a.valueId === want.valueId
    );
  });

  /* ---------- Changes ---------- */

  const upload = async (files: File[], replacing?: string) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      if (files.length > 0)
        setError("Please choose image files (JPG, PNG, WebP).");
      return;
    }
    setError(null);
    setNotice(null);

    if (replacing) {
      setUploading((n) => n + 1);
      try {
        const url = await uploadImageFile(images[0]);
        const cur = latest.current;
        const list = [
          ...new Set(allPhotoUrls(cur).map((u) => (u === replacing ? url : u))),
        ];
        onChange({
          ...patchFrom(list),
          combinations: swapImage(cur.combinations, replacing, url),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setUploading((n) => n - 1);
      }
      return;
    }

    const room = max - allPhotoUrls(latest.current).length;
    if (room <= 0) {
      setError(`You can add up to ${max} photos.`);
      return;
    }
    const batch = images.slice(0, room);
    if (images.length > room)
      setError(`Only ${room} more photo(s) fit. The rest were skipped.`);

    // New photos go to the variant being filtered, so they link automatically.
    const target =
      activeFilter === "all" || activeFilter === "none"
        ? null
        : parseKey(activeFilter);

    setUploading((n) => n + batch.length);
    const results = await Promise.allSettled(
      batch.map((f) => uploadImageFile(f)),
    );
    setUploading((n) => n - batch.length);

    const urls = results
      .filter(
        (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled",
      )
      .map((r) => r.value);
    const failed = results.length - urls.length;
    if (failed > 0) {
      setError(
        failed === results.length
          ? "Upload failed. Please try again."
          : `${failed} photo(s) could not be uploaded.`,
      );
    }
    if (urls.length === 0) return;

    const cur = latest.current;
    const list = [...new Set([...allPhotoUrls(cur), ...urls])];
    let slice: PhotoSlice = { ...cur, ...patchFrom(list) };
    let patch: Partial<PhotoSlice> = patchFrom(list);

    if (target) {
      for (const u of urls) {
        const r = assignImage(slice, u, target, list);
        if ("error" in r) {
          setError(`${r.error} The photo was added without a variant.`);
          break;
        }
        slice = {
          ...slice,
          combinations: r.combinations,
          variantImageMode: r.variantImageMode,
        };
      }
      patch = {
        ...patch,
        combinations: slice.combinations,
        variantImageMode: slice.variantImageMode,
      };
    }
    onChange(patch);
  };

  const remove = (url: string) => {
    onChange({
      ...patchFrom(photos.filter((u) => u !== url)),
      combinations: dropImage(value.combinations, url),
    });
  };
  const makeMain = (url: string) =>
    onChange(patchFrom([url, ...photos.filter((u) => u !== url)]));
  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(patchFrom(next));
  };

  /** Returns an error message, or null when it worked. */
  const pickVariant = (
    url: string,
    target: ImageAssignment | null,
  ): string | null => {
    const r = assignImage(value, url, target, photos);
    if ("error" in r) return r.error;
    onChange({
      combinations: r.combinations,
      variantImageMode: r.variantImageMode,
    });
    setNotice(null);
    return null;
  };

  const createAndPick = (
    url: string,
    optionId: string,
    label: string,
    colorHex?: string,
  ): string | null => {
    const made = createValue(value, optionId, label, colorHex);
    if ("error" in made) return made.error;
    const next: PhotoSlice = {
      ...value,
      options: made.options,
      combinations: made.combinations,
    };
    const r = assignImage(
      next,
      url,
      { optionId, valueId: made.valueId },
      photos,
    );
    if ("error" in r) return r.error;
    onChange({
      options: made.options,
      combinations: r.combinations,
      variantImageMode: r.variantImageMode,
    });
    const created = made.options !== value.options;
    setNotice(
      created
        ? `Added “${label.trim()}” and linked this photo. Set its stock in the Variants section.`
        : null,
    );
    return null;
  };

  const hasFiles = (e: React.DragEvent) =>
    Array.from(e.dataTransfer.types).includes("Files");

  const full = photos.length >= max;
  const main = photos[0];
  const mainInfo = main ? variantInfoFor(value, main, assignments) : null;

  const addLabel = activeChip
    ? `Add photos to ${activeChip.label}`
    : "Add photos";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {photos.length} of {max} photos
          {photos.length > 1 && activeFilter === "all" && " · drag to reorder"}
        </p>
        <button
          type="button"
          onClick={() => addRef.current?.click()}
          disabled={full}
          className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> Drag &amp; drop or upload
        </button>
      </div>

      <div
        onDragOver={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setDropping(false);
          void upload(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "rounded-xl transition",
          dropping && "bg-accent/5 ring-2 ring-accent ring-offset-2",
        )}
      >
        {photos.length === 0 && uploading === 0 ? (
          <button
            type="button"
            onClick={() => addRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition hover:border-accent hover:bg-accent/5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">Add your main photo</span>
            <span className="text-xs text-muted-foreground">
              Drop photos here or click to upload. The first one is the main
              image shoppers see on the product page.
            </span>
          </button>
        ) : (
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            {/* ---------------- Main image + "Add a variant to this image" */}
            <div className="space-y-2.5">
              <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted/30 ring-2 ring-accent">
                {main ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={main}
                    alt="Main image"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground shadow">
                  <Star className="h-3 w-3 fill-current" /> Main image
                </span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Shoppers see this image first on your product page.
              </p>

              {main && hasVariants && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAssigning(main)}
                    className={cn(
                      "inline-flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition hover:border-accent hover:text-accent",
                      !mainInfo && "border-dashed",
                    )}
                  >
                    {mainInfo?.kind === "value" ? (
                      <>
                        <Swatch hex={mainInfo.colorHex} />
                        <span className="min-w-0 flex-1 truncate">
                          {mainInfo.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Change
                        </span>
                      </>
                    ) : (
                      <>
                        <Palette className="h-4 w-4 shrink-0 text-accent" />
                        <span className="min-w-0 flex-1">
                          {mainInfo?.kind === "custom"
                            ? `${mainInfo.count} variants`
                            : "Add a variant to this image"}
                        </span>
                      </>
                    )}
                  </button>
                  <InfoTip
                    label="What does adding a variant to an image do?"
                    text={VARIANT_TIP}
                  />
                </div>
              )}
            </div>

            {/* ---------------- Combined gallery */}
            <div className="min-w-0 space-y-3">
              {hasVariants && (
                <div>
                  <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                    <Chip
                      active={activeFilter === "all"}
                      onClick={() => setFilter("all")}
                    >
                      All <Count n={photos.length} />
                    </Chip>
                    {chips.map((c) => (
                      <Chip
                        key={c.key}
                        active={activeFilter === c.key}
                        dashed={c.count === 0}
                        onClick={() => setFilter(c.key)}
                      >
                        <Swatch hex={c.colorHex} small />
                        {usable.length > 1 && (
                          <span className="text-muted-foreground">
                            {c.optionName}:
                          </span>
                        )}
                        {c.label} <Count n={c.count} />
                      </Chip>
                    ))}
                    <Chip
                      active={activeFilter === "none"}
                      onClick={() => setFilter("none")}
                    >
                      No variant <Count n={unassignedCount} />
                    </Chip>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {activeChip
                      ? `Showing photos for ${activeChip.label}. New uploads link to it automatically.`
                      : "Filter by variant. Choose one, then upload to link new photos to it."}
                  </p>
                </div>
              )}

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visible.map((url) => {
                  const i = photos.indexOf(url);
                  const info = variantInfoFor(value, url, assignments);
                  return (
                    <li
                      key={url}
                      draggable={activeFilter === "all"}
                      onDragStart={(e) => {
                        setDragFrom(i);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(i));
                      }}
                      onDragOver={(e) => {
                        if (dragFrom !== null && !hasFiles(e))
                          e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (dragFrom === null || hasFiles(e)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        move(dragFrom, i);
                        setDragFrom(null);
                      }}
                      onDragEnd={() => setDragFrom(null)}
                      className={cn(
                        "group relative aspect-square overflow-hidden rounded-xl border bg-muted/30",
                        activeFilter === "all" &&
                          "cursor-grab active:cursor-grabbing",
                        i === 0 && "ring-2 ring-accent",
                        dragFrom === i && "opacity-40",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={i === 0 ? "Main image" : `Photo ${i + 1}`}
                        draggable={false}
                        className="h-full w-full object-cover"
                      />

                      {i === 0 && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground shadow">
                          <Star className="h-3 w-3 fill-current" /> Main
                        </span>
                      )}

                      <button
                        type="button"
                        aria-label={`Photo ${i + 1} options`}
                        aria-expanded={menuFor === url}
                        onClick={() => setMenuFor(menuFor === url ? null : url)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-foreground shadow transition hover:bg-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {/* Variant tag: tap to assign or change, no re-upload */}
                      {hasVariants && (
                        <button
                          type="button"
                          onClick={() => setAssigning(url)}
                          aria-label={
                            info?.kind === "value"
                              ? `Variant ${info.label}. Change`
                              : "Assign a variant"
                          }
                          className={cn(
                            "absolute bottom-2 left-2 right-2 inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium shadow transition",
                            info
                              ? "bg-white/95 text-foreground hover:bg-white"
                              : "border border-dashed border-white/80 bg-black/45 text-white hover:bg-black/60",
                          )}
                        >
                          <TagInner info={info} />
                        </button>
                      )}

                      {menuFor === url && (
                        <>
                          <button
                            type="button"
                            aria-label="Close menu"
                            className="fixed inset-0 z-10 cursor-default"
                            onClick={() => setMenuFor(null)}
                          />
                          <div className="absolute right-2 top-10 z-20 w-44 overflow-hidden rounded-lg border bg-popover py-1 text-sm shadow-lg">
                            {i > 0 && (
                              <MenuItem
                                onClick={() => {
                                  makeMain(url);
                                  setMenuFor(null);
                                }}
                              >
                                <Star className="h-3.5 w-3.5" /> Make main image
                              </MenuItem>
                            )}
                            {hasVariants && (
                              <MenuItem
                                onClick={() => {
                                  setAssigning(url);
                                  setMenuFor(null);
                                }}
                              >
                                <Palette className="h-3.5 w-3.5" />{" "}
                                {info ? "Change variant" : "Add a variant"}
                              </MenuItem>
                            )}
                            <MenuItem
                              onClick={() => {
                                replaceUrl.current = url;
                                setMenuFor(null);
                                replaceRef.current?.click();
                              }}
                            >
                              <Upload className="h-3.5 w-3.5" /> Replace
                            </MenuItem>
                            <MenuItem
                              danger
                              onClick={() => {
                                remove(url);
                                setMenuFor(null);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </MenuItem>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}

                {Array.from({ length: uploading }, (_, i) => (
                  <li
                    key={`up-${i}`}
                    className="flex aspect-square items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </li>
                ))}

                {!full && (
                  <li>
                    <button
                      type="button"
                      onClick={() => addRef.current?.click()}
                      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-2 text-center text-muted-foreground transition hover:border-accent hover:text-accent"
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-xs font-medium">{addLabel}</span>
                      <span className="text-[11px] opacity-70">
                        (up to {max})
                      </span>
                    </button>
                  </li>
                )}
              </ul>

              {visible.length === 0 && uploading === 0 && (
                <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  No photos here yet. Upload one, or open another photo and
                  choose this variant.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-accent">
          <Check className="h-3.5 w-3.5" /> {notice}
          {onManageVariants && (
            <button
              type="button"
              onClick={onManageVariants}
              className="font-medium underline"
            >
              Go to Variants
            </button>
          )}
        </p>
      )}

      {/* No variants yet: offer to add some. */}
      {photos.length > 0 && !hasVariants && onStartVariants && (
        <button
          type="button"
          onClick={onStartVariants}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed px-3.5 py-3 text-left transition hover:border-accent hover:bg-accent/5"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Palette className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                Does it come in other colors or sizes?
              </span>
              <span className="block text-xs text-muted-foreground">
                Add variants, then link each photo to one. No re-uploading.
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      )}

      <input
        ref={addRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void upload(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void upload(Array.from(e.target.files ?? []), replaceUrl.current);
          e.target.value = "";
        }}
      />

      {assigning && (
        <AssignDialog
          url={assigning}
          isMain={assigning === main}
          options={namedOptions}
          current={assignments.get(assigning) ?? null}
          onClose={() => setAssigning(null)}
          onPick={(t) => pickVariant(assigning, t)}
          onCreate={(optionId, label, hex) =>
            createAndPick(assigning, optionId, label, hex)
          }
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assign a variant to one image                                       */
/* ------------------------------------------------------------------ */

function AssignDialog({
  url,
  isMain,
  options,
  current,
  onClose,
  onPick,
  onCreate,
}: {
  url: string;
  isMain: boolean;
  options: ProductOption[];
  current: ImageAssignment | null;
  onClose: () => void;
  onPick: (target: ImageAssignment | null) => string | null;
  onCreate: (
    optionId: string,
    label: string,
    colorHex?: string,
  ) => string | null;
}) {
  const firstColor = options.find(
    (o) => isColorName(o.name) && o.values.length,
  );
  const [optionId, setOptionId] = useState(
    current?.optionId ?? firstColor?.id ?? options[0]?.id ?? "",
  );
  const [label, setLabel] = useState("");
  const [hex, setHex] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const option = options.find((o) => o.id === optionId);
  const noun = option?.name.trim().toLowerCase() || "value";
  const wantsColor = !!option && isColorName(option.name);

  const finish = (err: string | null) => {
    if (err) setError(err);
    else onClose();
  };

  const add = () =>
    finish(
      onCreate(optionId, label, wantsColor ? hex || undefined : undefined),
    );

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a variant to this image"
        className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border bg-background p-4 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-5"
      >
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg border object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 text-base font-semibold">
              Add a variant to this image
              <InfoTip label="What does this do?" text={VARIANT_TIP} />
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isMain
                ? "This is your main image. It still shows first for everyone."
                : "Link this photo to a variant. No need to upload it again."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {options.length > 1 && (
          <div
            className="mt-4 flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Variant option"
          >
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="tab"
                aria-selected={o.id === optionId}
                onClick={() => {
                  setOptionId(o.id);
                  setError(null);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  o.id === optionId
                    ? "border-accent bg-accent text-accent-foreground"
                    : "hover:border-accent",
                )}
              >
                {o.name.trim() || "Option"}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Choose an existing {noun}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {option && option.values.length > 0 ? (
              option.values.map((v) => {
                const selected =
                  current?.optionId === option.id && current.valueId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      finish(onPick({ optionId: option.id, valueId: v.id }))
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border bg-background py-1.5 pl-2 pr-3 text-sm font-medium transition hover:border-accent",
                      selected && "border-accent bg-accent/10 text-accent",
                    )}
                  >
                    <Swatch hex={v.colorHex} />
                    {v.label.trim() || "Unnamed"}
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground">
                No {noun} values yet. Create the first one below.
              </p>
            )}
          </div>
        </div>

        {option && (
          <div className="mt-5 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Or create a new {noun}
            </p>
            <div className="mt-2 flex gap-2">
              {wantsColor && (
                <input
                  type="color"
                  value={hex || "#888888"}
                  onChange={(e) => setHex(e.target.value)}
                  aria-label="Pick a color"
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border bg-background p-1"
                />
              )}
              <input
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // The product form blocks Enter; this field handles it.
                    e.preventDefault();
                    e.stopPropagation();
                    if (label.trim()) add();
                  }
                }}
                placeholder={wantsColor ? "Green" : "New value"}
                maxLength={40}
                className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={add}
                disabled={!label.trim()}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground transition disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              It is added under “{option.name.trim() || "Option"}” and linked to
              this image.
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          {current ? (
            <button
              type="button"
              onClick={() => finish(onPick(null))}
              className="text-sm font-medium text-destructive hover:underline"
            >
              Remove variant
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Swatch({ hex, small }: { hex?: string; small?: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border",
        small ? "h-3.5 w-3.5" : "h-4 w-4",
        !hex && "hidden",
      )}
      style={hex ? { background: hex } : undefined}
    />
  );
}

function TagInner({ info }: { info: ImageVariantInfo | null }) {
  if (info?.kind === "value") {
    return (
      <>
        <Swatch hex={info.colorHex} small />
        <span className="min-w-0 truncate">{info.label}</span>
      </>
    );
  }
  if (info?.kind === "custom") {
    return <span className="truncate">{info.count} variants</span>;
  }
  return (
    <>
      <Plus className="h-3 w-3 shrink-0" />
      <span className="truncate">Variant</span>
    </>
  );
}

function Chip({
  active,
  dashed,
  onClick,
  children,
}: {
  active: boolean;
  dashed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "bg-background hover:border-accent",
        dashed && !active && "border-dashed",
      )}
    >
      {children}
    </button>
  );
}

const Count = ({ n }: { n: number }) => (
  <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
    {n}
  </span>
);

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-muted",
        danger && "text-destructive hover:bg-destructive/10",
      )}
    >
      {children}
    </button>
  );
}
