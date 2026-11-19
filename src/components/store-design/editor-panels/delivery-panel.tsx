"use client";

import { DeliverySettingsForm } from "@/components/seller/delivery-settings-form";
import { type PanelProps } from "./types";

/**
 * The store editor's Delivery tab. The form itself lives in
 * components/seller/delivery-settings-form.tsx so the Courier Services page
 * can show the same thing.
 */
export function DeliveryPanel({ design, onDirtyChange }: PanelProps) {
  return (
    <DeliverySettingsForm
      freeDeliveryThreshold={design.freeDeliveryThreshold}
      onDirtyChange={onDirtyChange}
      // The editor has its own fixed bottom bar on screens narrower than xl.
      stickyClassName="bottom-[calc(6rem+env(safe-area-inset-bottom))] xl:bottom-3"
    />
  );
}
