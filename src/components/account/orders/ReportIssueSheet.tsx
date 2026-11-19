"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useReportIssue } from "@/lib/query/buyerOrders";
import type { IssueType } from "@/lib/api/buyerOrders";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ISSUE_TYPE_LABEL } from "@/components/account/orders/OrderBits";

const MIN = 10;
const MAX = 1000;

/**
 * "Problem with this order" form. Only the problem kinds the server says are
 * allowed for this order right now are offered (`types`).
 */
export function ReportIssueSheet({
  orderId,
  orderNumber,
  types,
  open,
  onOpenChange,
  onReported,
}: {
  orderId: string;
  orderNumber: string;
  types: IssueType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReported: () => void;
}) {
  const report = useReportIssue(orderId);
  const [type, setType] = useState<IssueType | "">("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const reset = () => {
    setType("");
    setMessage("");
    setFieldErrors({});
    setFormError("");
    report.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!type) errs.type = "Choose what went wrong";
    const text = message.trim();
    if (text.length < MIN) errs.message = `Please describe the problem (at least ${MIN} characters)`;
    if (text.length > MAX) errs.message = `Message is too long (max ${MAX} characters)`;
    setFieldErrors(errs);
    setFormError("");
    if (Object.keys(errs).length > 0 || !type) return;

    report.mutate(
      { type, message: text },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
          onReported();
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            setFieldErrors(err.fields);
            // Field errors are shown next to the field; anything else goes at the bottom.
            if (Object.keys(err.fields).length === 0) setFormError(err.message);
          } else {
            setFormError("Something went wrong. Please try again.");
          }
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 text-left">
          <SheetTitle>Problem with order #{orderNumber}</SheetTitle>
          <SheetDescription>
            Tell us what went wrong. The seller is notified straight away and
            you can follow the status on this page.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="flex flex-1 flex-col gap-5 p-5" noValidate>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">What happened?</legend>
            <div role="radiogroup" className="space-y-2">
              {types.map((t) => (
                <label
                  key={t}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                    type === t
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white hover:border-neutral-400",
                  )}
                >
                  <input
                    type="radio"
                    name="issue-type"
                    value={t}
                    checked={type === t}
                    onChange={() => {
                      setType(t);
                      setFieldErrors((f) => ({ ...f, type: "" }));
                    }}
                    className="sr-only"
                  />
                  {ISSUE_TYPE_LABEL[t]}
                </label>
              ))}
            </div>
            {fieldErrors.type && (
              <p role="alert" className="mt-2 text-xs text-red-600">
                {fieldErrors.type}
              </p>
            )}
          </fieldset>

          <div>
            <label htmlFor="issue-message" className="mb-2 block text-sm font-semibold">
              Details
            </label>
            <Textarea
              id="issue-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setFieldErrors((f) => ({ ...f, message: "" }));
              }}
              rows={5}
              maxLength={MAX + 200}
              placeholder="For example: the parcel was due on Tuesday and I still haven't received it."
              aria-invalid={Boolean(fieldErrors.message)}
              className="rounded-2xl"
            />
            <div className="mt-1 flex justify-between text-xs">
              <span role="alert" className="text-red-600">
                {fieldErrors.message}
              </span>
              <span
                className={cn(
                  message.trim().length > MAX ? "text-red-600" : "text-neutral-400",
                )}
              >
                {message.trim().length}/{MAX}
              </span>
            </div>
          </div>

          {formError && (
            <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={report.isPending}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition disabled:opacity-60"
          >
            {report.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send report
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
