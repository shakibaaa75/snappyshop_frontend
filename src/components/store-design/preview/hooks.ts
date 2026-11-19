import { useSyncExternalStore } from "react";
import { useMobileHint } from "@/lib/store-design/device-hint";

const MOBILE_QUERY = "(max-width: 1023px)";
export function useIsMobile(enabled: boolean, fallback: boolean) {
  // Server-side guess (User-Agent) so phones get the mobile layout in the
  // very first HTML instead of flashing the desktop one.
  const hint = useMobileHint();
  const serverValue = fallback || (enabled && hint);
  return useSyncExternalStore(
    (cb) => {
      if (!enabled) return () => {};
      const mq = window.matchMedia(MOBILE_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => (enabled ? window.matchMedia(MOBILE_QUERY).matches : fallback),
    () => serverValue,
  );
}
/* True when there is room for the right-hand cart column. */
const WIDE_QUERY = "(min-width: 1180px)";
export function useWide(enabled: boolean) {
  return useSyncExternalStore(
    (cb) => {
      if (!enabled) return () => {};
      const mq = window.matchMedia(WIDE_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => (enabled ? window.matchMedia(WIDE_QUERY).matches : true),
    () => (enabled ? false : true),
  );
}
