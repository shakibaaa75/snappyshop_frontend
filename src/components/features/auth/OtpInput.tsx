"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called once all digits are entered (typed, pasted or autofilled). */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) =>
    refs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();

  const commit = (next: string) => {
    onChange(next);
    if (next.length === LENGTH) onComplete?.(next);
  };

  return (
    <div
      role="group"
      aria-label="6-digit verification code"
      className="flex justify-between gap-2"
    >
      {Array.from({ length: LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (!digits) return;
            // Autofill (SMS/email suggestion) delivers the whole code at once.
            if (digits.length > 1) {
              const all = digits.slice(0, LENGTH);
              commit(all);
              focus(all.length);
              return;
            }
            const at = Math.min(i, value.length);
            commit(
              (value.slice(0, at) + digits + value.slice(at + 1)).slice(
                0,
                LENGTH,
              ),
            );
            focus(at + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (value[i]) {
                commit(value.slice(0, i) + value.slice(i + 1));
              } else if (i > 0) {
                commit(value.slice(0, i - 1) + value.slice(i));
                focus(i - 1);
              }
            } else if (e.key === "ArrowLeft") {
              focus(i - 1);
            } else if (e.key === "ArrowRight") {
              focus(i + 1);
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, LENGTH);
            if (!text) return;
            commit(text);
            focus(text.length);
          }}
          className={cn(
            "h-12 w-full max-w-[3.25rem] rounded-xl border bg-background text-center text-lg font-semibold outline-none transition-colors",
            "focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60",
            invalid &&
              "border-destructive focus:border-destructive focus:ring-destructive/30",
          )}
        />
      ))}
    </div>
  );
}
