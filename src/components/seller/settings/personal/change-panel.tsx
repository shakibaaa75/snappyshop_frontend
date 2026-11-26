"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { personalApi, type PersonalInfo } from "@/lib/api/personal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { OtpInput } from "@/components/features/auth/OtpInput";
import { parseError, useCountdown, type FieldName } from "./helpers";

type Channel = "email" | "phone";

const COPY = {
  email: {
    label: "New email address",
    placeholder: "name@example.com",
    hint: "We'll send a 6-digit code to this address. Your email only changes after you enter it.",
    sentTo: (v: string) => `We sent a 6-digit code to ${v}.`,
    field: "newEmail" as FieldName,
    fallbackSend: "We couldn't send the code. Please try again.",
  },
  phone: {
    label: "New phone number",
    placeholder: "01XXXXXXXXX",
    hint: "A Bangladesh mobile number. We'll text you a 6-digit code. This is separate from your store's public contact number.",
    sentTo: (v: string) => `We texted a 6-digit code to ${v}.`,
    field: "phone" as FieldName,
    fallbackSend: "We couldn't send the code. Please try again.",
  },
};

/**
 * Change the email or phone: password again, then a code sent to the NEW
 * address / number. Nothing on the account changes until the code is right.
 */
export function ChangePanel({
  channel,
  hasPassword,
  onDone,
  onCancel,
}: {
  channel: Channel;
  hasPassword: boolean;
  onDone: (p: PersonalInfo) => void;
  onCancel: () => void;
}) {
  const copy = COPY[channel];
  const [step, setStep] = useState<"form" | "code">("form");
  const [target, setTarget] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [error, setError] = useState("");
  const timer = useCountdown();
  const ids = { target: `chg-${channel}-target`, password: `chg-${channel}-password` };

  const fail = (e: unknown, fallback: string, backToForm = false) => {
    const p = parseError(e, fallback);
    setFieldErrors(p.fields);
    setError(p.message);
    if (p.code === "RATE_LIMITED" && p.retryAfter) timer.start(p.retryAfter);
    if (p.code === "CODE_EXPIRED" || p.code === "TOO_MANY_ATTEMPTS") {
      setCode("");
      timer.start(0);
    }
    // A bad password / address must be fixed on the form, not on the code step.
    if (backToForm && Object.keys(p.fields).length > 0) setStep("form");
  };

  const send = useMutation({
    mutationFn: () =>
      channel === "email"
        ? personalApi.requestEmailChange({ newEmail: target.trim(), currentPassword: password })
        : personalApi.requestPhoneChange({ phone: target.trim(), currentPassword: password }),
    onMutate: () => {
      setError("");
      setFieldErrors({});
    },
    onSuccess: (r) => {
      setStep("code");
      setCode("");
      timer.start(r.resendAfter);
    },
    onError: (e) => fail(e, copy.fallbackSend, true),
  });

  const confirm = useMutation({
    mutationFn: (c: string) =>
      channel === "email"
        ? personalApi.confirmEmailChange({ newEmail: target.trim(), code: c })
        : personalApi.confirmPhoneChange({ phone: target.trim(), code: c }),
    onMutate: () => setError(""),
    onSuccess: (p) => {
      setPassword("");
      onDone(p);
    },
    onError: (e) => fail(e, "We couldn't verify that code. Please try again."),
  });

  if (!hasPassword) {
    return (
      <div className="mt-3 rounded-xl bg-muted p-4 text-sm" role="note">
        <p className="font-medium">Create a password first</p>
        <p className="mt-1 text-muted-foreground">
          You signed up with Google or Apple, so there is no password to
          re-enter. To change this securely, create a password, then come back.
        </p>
        <div className="mt-3 flex gap-2">
          <Button asChild size="sm">
            <Link href="/forgot-password">Create a password</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const canSend = target.trim() !== "" && password !== "" && !send.isPending;

  if (step === "form") {
    return (
      <form
        className="mt-3 space-y-4 rounded-xl bg-muted/60 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) send.mutate();
        }}
        noValidate
      >
        <div className="space-y-1.5">
          <label htmlFor={ids.target} className="text-sm font-medium">
            {copy.label}
          </label>
          <Input
            id={ids.target}
            type={channel === "email" ? "email" : "tel"}
            inputMode={channel === "email" ? "email" : "tel"}
            autoComplete={channel === "email" ? "email" : "tel-national"}
            autoFocus
            value={target}
            placeholder={copy.placeholder}
            maxLength={254}
            onChange={(e) => setTarget(e.target.value)}
            aria-invalid={!!fieldErrors[copy.field] || undefined}
            aria-describedby={`${ids.target}-msg`}
          />
          <p
            id={`${ids.target}-msg`}
            className={fieldErrors[copy.field] ? "text-sm text-destructive" : "text-xs text-muted-foreground"}
            role={fieldErrors[copy.field] ? "alert" : undefined}
          >
            {fieldErrors[copy.field] ?? copy.hint}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={ids.password} className="text-sm font-medium">
            Current password
          </label>
          <PasswordInput
            id={ids.password}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!fieldErrors.currentPassword || undefined}
            aria-describedby={`${ids.password}-msg`}
          />
          <p
            id={`${ids.password}-msg`}
            className={fieldErrors.currentPassword ? "text-sm text-destructive" : "text-xs text-muted-foreground"}
            role={fieldErrors.currentPassword ? "alert" : undefined}
          >
            {fieldErrors.currentPassword ?? "We ask again to make sure it's really you."}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
            {timer.left > 0 && ` (${timer.left}s)`}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!canSend || timer.left > 0}>
            {send.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {timer.left > 0 ? `Wait ${timer.left}s` : "Send code"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 space-y-4 rounded-xl bg-muted/60 p-4">
      <div>
        <p className="text-sm font-medium" aria-live="polite">
          {copy.sentTo(target.trim())}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          It expires in 10 minutes.
        </p>
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

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => confirm.mutate(code)}
          disabled={code.length !== 6 || confirm.isPending}
        >
          {confirm.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Confirm
        </Button>
        <Button
          variant="outline"
          onClick={() => send.mutate()}
          disabled={timer.left > 0 || send.isPending}
        >
          {timer.left > 0 ? `Resend in ${timer.left}s` : "Resend code"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setStep("form");
            setCode("");
            setError("");
          }}
        >
          {channel === "email" ? "Use a different email" : "Use a different number"}
        </Button>
      </div>
    </div>
  );
}
