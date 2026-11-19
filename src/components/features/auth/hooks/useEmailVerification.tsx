"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/form-errors";

const messages = {
  EMAIL_TAKEN: "An account with this email already exists.",
  INVALID_CODE: "That code isn't correct. Check it and try again.",
  CODE_EXPIRED: "That code has expired. Request a new one.",
  TOO_MANY_ATTEMPTS: "Too many wrong codes. Request a new one.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  NETWORK_ERROR:
    "Couldn't reach the server. Check your connection and try again.",
};

const norm = (email: string) => email.trim().toLowerCase();

/**
 * Email verification state shared by the buyer form and the seller wizard.
 * The token it stores is only valid for the exact email it was issued for.
 */
export function useEmailVerification() {
  const lastSent = useRef<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState<{
    email: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendMutation = useMutation({
    mutationFn: (email: string) => authApi.sendEmailCode(norm(email)),
    onMutate: () => setError(null),
    onSuccess: (res) => setCooldown(res.resendAfter),
    onError: (e) => {
      lastSent.current = null; // allow a retry
      setError(
        getErrorMessage(
          e,
          "We couldn't send the code. Please try again.",
          messages,
        ),
      );
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authApi.verifyEmailCode(norm(email), code),
    onMutate: () => setError(null),
    onSuccess: (token, { email }) => setVerified({ email: norm(email), token }),
    onError: (e) =>
      setError(
        getErrorMessage(
          e,
          "We couldn't verify that code. Please try again.",
          messages,
        ),
      ),
  });

  return {
    cooldown,
    error,
    sending: sendMutation.isPending,
    verifying: verifyMutation.isPending,

    /** Sends a code once per email (safe to call from an effect). */
    sendIfNeeded: (email: string) => {
      if (lastSent.current === norm(email)) return;
      lastSent.current = norm(email);
      sendMutation.mutate(email);
    },

    /** Sends a fresh code. Ignored while the cooldown is running. */
    resend: (email: string) => {
      if (cooldown > 0) return;
      lastSent.current = norm(email);
      sendMutation.mutate(email);
    },

    verify: (
      email: string,
      code: string,
      handlers: { onSuccess: (token: string) => void; onError?: () => void },
    ) =>
      verifyMutation.mutate(
        { email, code },
        { onSuccess: handlers.onSuccess, onError: handlers.onError },
      ),

    /** The verification token if this exact email has been verified, else null. */
    tokenFor: (email: string) =>
      verified && verified.email === norm(email) ? verified.token : null,
  };
}
