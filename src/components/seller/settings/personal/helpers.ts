"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/http";
import { getErrorMessage } from "@/lib/api/form-errors";

/** Wording for the API's error codes in this section. */
export const PERSONAL_MESSAGES: Record<string, string> = {
  INVALID_CODE: "That code isn't correct. Check it and try again.",
  CODE_EXPIRED: "That code has expired. Request a new one.",
  TOO_MANY_ATTEMPTS: "Too many wrong codes. Request a new one.",
  EMAIL_TAKEN: "An account with this email already exists.",
  PHONE_TAKEN: "This phone number is already verified on another account.",
  EMAIL_CHANGED: "Your email address changed in the meantime. Please start again.",
  ALREADY_VERIFIED: "This is already verified.",
  PASSWORD_REQUIRED:
    "Your account has no password yet. Create one first, then come back.",
  EMAIL_NOT_CONFIGURED:
    "We can't send email right now, so this can't be done yet. Please try again later.",
  SMS_NOT_CONFIGURED:
    "We can't send text messages right now, so this can't be done yet. Please try again later.",
  OTP_STORE_NOT_CONFIGURED:
    "Verification codes aren't available right now. Please try again later.",
  OTP_STORE_UNAVAILABLE:
    "Verification codes are temporarily unavailable. Please try again in a moment.",
  SEND_FAILED: "We couldn't send the code. Please try again in a moment.",
  UPLOADS_OFF: "Photo upload isn't available right now. Please try again later.",
  FILE_TOO_LARGE: "That photo is too large. Choose one under 2 MB.",
  UNSUPPORTED_MEDIA: "Use a JPG, PNG or WebP photo.",
  NETWORK_ERROR:
    "Couldn't reach the server. Check your connection and try again.",
};

/** Fields the change forms show inline. Anything else becomes the main message. */
export type FieldName = "newEmail" | "phone" | "currentPassword";
const FIELDS: FieldName[] = ["newEmail", "phone", "currentPassword"];

export interface ParsedError {
  message: string;
  fields: Partial<Record<FieldName, string>>;
  code: string;
  retryAfter?: number;
}

export function parseError(e: unknown, fallback: string): ParsedError {
  const fields: Partial<Record<FieldName, string>> = {};
  if (e instanceof ApiError) {
    for (const f of FIELDS) {
      if (e.fields[f]) fields[f] = e.fields[f];
    }
    // A conflict on a field (EMAIL_TAKEN / PHONE_TAKEN) is shown under that field.
    const hasFields = Object.keys(fields).length > 0;
    return {
      code: e.code,
      retryAfter: e.retryAfter,
      fields,
      message: hasFields ? "" : getErrorMessage(e, fallback, PERSONAL_MESSAGES),
    };
  }
  return { code: "UNKNOWN", fields, message: fallback };
}

/** Whole-second countdown, e.g. the wait before a code can be sent again. */
export function useCountdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const start = useCallback((seconds: number) => setLeft(Math.max(0, Math.ceil(seconds))), []);
  return { left, start };
}
