"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/http";
import { getApiErrorMessage } from "@/lib/api/form-errors";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: { email, code, newPassword: password },
        skipRefresh: true,
      });
      router.push("/login");
    } catch (err) {
      setError(getApiErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-xl font-semibold">Enter reset code</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        placeholder="6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        maxLength={6}
        required
      />
      <Input
        type="password"
        placeholder="New password (min 8 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Resetting…" : "Reset password"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Code not working or expired?{" "}
        <Link
          href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
          className="text-accent hover:underline"
        >
          Send a new code
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
