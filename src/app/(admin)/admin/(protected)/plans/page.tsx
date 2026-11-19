"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { adminPlansApi } from "@/lib/api/adminplans";
import { ApiError } from "@/lib/api/http";
import {
  PLAN_CATALOG_QUERY_KEY,
  type PlanCatalog,
  type PlanCatalogInput,
  type PlanConfig,
  type PlanExtra,
} from "@/lib/plan-catalog";
import { formatBDT } from "@/lib/api/orders";
import { quoteFor, type PricingRules } from "@/lib/subscription-pricing";
import { SUBSCRIPTION_QUERY_KEY } from "@/lib/query/entitlements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const ADMIN_PLANS_KEY = ["admin", "plans"] as const;

/** Only the fields the server accepts (it rejects unknown ones). */
function toInput(c: PlanCatalog | PlanCatalogInput): PlanCatalogInput {
  return {
    halfYearlyPct: c.halfYearlyPct,
    yearlyPct: c.yearlyPct,
    firstPurchasePct: c.firstPurchasePct,
    plans: c.plans.map((p) => ({
      id: p.id,
      name: p.name,
      blurb: p.blurb,
      about: p.about,
      popular: p.popular,
      monthlyPrice: p.monthlyPrice,
      maxProducts: p.maxProducts,
      analytics: p.analytics,
      customDomain: p.customDomain,
      metaPixel: p.metaPixel,
      pyxel: p.pyxel,
      autoCourier: p.autoCourier,
      premiumDesign: p.premiumDesign,
      allDesigns: p.allDesigns,
      extras: p.extras.map((e) => ({
        key: e.key,
        label: e.label,
        included: e.included,
      })),
    })),
  };
}

const SWITCHES: {
  key:
    | "analytics"
    | "metaPixel"
    | "pyxel"
    | "autoCourier"
    | "premiumDesign"
    | "customDomain";
  label: string;
  hint: string;
}[] = [
  { key: "analytics", label: "Analytics dashboard", hint: "Sales and visitor analytics" },
  { key: "metaPixel", label: "Meta Pixel", hint: "Facebook / Meta ad tracking" },
  { key: "pyxel", label: "Pyxel", hint: "Pyxel integration" },
  { key: "autoCourier", label: "Automatic courier", hint: "Connect a courier and auto-ship" },
  {
    key: "premiumDesign",
    label: "Premium design",
    hint: "Gallery grid card, image gallery section, arrange sections",
  },
  { key: "customDomain", label: "Custom domain", hint: "Seller's own web address" },
];

export default function AdminPlansPage() {
  const qc = useQueryClient();
  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ADMIN_PLANS_KEY,
    queryFn: adminPlansApi.get,
    refetchOnWindowFocus: false,
  });

  const [draft, setDraft] = useState<PlanCatalogInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Load the server copy into the form (first load only; saving resets it).
  useEffect(() => {
    if (data && !draft) setDraft(toInput(data));
  }, [data, draft]);

  const serverInput = useMemo(() => (data ? toInput(data) : null), [data]);
  const dirty =
    !!draft &&
    !!serverInput &&
    JSON.stringify(draft) !== JSON.stringify(serverInput);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  function applyServer(next: PlanCatalog) {
    qc.setQueryData(ADMIN_PLANS_KEY, next);
    setDraft(toInput(next));
    // The seller pricing page and every plan lock should refetch.
    void qc.invalidateQueries({ queryKey: PLAN_CATALOG_QUERY_KEY });
    void qc.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      applyServer(await adminPlansApi.update(draft));
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the plans");
    } finally {
      setSaving(false);
    }
  }

  async function restoreDefaults() {
    if (
      !window.confirm(
        "Restore the built-in plans, prices and discounts? Your saved changes will be replaced.",
      )
    )
      return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      applyServer(await adminPlansApi.reset());
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not restore the plans");
    } finally {
      setSaving(false);
    }
  }

  function setPlan(id: string, patch: Partial<PlanConfig>) {
    setSaved(false);
    setDraft((d) =>
      d
        ? {
            ...d,
            plans: d.plans.map((p) => {
              if (p.id === id) return { ...p, ...patch };
              // Only one plan carries the Popular badge.
              if (patch.popular === true) return { ...p, popular: false };
              return p;
            }),
          }
        : d,
    );
  }

  function setGlobal(patch: Partial<PlanCatalogInput>) {
    setSaved(false);
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-zinc-500">
        {loadError ? (
          <span className="text-red-600">
            {loadError instanceof ApiError
              ? loadError.message
              : "Could not load the plans"}
          </span>
        ) : (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading plans…
          </>
        )}
      </div>
    );
  }

  const rules: PricingRules = {
    firstPurchasePct: draft.firstPurchasePct,
    durations: [
      { id: "monthly", months: 1, discountPct: 0, label: "1 month" },
      { id: "half_yearly", months: 6, discountPct: draft.halfYearlyPct, label: "6 months" },
      { id: "yearly", months: 12, discountPct: draft.yearlyPct, label: "12 months" },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Plans &amp; pricing
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Change prices, product limits, feature switches and discounts, or add
            your own feature lines. Saved changes go live straight away on the
            sellers&apos; pricing page and in the plan checks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={restoreDefaults}
            disabled={saving}
          >
            <RotateCcw /> Restore defaults
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft(serverInput);
              setError(null);
            }}
            disabled={saving || !dirty}
          >
            Discard changes
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save changes
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {saved && !dirty && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Saved. The new plans are live.
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        <strong>What a change affects.</strong> A new price applies to purchases
        made after you save; people who already paid keep what they paid for.
        Feature switches and limits apply right away to everyone on that plan.
        A custom feature line is shown on the pricing page and sent to the app as
        a key (for example <code>priority_support</code>); it unlocks something
        only once a screen checks for that key.
      </div>

      {/* ---------- Discounts ---------- */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Discounts</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Percent off the monthly price multiplied by the months. The first-purchase
          discount is added to the period discount.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <NumberField
            label="6 months — discount %"
            value={draft.halfYearlyPct}
            min={0}
            max={90}
            onChange={(n) => setGlobal({ halfYearlyPct: n })}
          />
          <NumberField
            label="12 months — discount %"
            value={draft.yearlyPct}
            min={0}
            max={90}
            onChange={(n) => setGlobal({ yearlyPct: n })}
          />
          <NumberField
            label="First purchase — extra %"
            value={draft.firstPurchasePct}
            min={0}
            max={90}
            onChange={(n) => setGlobal({ firstPurchasePct: n })}
          />
        </div>
      </section>

      {/* ---------- Plans ---------- */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {draft.plans.map((p) => (
          <PlanEditor key={p.id} plan={p} onChange={(patch) => setPlan(p.id, patch)} />
        ))}
      </div>

      {/* ---------- Price preview ---------- */}
      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold">What sellers will pay</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Preview from the values above (whole taka, rounded like the server).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Plan</th>
                {rules.durations.map((d) => (
                  <th key={d.id} className="px-4 py-3 font-medium">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {draft.plans
                .filter((p) => p.id !== "free")
                .map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    {rules.durations.map((d) => {
                      const normal = quoteFor(p.monthlyPrice, d.id, false, rules);
                      const first = quoteFor(p.monthlyPrice, d.id, true, rules);
                      return (
                        <td key={d.id} className="px-4 py-3">
                          <div className="font-semibold">{formatBDT(normal.amount)}</div>
                          <div className="text-xs text-zinc-500">
                            first purchase {formatBDT(first.amount)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {data?.updatedAt && (
        <p className="text-xs text-zinc-500">
          Last saved {new Date(data.updatedAt).toLocaleString()}. Every change is
          recorded in Activity Logs.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PlanEditor({
  plan,
  onChange,
}: {
  plan: PlanConfig;
  onChange: (patch: Partial<PlanConfig>) => void;
}) {
  const isFree = plan.id === "free";

  const setExtra = (i: number, patch: Partial<PlanExtra>) =>
    onChange({
      extras: plan.extras.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    });

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {plan.name || "Plan"}{" "}
          <span className="text-xs font-normal text-zinc-400">({plan.id})</span>
        </h2>
        {!isFree && (
          <label className="flex items-center gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={plan.popular}
              onChange={(e) => onChange({ popular: e.target.checked })}
            />
            Popular badge
          </label>
        )}
      </div>

      <Field label="Name">
        <Input
          value={plan.name}
          maxLength={30}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>
      <Field label="Short description">
        <Input
          value={plan.blurb}
          maxLength={80}
          onChange={(e) => onChange({ blurb: e.target.value })}
        />
      </Field>
      <Field label="Long description (See more)">
        <Textarea
          rows={3}
          maxLength={600}
          value={plan.about}
          onChange={(e) => onChange({ about: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Monthly price (৳)"
          value={plan.monthlyPrice}
          min={0}
          disabled={isFree}
          onChange={(n) => onChange({ monthlyPrice: n })}
        />
        <NumberField
          label="Product limit"
          value={plan.maxProducts}
          min={1}
          onChange={(n) => onChange({ maxProducts: n })}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Features
        </p>
        <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-100">
          <SwitchRow
            label="All themes & templates"
            hint="Off = only the free starter themes and templates"
            checked={plan.allDesigns}
            onChange={(v) => onChange({ allDesigns: v })}
          />
          {SWITCHES.map((s) => (
            <SwitchRow
              key={s.key}
              label={s.label}
              hint={s.hint}
              checked={plan[s.key]}
              onChange={(v) => onChange({ [s.key]: v } as Partial<PlanConfig>)}
            />
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Extra features
        </p>
        {plan.extras.length === 0 && (
          <p className="mb-2 text-xs text-zinc-500">
            None yet. Add a line such as &quot;Priority support&quot;.
          </p>
        )}
        <ul className="space-y-2">
          {plan.extras.map((e, i) => (
            <li key={i} className="flex items-center gap-2">
              <Switch
                checked={e.included}
                onCheckedChange={(v) => setExtra(i, { included: v })}
                aria-label={`${e.label || "Feature"} included in ${plan.name}`}
              />
              <Input
                value={e.label}
                maxLength={120}
                placeholder="Feature name"
                onChange={(ev) => setExtra(i, { label: ev.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-zinc-500 hover:text-red-600"
                aria-label={`Remove ${e.label || "feature"}`}
                onClick={() =>
                  onChange({ extras: plan.extras.filter((_, j) => j !== i) })
                }
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={plan.extras.length >= 20}
          onClick={() =>
            onChange({
              extras: [...plan.extras, { key: "", label: "", included: true }],
            })
          }
        >
          <Plus /> Add feature
        </Button>
        <p className="mt-2 text-[11px] leading-snug text-zinc-500">
          On = included in this plan. Off = shown as locked, so sellers see what
          they would get by upgrading. To offer the same feature on several
          plans, use the same name on each.
        </p>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        value={value === 0 && !disabled && min !== 0 ? "" : value}
        placeholder="0"
        onChange={(e) => {
          const n = Math.floor(Number(e.target.value));
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className={cn(disabled && "bg-zinc-50")}
      />
    </Field>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] leading-snug text-zinc-500">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </li>
  );
}
