"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onCredentials(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true);
      setError(null);
      const res = await adminApi.adminLogin(email.trim(), password);
      setInfo(res.message || "Code sent to your email");
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onOTP(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true);
      setError(null);
      await adminApi.adminVerifyOTP(email.trim(), code.trim());
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Super Admin</h1>
            <p className="text-xs text-zinc-500">
              {step === "credentials" ? "Email & password" : "Email verification code"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
        {info && step === "otp" && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {info}
          </div>
        )}

        {step === "credentials" ? (
          <form onSubmit={onCredentials} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Email</label>
              <Input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onOTP} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">6-digit code</label>
              <Input
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 tracking-widest"
                placeholder="000000"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & enter"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-zinc-500 hover:text-blue-600"
              onClick={() => {
                setStep("credentials");
                setCode("");
                setInfo(null);
              }}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
