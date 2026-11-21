"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/features/auth/OtpInput";
import { useEmailVerification } from "@/components/features/auth/hooks/useEmailVerification";
import { authPrimaryBtn } from "@/components/features/auth/Authcontrols";

type Verification = ReturnType<typeof useEmailVerification>;

interface EmailVerifyPanelProps {
  email: string;
  verification: Verification;
  /** True while the account is being created after a successful verification. */
  busy?: boolean;
  /** An error from the step after verification (e.g. registration failed). */
  serverError?: string | null;
  onVerified: (token: string) => void;
  onChangeEmail: () => void;
}

function maskEmail(email: string) {
  const [user, domain] = email.trim().split("@");
  if (!user || !domain) return email;
  return `${user[0]}${"•".repeat(Math.min(user.length - 1, 4))}@${domain}`;
}

export function EmailVerifyPanel({
  email,
  verification,
  busy,
  serverError,
  onVerified,
  onChangeEmail,
}: EmailVerifyPanelProps) {
  const [code, setCode] = useState("");
  const { sendIfNeeded, resend, verify, cooldown, error, sending, verifying } =
    verification;

  // Sends the first code when the panel opens; the hook ignores repeat calls.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => sendIfNeeded(email), [email]);

  const submit = (value: string) => {
    if (value.length !== 6 || verifying || busy) return;
    verify(email, value, {
      onSuccess: onVerified,
      onError: () => setCode(""),
    });
  };

  const message = serverError ?? error;

  return (
    <div className="space-y-6">
      <div className="space-y-3 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f2f5fa] text-[#0C68F6]">
          <MailCheck className="h-5 w-5" />
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#0C68F6]">
          Check your inbox
        </h2>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">
            {maskEmail(email)}
          </span>
          . It expires in 10 minutes. If you can&apos;t find it, check your spam
          folder.
        </p>
      </div>

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={submit}
        disabled={verifying || busy}
        invalid={!!message}
      />

      {message && (
        <p
          role="alert"
          className="auth-swap rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {message}
        </p>
      )}

      <Button
        type="button"
        className={authPrimaryBtn}
        disabled={code.length !== 6 || verifying || busy}
        onClick={() => submit(code)}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account…
          </>
        ) : verifying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying…
          </>
        ) : (
          "Verify email"
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onChangeEmail}
          className="group inline-flex items-center gap-1.5 rounded-sm text-muted-foreground outline-none transition-colors hover:text-[#0C68F6] focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
          Change email
        </button>
        {cooldown > 0 ? (
          <span className="text-muted-foreground">
            Resend code in {cooldown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={() => resend(email)}
            disabled={sending}
            className="rounded-sm font-semibold text-[#0C68F6] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>
    </div>
  );
}
