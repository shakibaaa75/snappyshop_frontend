"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
import { applyFieldErrors, getErrorMessage } from "@/lib/api/form-errors";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AuthShell } from "@/components/features/auth/AuthShell";
import {
  AuthField,
  OrDivider,
  SocialButtons,
  authPrimaryBtn,
} from "@/components/features/auth/Authcontrols";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";

const textLink =
  "rounded-sm font-semibold text-[#0C68F6] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2";

const socialErrors: Record<string, string> = {
  social_cancelled: "Sign-in was cancelled. You can try again.",
  social_expired: "That sign-in took too long. Please try again.",
  social_failed: "We couldn't sign you in with that account. Please try again.",
  social_unavailable: "That sign-in method isn't available right now.",
  social_email_unverified:
    "Your account has no verified email address, so we can't use it to sign in.",
  social_email_taken: "An account with this email already exists.",
  social_suspended:
    "This account has been suspended. Contact support if you believe this is a mistake.",
  social_not_allowed: "This account can't sign in with Google or Apple.",
};

export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // A failed Google / Apple sign-in sends people back here with ?error=social_...
  const socialError = searchParams.get("error");
  const [serverError, setServerError] = useState<string | null>(
    socialError ? (socialErrors[socialError] ?? null) : null,
  );

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => authApi.login(values),
    onMutate: () => setServerError(null),
    onSuccess: (user) => {
      // A new login is a new identity: drop everything cached for the previous
      // one, otherwise an old "who am I" (e.g. a buyer) is reused for up to 5
      // minutes and a seller gets bounced to /account.
      qc.clear();
      qc.setQueryData(qk.auth.me, user);

      // Role-based landing:
      //   admin                  → /admin (asks for the admin 2FA if needed)
      //   seller with a store   → /seller/<slug>/dashboard
      //   seller without a store → /seller/setup
      //   buyer                  → /account
      const roleDest =
        user.role === "ADMIN"
          ? "/admin"
          : user.role === "SELLER"
            ? user.storeSlug
              ? `/seller/${user.storeSlug}/dashboard`
              : "/seller/setup"
            : "/account";

      // Honor ?next= if the visitor was bounced from a protected page.
      const dest = next && next.startsWith("/") ? next : roleDest;
      router.push(dest);
      router.refresh();
    },
    onError: (error) => {
      if (applyFieldErrors(form, error)) return;
      setServerError(
        getErrorMessage(
          error,
          "We couldn't sign you in. Please check your details and try again.",
          {
            INVALID_CREDENTIALS:
              "We couldn't sign you in. Please check your details and try again.",
            ACCOUNT_SUSPENDED:
              "This account has been suspended. Contact support if you believe this is a mistake.",
            RATE_LIMITED:
              "Too many attempts. Please wait a moment and try again.",
            NETWORK_ERROR:
              "Couldn't reach the server. Check your connection and try again.",
          },
        ),
      );
    },
  });

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Sign in to <span className="text-[#0C68F6]">SnappyShops</span>
      </h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="mt-8 space-y-3"
          noValidate
        >
          <AuthField
            control={form.control}
            name="email"
            placeholder="Email"
            type="email"
            icon={Mail}
            autoComplete="email"
          />
          <AuthField
            control={form.control}
            name="password"
            placeholder="Password"
            type="password"
            icon={Lock}
            autoComplete="current-password"
          />

          <div className="pb-1 text-center">
            <Link
              href="/forgot-password"
              className={`${textLink} text-sm font-medium`}
            >
              Forgot password?
            </Link>
          </div>

          {serverError && (
            <p
              role="alert"
              className="auth-swap rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            className={authPrimaryBtn}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </Form>

      <div className="my-6">
        <OrDivider />
      </div>

      <SocialButtons next={next} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link href="/register" className={textLink}>
          Sign up
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Want to sell?{" "}
        <Link href="/register?role=seller" className={textLink}>
          Open a store
        </Link>
      </p>
    </AuthShell>
  );
}
