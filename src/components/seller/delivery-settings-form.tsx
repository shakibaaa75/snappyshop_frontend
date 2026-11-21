"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Info, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  sellerDelivery,
  type DeliverySettings,
  type DeliverySettingsInput,
} from "@/lib/api/delivery-settings";
import { ApiError } from "@/lib/api/http";
import { getApiErrorMessage } from "@/lib/api/form-errors";
import { qk } from "@/lib/query/keys";
import { fetchProducts } from "@/lib/store-design/api";
import type { Product } from "@/lib/store-design/types";
import {
  chargeLabel,
  chargeToInput,
  cleanAmountInput,
  parseCharge,
} from "@/lib/delivery/charges";
import { Panel } from "@/components/store-design/controls";
import { ProductArt } from "@/components/store-design/productArt";

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */

type Zone = "inside" | "outside";
const ZONE_KEY = { inside: "insideDhaka", outside: "outsideDhaka" } as const;

/** What the seller has typed, kept as text so half-typed values are fine. */
interface Cells {
  inside: string;
  outside: string;
}
interface Form {
  global: Cells;
  /** productId -> custom charges. A product that is a key here has a custom charge. */
  custom: Record<string, Cells>;
}
type Errors = Record<string, string>;

const PAGE = 25;
const NO_PRODUCTS: Product[] = [];

function toForm(s: DeliverySettings): Form {
  const custom: Form["custom"] = {};
  for (const [id, c] of Object.entries(s.products)) {
    custom[id] = {
      inside: chargeToInput(c.insideDhaka),
      outside: chargeToInput(c.outsideDhaka),
    };
  }
  return {
    global: {
      inside: chargeToInput(s.global.insideDhaka),
      outside: chargeToInput(s.global.outsideDhaka),
    },
    custom,
  };
}

function errorKey(scope: string, zone: Zone) {
  return `${scope}.${ZONE_KEY[zone]}`;
}

/** Checks every amount. The keys match the ones the API uses for its errors. */
function validate(form: Form): Errors {
  const errors: Errors = {};
  const check = (scope: string, c: Cells) => {
    for (const zone of ["inside", "outside"] as const) {
      const r = parseCharge(c[zone]);
      if (!r.ok) errors[errorKey(scope, zone)] = r.error;
    }
  };
  check("global", form.global);
  for (const [id, c] of Object.entries(form.custom)) check(`products.${id}`, c);
  return errors;
}

/** Only call after validate() found nothing wrong. */
function toInput(form: Form): DeliverySettingsInput {
  const num = (s: string) => {
    const r = parseCharge(s);
    return r.ok ? r.value : 0;
  };
  const products: DeliverySettingsInput["products"] = {};
  for (const [id, c] of Object.entries(form.custom)) {
    products[id] = {
      insideDhaka: num(c.inside),
      outsideDhaka: num(c.outside),
    };
  }
  return {
    global: {
      insideDhaka: num(form.global.inside),
      outsideDhaka: num(form.global.outside),
    },
    products,
  };
}

/** Same signature = same settings ("60" and "60.0" are not a change). */
function signature(form: Form): string {
  const cell = (s: string) => {
    const r = parseCharge(s);
    return r.ok ? String(r.value) : `!${s}`;
  };
  const row = (c: Cells) => `${cell(c.inside)}|${cell(c.outside)}`;
  const ids = Object.keys(form.custom).sort();
  return [
    row(form.global),
    ...ids.map((id) => `${id}=${row(form.custom[id])}`),
  ].join(";");
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function MoneyField({
  id,
  label,
  hint,
  value,
  onChange,
  onBlur,
  error,
  compact,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  compact?: boolean;
}) {
  const noteId = `${id}-note`;
  return (
    <div className="min-w-0 space-y-1.5">
      <label
        htmlFor={id}
        className={cn("block font-medium", compact ? "text-xs" : "text-sm")}
      >
        {label}
      </label>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
        >
          ৳
        </span>
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? noteId : undefined}
          className={cn(
            "h-11 pl-8",
            error && "border-destructive focus-visible:ring-destructive",
          )}
        />
      </div>
      {error ? (
        <p id={noteId} className="text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="text-xs leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "info" | "error";
  children: ReactNode;
}) {
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "note"}
      className={cn(
        "flex gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-5",
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-amber-200 bg-amber-50 text-amber-950",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export interface DeliverySettingsFormProps {
  /**
   * The live "free delivery over X" amount, when the caller has one (the store
   * editor does, so it updates as the seller types). Otherwise the saved value
   * from the API is used.
   */
  freeDeliveryThreshold?: number;
  /** Reports unsaved changes so the host can warn before navigating away. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Tailwind classes that place the sticky save bar clear of the host's fixed bars. */
  stickyClassName?: string;
}

/**
 * Delivery charges: standard Inside / Outside Dhaka amounts plus per-product
 * overrides. Used by the store editor's Delivery tab and the Courier Services
 * page. Both read and write the same data, so they always agree.
 */
export function DeliverySettingsForm({
  freeDeliveryThreshold,
  onDirtyChange,
  stickyClassName = "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-3",
}: DeliverySettingsFormProps) {
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: qk.seller.delivery,
    queryFn: sellerDelivery.get,
    staleTime: 15_000,
  });
  // Same query the editor page runs, so this costs no extra request. It only
  // tells us whether the product list is still loading.
  const productsQuery = useQuery({
    queryKey: ["store-design", "products"],
    queryFn: () => fetchProducts(),
    staleTime: 60_000,
  });
  const products = productsQuery.data ?? NO_PRODUCTS;

  const [form, setForm] = useState<Form | null>(null);
  const [baseSig, setBaseSig] = useState("");
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const [query, setQuery] = useState("");
  const [only, setOnly] = useState<"all" | "custom">("all");
  const [limit, setLimit] = useState(PAGE);

  // Load the form once, when the settings first arrive.
  useEffect(() => {
    if (settings.data && !form) {
      const f = toForm(settings.data);
      setForm(f);
      setBaseSig(signature(f));
    }
  }, [settings.data, form]);

  const dirty = form !== null && signature(form) !== baseSig;

  // Tell the editor about unsaved changes so it can warn before switching tabs.
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!justSaved) return;
    const t = window.setTimeout(() => setJustSaved(false), 3000);
    return () => window.clearTimeout(t);
  }, [justSaved]);

  const clientErrors = useMemo(() => (form ? validate(form) : {}), [form]);
  const errorFor = (key: string): string | undefined => {
    const message = serverErrors[key] ?? clientErrors[key];
    if (!message) return undefined;
    return submitted || touched.has(key) || serverErrors[key]
      ? message
      : undefined;
  };

  const touch = (key: string) =>
    setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));

  const clearServerError = (key: string) =>
    setServerErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setCell = (scope: string, zone: Zone, value: string) => {
    setBanner(null);
    setJustSaved(false);
    clearServerError(errorKey(scope, zone));
    setForm((f) => {
      if (!f) return f;
      if (scope === "global") {
        return { ...f, global: { ...f.global, [zone]: value } };
      }
      const id = scope.slice("products.".length);
      const row = f.custom[id];
      if (!row) return f;
      return { ...f, custom: { ...f.custom, [id]: { ...row, [zone]: value } } };
    });
  };

  const blurCell = (scope: string, zone: Zone, value: string) => {
    touch(errorKey(scope, zone));
    const cleaned = cleanAmountInput(value);
    if (cleaned !== value) setCell(scope, zone, cleaned);
  };

  const toggleCustom = (id: string, on: boolean) => {
    setBanner(null);
    setJustSaved(false);
    if (!on) {
      clearServerError(`products.${id}.insideDhaka`);
      clearServerError(`products.${id}.outsideDhaka`);
    }
    setForm((f) => {
      if (!f) return f;
      const custom = { ...f.custom };
      if (on) {
        // Start from the standard charges so turning it on changes nothing yet.
        custom[id] = { ...f.global };
      } else {
        delete custom[id];
      }
      return { ...f, custom };
    });
  };

  const save = useMutation({
    mutationFn: (input: DeliverySettingsInput) => sellerDelivery.save(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(qk.seller.delivery, saved);
      const f = toForm(saved);
      setForm(f);
      setBaseSig(signature(f));
      setServerErrors({});
      setTouched(new Set());
      setSubmitted(false);
      setBanner(null);
      setJustSaved(true);
    },
    onError: (err) => {
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) {
        setServerErrors(err.fields);
        setSubmitted(true);
        setBanner(
          err.fields.products ??
            "Some amounts need fixing before this can be saved.",
        );
        if (Object.keys(err.fields).some((k) => k.startsWith("products."))) {
          setQuery("");
          setOnly("all");
          setLimit(Number.MAX_SAFE_INTEGER);
        }
        return;
      }
      setBanner(
        getApiErrorMessage(
          err,
          "Couldn't save your delivery charges. Try again.",
        ),
      );
    },
  });

  const onSave = () => {
    if (!form || save.isPending) return;
    const errors = validate(form);
    const keys = Object.keys(errors);
    if (keys.length > 0) {
      setSubmitted(true);
      setBanner(
        keys.length === 1
          ? "One amount needs fixing before this can be saved."
          : `${keys.length} amounts need fixing before this can be saved.`,
      );
      // Make sure the broken rows are on screen, then jump to the first one.
      if (keys.some((k) => k.startsWith("products."))) {
        setQuery("");
        setOnly("all");
        setLimit(Number.MAX_SAFE_INTEGER);
      }
      const first = keys[0];
      window.requestAnimationFrame(() => {
        document.getElementById(inputId(first))?.focus();
      });
      return;
    }
    setBanner(null);
    save.mutate(toInput(form));
  };

  const onDiscard = () => {
    if (!settings.data) return;
    const f = toForm(settings.data);
    setForm(f);
    setBaseSig(signature(f));
    setServerErrors({});
    setTouched(new Set());
    setSubmitted(false);
    setBanner(null);
  };

  /* ---- loading / error ---- */

  if (settings.isError) {
    return (
      <Panel title="Delivery charges">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {getApiErrorMessage(
              settings.error,
              "Couldn't load your delivery settings.",
            )}
          </p>
          <Button variant="outline" onClick={() => settings.refetch()}>
            Try again
          </Button>
        </div>
      </Panel>
    );
  }

  if (!form || !settings.data) {
    return (
      <div className="space-y-5" aria-busy="true" aria-live="polite">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  /* ---- derived values ---- */

  const configured = settings.data.configured;
  const threshold =
    freeDeliveryThreshold ?? settings.data.freeDeliveryThreshold;
  const globalInside = parseCharge(form.global.inside);
  const globalOutside = parseCharge(form.global.outside);

  const known = new Set(products.map((p) => p.id));
  const customCount = Object.keys(form.custom).filter((id) =>
    known.has(id),
  ).length;

  const needle = query.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      (only === "all" || p.id in form.custom) &&
      (needle === "" || p.name.toLowerCase().includes(needle)),
  );
  const shown = filtered.slice(0, limit);
  const productsLoading = productsQuery.isLoading && products.length === 0;

  const standardSummary =
    globalInside.ok && globalOutside.ok
      ? `Inside Dhaka ${chargeLabel(globalInside.value)} · Outside Dhaka ${chargeLabel(globalOutside.value)}`
      : "Standard charges need fixing above";

  return (
    <div className="space-y-5">
      {!configured && (
        <Notice tone="info">
          <p className="font-medium">
            You haven&apos;t set delivery charges yet.
          </p>
          <p className="mt-0.5">
            Until you save, your store keeps working as it does today:{" "}
            {threshold > 0
              ? `a flat ৳60 delivery charge on orders under ৳${threshold.toLocaleString("en-US")}, and free delivery above that.`
              : "delivery is free."}{" "}
            The amounts below show that. Save to start charging by area.
          </p>
        </Notice>
      )}

      {banner && <Notice tone="error">{banner}</Notice>}

      <Panel
        title="Standard delivery charges"
        description="Used for every product that doesn't have a custom charge. Enter 0 for free delivery."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyField
            id="dlv-global-inside"
            label="Inside Dhaka"
            hint="Orders going to the Dhaka district."
            value={form.global.inside}
            onChange={(v) => setCell("global", "inside", v)}
            onBlur={() => blurCell("global", "inside", form.global.inside)}
            error={errorFor("global.insideDhaka")}
          />
          <MoneyField
            id="dlv-global-outside"
            label="Outside Dhaka"
            hint="Every other district, including Gazipur, Narayanganj and Madaripur."
            value={form.global.outside}
            onChange={(v) => setCell("global", "outside", v)}
            onBlur={() => blurCell("global", "outside", form.global.outside)}
            error={errorFor("global.outsideDhaka")}
          />
        </div>
      </Panel>

      <Panel
        title="Custom charges for specific products"
        description="Heavy or bulky products can have their own charges. If an order has several products, the customer pays one delivery charge: the highest among them."
        action={
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {customCount} custom
          </span>
        }
      >
        {productsLoading ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : productsQuery.isError && products.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load your products.
            </p>
            <Button variant="outline" onClick={() => productsQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
            You don&apos;t have any products yet. Add products, then come back
            to give some of them their own delivery charges.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  aria-label="Search your products"
                  placeholder="Search products"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setLimit(PAGE);
                  }}
                  className="h-11 pl-9"
                />
              </div>
              <div
                role="radiogroup"
                aria-label="Show"
                className="flex rounded-full bg-muted p-1"
              >
                {(
                  [
                    ["all", `All (${products.length})`],
                    ["custom", `Custom (${customCount})`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={only === id}
                    onClick={() => {
                      setOnly(id);
                      setLimit(PAGE);
                    }}
                    className={cn(
                      "min-h-9 flex-1 rounded-full px-3.5 text-xs font-medium transition sm:flex-none",
                      only === id
                        ? "bg-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                {only === "custom" && needle === ""
                  ? "No products have a custom charge yet. Switch to “All” and turn one on."
                  : "No products match your search."}
              </p>
            ) : (
              <ul className="space-y-2">
                {shown.map((p) => {
                  const row = form.custom[p.id];
                  const on = row !== undefined;
                  const scope = `products.${p.id}`;
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        "rounded-xl border p-2.5 transition",
                        on && "border-accent/40 bg-accent/5",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                          <ProductArt
                            product={p}
                            emojiClassName="text-lg"
                            width={120}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {on ? "Custom charges" : standardSummary}
                          </p>
                        </div>
                        <Switch
                          checked={on}
                          onCheckedChange={(v) => toggleCustom(p.id, v)}
                          aria-label={`Custom delivery charges for ${p.name}`}
                        />
                      </div>
                      {on && (
                        <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
                          <MoneyField
                            compact
                            id={inputId(errorKey(scope, "inside"))}
                            label="Inside Dhaka"
                            value={row.inside}
                            onChange={(v) => setCell(scope, "inside", v)}
                            onBlur={() => blurCell(scope, "inside", row.inside)}
                            error={errorFor(errorKey(scope, "inside"))}
                          />
                          <MoneyField
                            compact
                            id={inputId(errorKey(scope, "outside"))}
                            label="Outside Dhaka"
                            value={row.outside}
                            onChange={(v) => setCell(scope, "outside", v)}
                            onBlur={() =>
                              blurCell(scope, "outside", row.outside)
                            }
                            error={errorFor(errorKey(scope, "outside"))}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {filtered.length > shown.length && (
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => setLimit((n) => n + PAGE)}
              >
                Show more ({filtered.length - shown.length} left)
              </Button>
            )}
          </>
        )}
      </Panel>

      <Panel title="Free delivery">
        <p className="text-sm leading-6">
          {threshold > 0 ? (
            <>
              Orders of <strong>৳{threshold.toLocaleString("en-US")}</strong> or
              more get free delivery, whatever the charges above.
            </>
          ) : (
            <>You don&apos;t offer free delivery over a minimum order.</>
          )}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          Change this in <strong>Shop options</strong> under &ldquo;Free
          delivery over&rdquo;.
        </p>
      </Panel>

      {(dirty || justSaved) && (
        <div className={cn("sticky z-20", stickyClassName)}>
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur"
          >
            {dirty ? (
              <>
                <p className="min-w-0 text-sm font-medium">Unsaved changes</p>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    className="h-10"
                    onClick={onDiscard}
                    disabled={save.isPending}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="accent"
                    className="h-10 rounded-full bg-primary px-5 hover:bg-primary/90"
                    onClick={onSave}
                    disabled={save.isPending}
                  >
                    {save.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save charges"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Check className="h-4 w-4" />
                Delivery charges saved. Customers see them right away.
              </p>
            )}
          </div>
        </div>
      )}

      {!dirty && !justSaved && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="h-11"
            onClick={onSave}
            disabled={configured || save.isPending}
            title={
              configured
                ? "No changes to save"
                : "Save to start using area-based charges"
            }
          >
            {save.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : configured ? (
              "No changes to save"
            ) : (
              "Save these charges"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/** DOM id of the money box for an error key like "products.abc.insideDhaka". */
function inputId(key: string): string {
  if (key.startsWith("global.")) {
    return key.endsWith("insideDhaka")
      ? "dlv-global-inside"
      : "dlv-global-outside";
  }
  return `dlv-${key.replace(/\./g, "-")}`;
}
