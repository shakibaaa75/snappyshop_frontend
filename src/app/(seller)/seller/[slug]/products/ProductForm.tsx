"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Image as ImageIcon,
  Loader2,
  Package,
  Save,
  Sparkles,
  Star,
  Store,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { productPreviewHref } from "@/lib/api/product-preview";
import {
  sellerProducts,
  slugifyProduct,
  type ProductInput,
  type SellerProduct,
} from "@/lib/api/products";
import {
  categorySearch,
  categoryTree,
  sellerCategories,
} from "@/lib/api/categories";
import {
  blockEnterSubmit,
  cleanAttributes,
  cleanVariants,
  isColorName,
  uid,
  validateAttributes,
  validateVariants,
} from "@/lib/api/product-variants";
import { ProductPhotos } from "@/components/seller/ProductPhotos";
import {
  allPhotoUrls,
  normalizePhotos,
  valueImageUrls,
  type PhotoSlice,
} from "@/lib/api/product-gallery";
import { formatPrice } from "@/lib/format";
import { CategoryPicker } from "@/components/seller/CategoryPicker";
import { VariantsEditor } from "@/components/seller/VariantsEditor";
import { AttributesEditor } from "@/components/seller/AttributesEditor";

/** Fields that have an input on this form. Other backend errors go to the top banner. */
const SHOWN_FIELDS = new Set([
  "name",
  "slug",
  "description",
  "mainId",
  "categoryId",
  "price",
  "comparePrice",
  "stock",
  "sku",
  "variants",
  "attributes",
]);

export function ProductForm({
  initial,
  productId,
  onCreate,
  onCancel,
}: {
  initial?: SellerProduct | null;
  productId?: string;
  /** Embedded mode (Try the Look dialog): save through this instead of the
   *  products API, and stay on the page afterwards. */
  onCreate?: (payload: ProductInput) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { slug } = useParams<{ slug: string }>();
  const isEdit = !!productId;

  const [values, setValues] = useState<ProductInput>(() => {
    const base: ProductInput = {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      // Product type (platform-wide). Prefer the saved ID; otherwise fall back
      // to what the seller typed.
      mainId:
        initial?.mainId && initial.mainId !== "other" ? initial.mainId : "",
      subCategoryId: initial?.subId ?? "",
      customSubCategory: initial?.subId
        ? ""
        : (initial?.customSubCategory ?? ""),
      // Seller's own storefront category
      // A product can have several. The first one is the primary category.
      categoryIds:
        initial?.categoryIds ??
        (initial?.categoryId ? [initial.categoryId] : []),
      categoryNames:
        initial?.categoryNames ??
        (initial?.categoryName ? [initial.categoryName] : []),
      categoryId: initial?.categoryId ?? "",
      categoryName: initial?.categoryName ?? "",
      price: initial?.price ?? 0,
      comparePrice: initial?.comparePrice ?? 0,
      stock: initial?.stock ?? 0,
      sku: initial?.sku ?? "",
      mainImageUrl: initial?.mainImageUrl ?? "",
      imageUrls: initial?.imageUrls ?? [],
      emoji: initial?.emoji ?? "🛍️",
      hue: initial?.hue ?? 210,
      options: initial?.options ?? [],
      combinations: initial?.combinations ?? [],
      attributes: initial?.attributes ?? [],
      variantImageMode: initial?.variantImageMode ?? "shared",
      isNewArrival: initial?.isNewArrival ?? true,
      isFeatured: initial?.isFeatured ?? false,
      isBestSeller: initial?.isBestSeller ?? false,
      tags: initial?.tags ?? [],
      isActive: initial?.isActive ?? true,
    };
    // Variant-only photos from older products join the one gallery.
    return { ...base, ...normalizePhotos(base) };
  });

  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [variantsOn, setVariantsOn] = useState(
    (initial?.options?.length ?? 0) > 0,
  );
  // "Use the same price for all variants". On by default; for an existing
  // product it starts on only if every variant already matches the default
  // price (or has no price of its own).
  const [samePrice, setSamePrice] = useState(() =>
    (initial?.combinations ?? []).every(
      (c) => !c.price || c.price === initial?.price,
    ),
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  // What the form looked like when it opened, to tell if anything changed.
  const snapshot = useRef<string | null>(null);

  // Seller's own storefront categories
  const { data: categories } = useQuery({
    queryKey: ["seller", "categories"],
    queryFn: sellerCategories.list,
  });

  // Platform-wide category tree (Fashion -> Hoodie, ...)
  const {
    data: tree = [],
    isLoading: treeLoading,
    isError: treeError,
    error: treeErr,
    refetch: refetchTree,
  } = useQuery({
    queryKey: ["category-tree"],
    queryFn: categoryTree.get,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Every product type, flat. The backend works out the main category itself.
  // Typo-tolerant search, limited to the chosen Main Type.
  const searchInMain = useMemo(
    () => async (q: string) =>
      values.mainId
        ? (await categorySearch.inMain(values.mainId, q)).map((n) => ({
            id: n.id,
            name: n.name,
          }))
        : [],
    [values.mainId],
  );

  // Suggestions for the shop category box: our official names for the chosen
  // Main Type (no Main Type label shown).
  const categoryPool = useMemo(
    () =>
      (tree.find((c) => c.id === values.mainId)?.children ?? []).map((s) => ({
        name: s.name,
      })),
    [tree, values.mainId],
  );

  useEffectSlug(values.name, slugTouched, setValues);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  /** Clears an error as soon as the seller edits that area again. */
  const clearError = (...keys: string[]) =>
    setFieldErrors((prev) => {
      if (!keys.some((k) => k in prev)) return prev;
      const next = { ...prev };
      for (const k of keys) delete next[k];
      return next;
    });

  const hasVariants = values.combinations.length > 0;

  // While "same price" is on, keep every variant at the default price.
  // This also covers newly generated variants and later price edits.
  // It only sets state when a price actually differs, so it can't loop.
  useEffect(() => {
    if (!samePrice) return;
    setValues((v) =>
      v.combinations.some((c) => c.price !== v.price)
        ? {
            ...v,
            combinations: v.combinations.map((c) => ({
              ...c,
              price: v.price,
            })),
          }
        : v,
    );
  }, [samePrice, values.price, values.combinations]);

  const totalStock = useMemo(() => {
    if (values.combinations.length === 0) return values.stock;
    return values.combinations.reduce((n, c) => n + (c.stock || 0), 0);
  }, [values.stock, values.combinations]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const photoSlice: PhotoSlice = useMemo(
    () => ({
      mainImageUrl: values.mainImageUrl,
      imageUrls: values.imageUrls,
      options: values.options,
      combinations: values.combinations,
      variantImageMode: values.variantImageMode,
    }),
    [
      values.mainImageUrl,
      values.imageUrls,
      values.options,
      values.combinations,
      values.variantImageMode,
    ],
  );

  /** Every image (main first, then gallery and variant photos), no repeats. */
  const photos = useMemo(() => allPhotoUrls(photoSlice), [photoSlice]);

  /** The option whose values show as swatches in the preview: Color if there is one. */
  const photoOption = useMemo(() => {
    const withValues = values.options.filter((o) => o.values.length > 0);
    return withValues.find((o) => isColorName(o.name)) ?? withValues[0];
  }, [values.options]);

  /** Photos linked to each value of that option (for the preview). */
  const valuePhotos = useMemo(() => {
    if (!photoOption) return [];
    return photoOption.values.map((v) => ({
      id: v.id,
      label: v.label,
      colorHex: v.colorHex,
      urls: valueImageUrls(photoSlice, photoOption.id, v.id, photos),
    }));
  }, [photoOption, photoSlice, photos]);

  const scrollToPhotos = () =>
    document
      .getElementById("step-photos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  const scrollToVariants = () =>
    window.setTimeout(
      () =>
        document
          .getElementById("step-variants")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      60,
    );

  const toggleVariants = (on: boolean) => {
    if (on) {
      setVariantsOn(true);
      if (values.options.length === 0) {
        set("options", [{ id: uid("opt"), name: "Color", values: [] }]);
      }
      return;
    }
    const hasData =
      values.combinations.length > 0 ||
      values.options.some((o) => o.values.length > 0);
    if (
      hasData &&
      !window.confirm(
        "Turn off variants? Your colors, sizes and their stock and photos will be removed when you save.",
      )
    ) {
      return;
    }
    setValues((v) => ({
      ...v,
      options: [],
      combinations: [],
      variantImageMode: "shared",
    }));
    clearError("variants");
    setVariantsOn(false);
  };

  const startVariants = () => {
    toggleVariants(true);
    scrollToVariants();
  };

  const dirty = useMemo(() => {
    const now = JSON.stringify(values);
    if (snapshot.current === null) snapshot.current = now;
    return now !== snapshot.current;
  }, [values]);

  // Open "More details" if something inside it needs attention.
  useEffect(() => {
    if (fieldErrors.slug || fieldErrors.sku || fieldErrors.attributes)
      setMoreOpen(true);
  }, [fieldErrors]);

  /** Returns field errors; empty object means the form is valid. */
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (values.name.trim().length < 2) errs.name = "Enter a product name.";
    if (!values.slug.trim()) errs.slug = "Enter a URL slug.";
    if (!values.mainId) errs.mainId = "Choose a main type.";
    if (!(values.price > 0)) errs.price = "Enter a price above 0.";
    if (values.comparePrice > 0 && values.comparePrice <= values.price) {
      errs.comparePrice = "Compare price must be higher than the price.";
    }
    if (values.categoryIds.length === 0) {
      errs.categoryId = "Add at least one category.";
    }

    const variantError = validateVariants(values, values.sku);
    if (variantError) errs.variants = variantError;

    const attrError = validateAttributes(values.attributes);
    if (attrError) errs.attributes = attrError;

    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setTopError(null);

    const problems = validate();
    if (Object.keys(problems).length > 0) {
      setFieldErrors(problems);
      setTopError("Please fix the highlighted fields.");
      scrollTop();
      return;
    }
    setFieldErrors({});
    setSaving(true);

    const chosen = values.categoryIds
      .map((id) => (categories ?? []).find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c);
    const variants = cleanVariants(values);

    // Safety net: if "same price" is on, make sure every saved variant
    // carries the default price, even if the sync effect hasn't run yet.
    const finalCombinations = samePrice
      ? variants.combinations.map((c) => ({ ...c, price: values.price }))
      : variants.combinations;

    const payload: ProductInput = {
      ...values,
      // No separate category field: the server takes the platform category
      // from the primary shop category and standardizes it.
      subCategoryId: "",
      customSubCategory: "",
      // Primary category stays in categoryId/categoryName for older code.
      categoryIds: chosen.map((c) => c.id),
      categoryNames: chosen.map((c) => c.name),
      categoryId: chosen[0]?.id ?? "",
      categoryName: chosen[0]?.name ?? "",
      imageUrls: values.imageUrls.filter((u) => u.trim().length > 0),
      ...variants,
      combinations: finalCombinations,
      attributes: cleanAttributes(values.attributes),
      sku: values.sku.trim(),
      stock: finalCombinations.length
        ? finalCombinations.reduce((n, c) => n + (c.stock || 0), 0)
        : values.stock,
    };

    try {
      if (onCreate) {
        await onCreate(payload);
        qc.invalidateQueries({ queryKey: ["seller", "products"] });
        setSaving(false);
        return;
      }
      if (isEdit) {
        await sellerProducts.update(productId!, payload);
      } else {
        await sellerProducts.create(payload);
      }
      qc.invalidateQueries({ queryKey: ["seller", "products"] });
      router.push(`/seller/${slug}/products`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        // The API reports variant problems under "combinations" and
        // "options"; this form shows them under the variants section.
        const { combinations, options, ...otherFields } = err.fields ?? {};
        const fields: Record<string, string> = { ...otherFields };
        const variantProblem = combinations ?? options;
        if (variantProblem) fields.variants = fields.variants ?? variantProblem;
        const hasFields = Object.keys(fields).length > 0;
        if (hasFields) {
          setFieldErrors(fields);
          // Errors for fields with no input here would otherwise be invisible.
          const hidden = Object.entries(fields)
            .filter(([k]) => !SHOWN_FIELDS.has(k))
            .map(([k, v]) => `${k}: ${v}`);
          setTopError(
            hidden.length > 0
              ? hidden.join(" · ")
              : err.message || "Please fix the highlighted fields.",
          );
        } else {
          setTopError(err.message);
        }
      } else if (err instanceof Error) {
        setTopError(err.message);
      } else {
        setTopError("Something went wrong. Please try again.");
      }
      scrollTop();
    } finally {
      setSaving(false);
    }
  };

  const priceLine = values.price > 0 ? formatPrice(values.price) : "—";
  const variantSummary =
    values.options
      .filter((o) => o.values.length > 0)
      .map(
        (o) =>
          `${o.values.length} ${(o.name.trim() || "option").toLowerCase()}${
            /s$/i.test(o.name.trim()) ? "" : "s"
          }`,
      )
      .join(" · ") || "None";

  const saveButton = (
    <Button
      type="submit"
      variant="accent"
      className="h-10 rounded-lg px-5"
      disabled={saving}
    >
      {saving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          {isEdit ? "Save changes" : "Create product"}
        </>
      )}
    </Button>
  );

  return (
    <form
      onSubmit={submit}
      // Enter in a text field should never save the whole product by accident.
      onKeyDown={blockEnterSubmit}
      noValidate
      className={cn("mx-auto max-w-6xl", onCreate ? "pb-4" : "pb-10")}
    >
      {/* ---------------------------------------------- Action bar */}
      {!onCreate && (
        <div className="sticky top-0 z-30 -mx-2 mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background/90 px-2 py-3 backdrop-blur sm:-mx-4 sm:px-4 md:-mx-6 md:px-6">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/seller/${slug}/products`}
              aria-label="Back to products"
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            {dirty || !isEdit ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {isEdit ? "Unsaved changes" : "Not saved yet"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-accent" />
                All changes saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={
                isEdit
                  ? productPreviewHref(slug, {
                      id: productId!,
                      isActive: initial?.isActive ?? true,
                    })
                  : `/store/${slug}`
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:border-accent hover:text-accent"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview storefront</span>
              <span className="sm:hidden">Preview</span>
            </Link>
            {saveButton}
          </div>
        </div>
      )}

      {topError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {topError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {/* ------------------------------------------ 1. Basic information */}
          <StepCard
            n={1}
            title="Basic information"
            hint="Add the main details about your product."
          >
            <Row label="Product name" required error={fieldErrors.name}>
              <Input
                value={values.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  clearError("name");
                }}
                placeholder="Classic Polo T-Shirt"
                maxLength={120}
                className="h-11"
              />
            </Row>

            <Row
              label="Main type"
              hint="Choose where this product belongs."
              required
              error={fieldErrors.mainId}
            >
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Main type"
              >
                {tree.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={values.mainId === m.id}
                    onClick={() => {
                      setValues((v) =>
                        v.mainId === m.id
                          ? v
                          : {
                              ...v,
                              mainId: m.id,
                              subCategoryId: "",
                              customSubCategory: "",
                            },
                      );
                      clearError("mainId", "subCategoryId");
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      values.mainId === m.id
                        ? "border-primary bg-primary text-white"
                        : "hover:border-primary",
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              {treeLoading && (
                <p className="text-xs text-muted-foreground">
                  Loading main types…
                </p>
              )}
              {!treeLoading && (treeError || tree.length === 0) && (
                <p className="text-xs text-amber-700">
                  Main types could not be loaded
                  {treeError && treeErr instanceof Error
                    ? ` (${treeErr.message})`
                    : ""}
                  .{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => refetchTree()}
                  >
                    Try again
                  </button>
                </p>
              )}
            </Row>

            <Row label="Category" required>
              <CategoryPicker
                categories={categories ?? []}
                values={values.categoryIds}
                onChange={(ids) => {
                  setValues((v) => ({
                    ...v,
                    categoryIds: ids,
                    categoryId: ids[0] ?? "",
                  }));
                  clearError("categoryId");
                }}
                error={fieldErrors.categoryId}
                related={categoryPool}
                pool={categoryPool}
                search={searchInMain}
              />
            </Row>

            <Row label="Description" error={fieldErrors.description}>
              <Textarea
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Tell shoppers what makes this product special."
                className="min-h-[110px] text-sm"
              />
              <p className="text-right text-xs text-muted-foreground">
                {values.description.length} / 2000
              </p>
            </Row>
          </StepCard>

          {/* ------------------------------------------ Mobile preview (right after Basic information) */}
          <section className="rounded-2xl border bg-card shadow-sm lg:hidden">
            <button
              type="button"
              onClick={() => setPreviewOpen((o) => !o)}
              aria-expanded={previewOpen}
              className="flex w-full items-center gap-2.5 p-4 text-left"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Eye className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold tracking-tight">
                  Product preview
                </span>
                <span className="block text-sm text-muted-foreground">
                  The main image shoppers see first.
                </span>
              </span>
              {previewOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
            </button>
            {previewOpen && (
              <div className="border-t p-4">
                <PreviewPane
                  name={values.name}
                  price={values.price}
                  comparePrice={values.comparePrice}
                  photos={photos}
                  swatches={valuePhotos}
                  swatchLabel={photoOption?.name.trim() || "Variant"}
                />
              </div>
            )}
          </section>

          {/* ------------------------------------------ 2. Product photos */}
          <StepCard
            id="step-photos"
            n={2}
            title="Product photos"
            hint="Upload once. Every photo (main, gallery and variant) lives in one gallery."
          >
            <ProductPhotos
              value={photoSlice}
              onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
              onStartVariants={startVariants}
              onManageVariants={scrollToVariants}
            />
          </StepCard>

          {/* ------------------------------------------ 3. Pricing & inventory */}
          <StepCard
            n={3}
            title="Pricing & inventory"
            hint="Set the price and available stock for this product."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
              <Row
                label="Price (৳)"
                hint={
                  hasVariants
                    ? samePrice
                      ? "Applied to all variants."
                      : "Default price. Variants can set their own."
                    : undefined
                }
                required
                error={fieldErrors.price}
              >
                <Input
                  type="number"
                  min={0}
                  value={values.price === 0 ? "" : values.price}
                  onChange={(e) => {
                    set("price", Math.max(0, Number(e.target.value) || 0));
                    clearError("price", "comparePrice");
                  }}
                  placeholder="1290"
                  className="h-11"
                />
              </Row>

              <Row
                label="Compare at price (৳)"
                hint="Optional. Shows a strikethrough."
                error={fieldErrors.comparePrice}
              >
                <Input
                  type="number"
                  min={0}
                  value={values.comparePrice === 0 ? "" : values.comparePrice}
                  onChange={(e) => {
                    set(
                      "comparePrice",
                      Math.max(0, Number(e.target.value) || 0),
                    );
                    clearError("comparePrice");
                  }}
                  placeholder="1590"
                  className="h-11"
                />
              </Row>

              <Row
                label="Stock"
                hint={hasVariants ? "Set stock per variant below." : undefined}
                required={!hasVariants}
                error={fieldErrors.stock}
              >
                <Input
                  type="number"
                  min={0}
                  value={totalStock === 0 ? "" : totalStock}
                  onChange={(e) =>
                    set(
                      "stock",
                      Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    )
                  }
                  disabled={hasVariants}
                  placeholder="24"
                  className="h-11"
                />
              </Row>

              {hasVariants && (
                <div className="flex items-center gap-3 self-start rounded-xl bg-accent/10 px-4 py-2.5 sm:col-span-2 xl:col-span-1 xl:mt-[26px]">
                  <Package className="h-5 w-5 shrink-0 text-accent" />
                  <div className="text-sm leading-tight">
                    <p className="font-semibold">Total stock: {totalStock}</p>
                    <p className="text-xs text-muted-foreground">
                      (all variants)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Same price for all variants (only when the product has variants) */}
            {hasVariants && (
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    Use the same price for all variants
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {samePrice
                      ? `All variants are ${
                          values.price > 0
                            ? formatPrice(values.price)
                            : "set to the price above"
                        }. Turn off to set a price per variant.`
                      : "Each variant can have its own price below."}
                  </span>
                </span>
                <Switch checked={samePrice} onCheckedChange={setSamePrice} />
              </label>
            )}
          </StepCard>

          {/* ------------------------------------------ 4. Variants */}
          <StepCard
            id="step-variants"
            n={4}
            title="Variants"
            hint="Add product variations like color, size, or style."
            action={
              <Switch
                checked={variantsOn}
                onCheckedChange={toggleVariants}
                aria-label="This product has variants"
              />
            }
          >
            {variantsOn ? (
              <VariantsEditor
                options={values.options}
                combinations={values.combinations}
                basePrice={values.price}
                variantImageMode={values.variantImageMode}
                onManagePhotos={scrollToPhotos}
                onChangeOptions={(v) => {
                  set("options", v);
                  clearError("variants");
                }}
                onChangeCombinations={(v) => {
                  set("combinations", v);
                  clearError("variants");
                }}
                onChangeImageMode={(v) => set("variantImageMode", v)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Turn this on if your product comes in different colors, sizes or
                styles. Each one can have its own photos, price and stock.
              </p>
            )}
            {fieldErrors.variants && (
              <p role="alert" className="text-xs text-destructive">
                {fieldErrors.variants}
              </p>
            )}
          </StepCard>

          {/* ------------------------------------------ 5. More details */}
          <section className="rounded-2xl border bg-card shadow-sm">
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
            >
              <StepBadge n={5} />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold tracking-tight">
                  More details{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    (optional)
                  </span>
                </span>
                <span className="block text-sm text-muted-foreground">
                  URL slug, SKU, specifications and storefront badges.
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                  moreOpen && "rotate-180",
                )}
              />
            </button>

            {moreOpen && (
              <div className="space-y-6 border-t p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Row
                    label="URL slug"
                    hint="Auto-filled from the name."
                    required
                    error={fieldErrors.slug}
                  >
                    <Input
                      value={values.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        set("slug", e.target.value);
                        clearError("slug");
                      }}
                      placeholder="classic-polo-t-shirt"
                      maxLength={80}
                      className="h-10 font-mono text-sm"
                    />
                  </Row>

                  <Row
                    label="SKU"
                    hint="Optional product code."
                    error={fieldErrors.sku}
                  >
                    <Input
                      value={values.sku}
                      onChange={(e) => {
                        set("sku", e.target.value);
                        clearError("sku", "variants");
                      }}
                      placeholder="POLO-RED-M"
                      maxLength={40}
                      className="h-10 font-mono text-sm"
                    />
                  </Row>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Specifications</h3>
                  <p className="text-xs text-muted-foreground">
                    Optional. Facts shoppers want to know before buying.
                  </p>
                  <AttributesEditor
                    attributes={values.attributes}
                    onChange={(v) => {
                      set("attributes", v);
                      clearError("attributes");
                    }}
                  />
                  {fieldErrors.attributes && (
                    <p role="alert" className="text-xs text-destructive">
                      {fieldErrors.attributes}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    Storefront placement
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <FlagRow
                      Icon={Sparkles}
                      label="New arrival"
                      checked={values.isNewArrival}
                      onChange={(v) => set("isNewArrival", v)}
                    />
                    <FlagRow
                      Icon={Star}
                      label="Featured"
                      checked={values.isFeatured}
                      onChange={(v) => set("isFeatured", v)}
                    />
                    <FlagRow
                      Icon={Award}
                      label="Best seller"
                      checked={values.isBestSeller}
                      onChange={(v) => set("isBestSeller", v)}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ---------------------------------------------- Sidebar */}
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
          <SideCard Icon={Store} title="Product status">
            <p className="-mt-1 mb-3 text-sm text-muted-foreground">
              Control how this product appears in your store.
            </p>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
              <span className="flex items-center gap-2.5 text-sm font-medium">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    values.isActive ? "bg-accent" : "bg-muted-foreground/40",
                  )}
                />
                {values.isActive ? "Active" : "Hidden"}
              </span>
              <Switch
                checked={values.isActive}
                onCheckedChange={(v) => set("isActive", v)}
              />
            </label>
          </SideCard>

          <div className="hidden lg:block">
            <SideCard Icon={Eye} title="Product preview">
              <p className="-mt-1 mb-3 text-sm text-muted-foreground">
                See how it will look on your store.
              </p>
              <PreviewPane
                name={values.name}
                price={values.price}
                comparePrice={values.comparePrice}
                photos={photos}
                swatches={valuePhotos}
                swatchLabel={photoOption?.name.trim() || "Variant"}
              />
            </SideCard>
          </div>

          <SideCard Icon={BarChart3} title="Quick summary">
            <dl className="space-y-2">
              <SummaryRow Icon={Tag} label="Variants" value={variantSummary} />
              <SummaryRow
                Icon={Package}
                label="Total stock"
                value={String(totalStock)}
              />
              <SummaryRow Icon={Tag} label="Price" value={priceLine} />
              <SummaryRow
                Icon={ImageIcon}
                label="Photos"
                value={String(photos.length)}
              />
            </dl>
          </SideCard>
        </aside>
      </div>

      {/* Embedded (Try the Look dialog): keep the simple bottom bar. */}
      {onCreate && (
        <div className="sticky bottom-0 z-10 mt-6 border-t bg-background/95 backdrop-blur">
          <div className="flex items-center justify-end gap-3 px-1 py-3">
            <Button
              type="button"
              variant="ghost"
              className="h-10"
              onClick={() => onCancel?.()}
              disabled={saving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            {saveButton}
          </div>
        </div>
      )}
    </form>
  );
}

export default ProductForm;

/** Keeps the slug in sync with the name until the seller edits it by hand. */
function useEffectSlug(
  name: string,
  touched: boolean,
  setValues: React.Dispatch<React.SetStateAction<ProductInput>>,
) {
  useEffect(() => {
    if (touched) return;
    setValues((v) => ({ ...v, slug: slugifyProduct(name) }));
  }, [name, touched, setValues]);
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-base font-bold text-accent">
      {n}
    </span>
  );
}

function StepCard({
  id,
  n,
  title,
  hint,
  action,
  children,
}: {
  id?: string;
  n: number;
  title: string;
  hint: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
    >
      <header className="mb-4 flex items-start gap-3">
        <StepBadge n={n} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        {action}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SideCard({
  Icon,
  title,
  children,
}: {
  Icon: typeof Star;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 flex items-center gap-2.5 text-base font-semibold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SummaryRow({
  Icon,
  label,
  value,
}: {
  Icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
      <dt className="flex items-center gap-2.5 text-muted-foreground">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-foreground">{label}</span>
      </dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

/**
 * Mirrors the product page: every photo is in the gallery with the main one
 * first, and picking a variant jumps to that variant's photo.
 */
function PreviewPane({
  name,
  price,
  comparePrice,
  photos,
  swatches,
  swatchLabel,
}: {
  name: string;
  price: number;
  comparePrice: number;
  photos: string[];
  swatches: { id: string; label: string; colorHex?: string; urls: string[] }[];
  swatchLabel: string;
}) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const picked = swatches.find((s) => s.id === pickedId);
  const images = photos;
  const shown = Math.min(index, Math.max(0, images.length - 1));
  const go = (d: number) =>
    setIndex((i) =>
      images.length ? (i + d + images.length) % images.length : 0,
    );

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted/30">
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[shown]}
            alt={name || "Product preview"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="px-6 text-center text-xs">
              Add a photo to see your product here.
            </span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {images.map((u, i) => (
                <span
                  key={u}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i === shown ? "bg-accent" : "bg-white/80",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((u, i) => (
            <button
              key={u}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "aspect-square overflow-hidden rounded-lg border",
                i === shown && "ring-2 ring-accent",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div>
        <p className="truncate text-sm font-semibold">
          {name.trim() || "Your product name"}
        </p>
        <p className="text-sm">
          <span className="font-semibold">
            {price > 0 ? formatPrice(price) : "—"}
          </span>
          {comparePrice > price && price > 0 && (
            <span className="ml-2 text-xs text-muted-foreground line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </p>
      </div>

      {swatches.length > 0 && (
        <div className="space-y-1.5 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            {swatchLabel}
            {picked ? `: ${picked.label}` : " (none picked)"}
          </p>
          <div className="flex flex-wrap gap-2">
            {swatches.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={pickedId === s.id}
                title={s.label}
                onClick={() => {
                  const next = pickedId === s.id ? null : s.id;
                  setPickedId(next);
                  // Jump to this variant's photo; the main image stays first.
                  const at = next && s.urls[0] ? photos.indexOf(s.urls[0]) : 0;
                  setIndex(Math.max(0, at));
                }}
                className={cn(
                  "flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-[11px] font-medium",
                  pickedId === s.id && "ring-2 ring-accent ring-offset-1",
                )}
                style={
                  s.colorHex
                    ? { background: s.colorHex, width: 32, padding: 0 }
                    : undefined
                }
              >
                {!s.colorHex && s.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Shoppers see the main photo first, then jump to a variant&apos;s
            photo when they pick it.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  hint,
  error,
  required,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FlagRow({
  Icon,
  label,
  checked,
  onChange,
}: {
  Icon: typeof Star;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-muted/40">
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition",
            checked
              ? "bg-accent/15 text-accent"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-sm font-medium">{label}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
