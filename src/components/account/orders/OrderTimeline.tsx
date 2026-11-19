import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineStep } from "@/lib/api/buyerOrders";
import { formatDateTime } from "@/components/account/orders/OrderBits";

/** Vertical tracking timeline: finished steps are filled, upcoming ones are outlined. */
export function OrderTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const cancelled = step.key === "cancelled";
        const next = steps[i + 1];
        // The line below a step is solid only when the next step is also done.
        const lineDone = step.done && next?.done;
        return (
          <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5",
                  lineDone ? "bg-neutral-900" : "bg-neutral-200",
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                cancelled
                  ? "border-red-600 bg-red-600 text-white"
                  : step.done
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-transparent",
              )}
            >
              {cancelled ? (
                <X className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </span>
            <div className="pt-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  !step.done && "text-neutral-400",
                  cancelled && "text-red-700",
                )}
              >
                {step.label}
                {!step.done && <span className="sr-only"> (not yet)</span>}
              </p>
              {step.at && (
                <p className="text-xs text-neutral-500">
                  {formatDateTime(step.at)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
