"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/http";
import { getApiErrorMessage } from "@/lib/api/form-errors";

function ForgotForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email },
        skipRefresh: true,
      });
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for {email}, we sent a 6-digit reset code. It can
          take a minute to arrive.
        </p>
        <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
          <Button className="w-full">Enter reset code</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-xl font-semibold">Forgot password?</h1>
      <p className="text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a reset code.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending…" : "Send reset code"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-accent hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <ForgotForm />
    </Suspense>
  );
}
