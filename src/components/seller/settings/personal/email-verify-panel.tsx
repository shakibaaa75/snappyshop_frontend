"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { personalApi, type PersonalInfo } from "@/lib/api/personal";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/features/auth/OtpInput";
import { parseError, useCountdown } from "./helpers";

/** Verify the current email: a code goes to that address, no password needed. */
export function EmailVerifyCodePanel({
  email,
  onDone,
  onCancel,
}: {
  email: string;
  onDone: (p: PersonalInfo) => void;
  onCancel: () => void;
}) {
  const [sentOnce, setSentOnce] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const timer = useCountdown();

  const fail = (e: unknown, fallback: string) => {
    const p = parseError(e, fallback);
    setError(p.message);
    if (p.code === "RATE_LIMITED" && p.retryAfter) timer.start(p.retryAfter);
    if (p.code === "CODE_EXPIRED" || p.code === "TOO_MANY_ATTEMPTS") {
      setCode("");
      timer.start(0);
    }
  };

  const send = useMutation({
    mutationFn: personalApi.requestEmailVerify,
    onMutate: () => setError(""),
    onSuccess: (r) => {
      setSentOnce(true);
      setCode("");
      timer.start(r.resendAfter);
    },
    onError: (e) => fail(e, "We couldn't send the code. Please try again."),
  });

  const confirm = useMutation({
    mutationFn: (c: string) => personalApi.confirmEmailVerify(c),
    onMutate: () => setError(""),
    onSuccess: onDone,
    onError: (e) => fail(e, "We couldn't verify that code. Please try again."),
  });

  return (
    <div className="mt-3 space-y-4 rounded-xl bg-muted/60 p-4">
      {!sentOnce ? (
        <>
          <p className="text-sm">
            We&apos;ll send a 6-digit code to <strong className="break-all">{email}</strong>.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
              {timer.left > 0 && ` (${timer.left}s)`}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => send.mutate()} disabled={send.isPending || timer.left > 0}>
              {send.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {timer.left > 0 ? `Wait ${timer.left}s` : "Send code"}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium" aria-live="polite">
              We sent a 6-digit code to {email}.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">It expires in 10 minutes.</p>
          </div>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError("");
            }}
            onComplete={(v) => !confirm.isPending && confirm.mutate(v)}
            disabled={confirm.isPending}
            invalid={!!error}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => confirm.mutate(code)} disabled={code.length !== 6 || confirm.isPending}>
              {confirm.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Verify
            </Button>
            <Button variant="outline" onClick={() => send.mutate()} disabled={timer.left > 0 || send.isPending}>
              {timer.left > 0 ? `Resend in ${timer.left}s` : "Resend code"}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
