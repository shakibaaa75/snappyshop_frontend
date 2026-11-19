"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  paymentLabels,
  type PaymentMethod,
  sortLabels,
  type SortOption,
} from "@/lib/store-design/types";
import {
  NumberField,
  Panel,
  ProductPicker,
  SelectField,
  TextAreaField,
  TextField,
  ToggleRow,
} from "../controls";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* Shop options                                                        */
/* ------------------------------------------------------------------ */

export function ShopOptionsPanel({
  design,
  update,
  products,
  categories,
}: PanelProps) {
  const togglePayment = (m: PaymentMethod) =>
    update({
      paymentMethods: design.paymentMethods.includes(m)
        ? design.paymentMethods.filter((x) => x !== m)
        : [...design.paymentMethods, m],
    });

  return (
    <div className="space-y-5">
      <Panel
        title="Browsing"
        description="How shoppers find products in your store."
      >
        <ToggleRow
          label="Category filters"
          description="Lets shoppers filter products by category."
          checked={design.showFilters}
          onChange={(v) => update({ showFilters: v })}
        />
        <ToggleRow
          label="Sort menu"
          checked={design.showSortMenu}
          onChange={(v) => update({ showSortMenu: v })}
        />
        <SelectField
          label="Default order"
          value={design.defaultSort}
          onChange={(v) => update({ defaultSort: v as SortOption })}
          options={(Object.keys(sortLabels) as SortOption[]).map((k) => ({
            value: k,
            label: sortLabels[k],
          }))}
        />
        <ProductPicker
          label="Pinned products"
          hint="Pinned products always appear first in All products."
          products={products}
          categories={categories}
          selectedIds={design.pinnedProductIds}
          onChange={(ids) => update({ pinnedProductIds: ids })}
          max={6}
        />
      </Panel>

      <Panel title="Payment and delivery">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Payment methods you accept</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(paymentLabels) as PaymentMethod[]).map((m) => {
              const on = design.paymentMethods.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => togglePayment(m)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "text-muted-foreground hover:border-accent/50",
                  )}
                >
                  {on && <Check className="h-4 w-4 text-accent" />}
                  {paymentLabels[m]}
                </button>
              );
            })}
          </div>
        </div>
        <TextField
          label="Delivery message"
          value={design.deliveryNote}
          onChange={(v) => update({ deliveryNote: v })}
          placeholder="Delivery across Bangladesh"
          maxLength={60}
        />
        <NumberField
          label="Free delivery over (৳)"
          hint="Leave empty to turn this off."
          value={design.freeDeliveryThreshold}
          onChange={(v) => update({ freeDeliveryThreshold: v })}
        />
      </Panel>

      <Panel
        title="Chat button"
        description="Adds a floating WhatsApp button so shoppers can message you."
      >
        <ToggleRow
          label="Show WhatsApp button"
          checked={design.whatsappEnabled}
          onChange={(v) => update({ whatsappEnabled: v })}
        />
        {design.whatsappEnabled && (
          <>
            <TextField
              label="WhatsApp number"
              hint="Include the country code, for example +8801712345678."
              value={design.whatsappNumber}
              onChange={(v) =>
                update({ whatsappNumber: v.replace(/[^\d+]/g, "") })
              }
              placeholder="+8801XXXXXXXXX"
              inputMode="tel"
              maxLength={16}
            />
            <TextAreaField
              label="Message shoppers start with"
              value={design.whatsappMessage}
              onChange={(v) => update({ whatsappMessage: v })}
              rows={2}
              maxLength={140}
            />
          </>
        )}
      </Panel>

      <Panel
        title="Pause your store"
        description="Going away? Shoppers can still browse, but they can't place orders."
      >
        <ToggleRow
          label="Pause orders"
          checked={design.vacationMode}
          onChange={(v) => update({ vacationMode: v })}
        />
        {design.vacationMode && (
          <TextAreaField
            label="Message shown at the top of your store"
            value={design.vacationMessage}
            onChange={(v) => update({ vacationMessage: v })}
            rows={2}
            maxLength={140}
          />
        )}
      </Panel>
    </div>
  );
}
