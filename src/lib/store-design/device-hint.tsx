"use client";

import { createContext, useContext, type ReactNode } from "react";

const DeviceHintContext = createContext<boolean | undefined>(undefined);

export function DeviceHintProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  return (
    <DeviceHintContext.Provider value={value}>
      {children}
    </DeviceHintContext.Provider>
  );
}

/** True on phones (from the server User-Agent). Undefined outside a provider. */
export function useMobileHint(): boolean {
  return useContext(DeviceHintContext) ?? false;
}
