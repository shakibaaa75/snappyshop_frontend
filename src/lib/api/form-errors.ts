import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { ApiError } from "./http";

/**
 * Copies the API's per-field errors onto a react-hook-form instance.
 * Returns true if at least one field error was applied, so the caller can
 * skip the generic banner.
 */
export function applyFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
): boolean {
  if (!(error instanceof ApiError)) return false;
  const known = Object.keys(form.getValues());
  let applied = false;
  for (const [field, message] of Object.entries(error.fields)) {
    if (known.includes(field)) {
      form.setError(field as Path<T>, { type: "server", message });
      applied = true;
    }
  }
  return applied;
}

/**
 * A user-friendly message for a failed request. `overrides` lets a form keep
 * its existing wording for specific error codes.
 */
export function getErrorMessage(
  error: unknown,
  fallback: string,
  overrides: Record<string, string> = {},
): string {
  if (!(error instanceof ApiError)) return fallback;
  if (overrides[error.code]) return overrides[error.code];
  if (error.code === "RATE_LIMITED" && error.retryAfter) {
    return `Too many attempts. Please try again in ${error.retryAfter} seconds.`;
  }
  if (error.code === "INTERNAL" || error.code === "UNKNOWN_ERROR") return fallback;
  return error.message || fallback;
}

/**
 * The most useful message for a failed request. The API answers a validation
 * problem with a generic message ("Invalid input") and puts the real
 * explanation in `fields`: checkout reports stock and variant problems under
 * `lines`, the reset form reports a bad code under `code`. Show that text, not
 * the generic one.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const detail = error.fields.lines ?? Object.values(error.fields)[0];
    if (detail) return detail;
  }
  return getErrorMessage(error, fallback);
}
