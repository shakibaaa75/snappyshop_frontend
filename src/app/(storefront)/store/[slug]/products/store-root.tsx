"use client";

import type { ReactNode } from "react";
import { DeviceHintProvider } from "@/lib/store-design/device-hint";

export function StoreRoot({
  initialMobile,
  children,
}: {
  /** Passed by the products layout; not needed here. */
  slug?: string;
  initialMobile: boolean;
  children: ReactNode;
}) {
  return (
    <DeviceHintProvider value={initialMobile}>{children}</DeviceHintProvider>
  );
}
