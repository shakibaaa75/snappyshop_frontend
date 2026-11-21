"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
import { applyFieldErrors, getErrorMessage } from "@/lib/api/form-errors";
import { useEmailVerification } from "@/components/features/auth/hooks/useEmailVerification";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { AuthShell } from "@/components/features/auth/AuthShell";
import {
  AuthField,
  OrDivider,
  SocialButtons,
  authPrimaryBtn,
} from "@/components/features/auth/Authcontrols";
import { EmailVerifyPanel } from "@/components/features/auth/EmailVerifyPanel";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShoppingBag, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "details" | "verify";

const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"];
const strengthColors = [
  "bg-[#dce2eb]",
  "bg-destructive",
  "bg-amber-500",
  "bg-[#5FA8A2]",
  "bg-[#0C68F6]",
];

const textLink =
  "rounded-sm font-semibold text-[#0C68F6] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2";

function passwordScore(password: string) {
  if (password.length < 8) return 0;
  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;
  return score;
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordScore(password);
  return (
    <div className="auth-swap space-y-1.5 px-1 pt-1" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
              i <= score ? strengthColors[score] : "bg-[#dce2eb]",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength:{" "}
        <span className="font-medium text-foreground">
          {strengthLabels[score]}
        </span>
      </p>
    </div>
  );
}

const roles = [
  { value: "BUYER", label: "Buyer", icon: ShoppingBag },
  { value: "SELLER", label: "Seller", icon: Store },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const defaultRole: RegisterFormValues["role"] =
    roleParam === "seller" ? "SELLER" : "BUYER";

  const [step, setStep] = useState<Step>("details");
  const [serverError, setServerError] = useState<string | null>(null);
  const verification = useEmailVerification();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: defaultRole,
      agreeTerms: undefined,
    },
  });

  const role = form.watch("role");
  const email = form.watch("email");
  const password = form.watch("password");

  const mutation = useMutation({
    mutationFn: ({
      values,
      token,
    }: {
      values: RegisterFormValues;
      token: string;
    }) => authApi.register(values, token),
    onMutate: () => setServerError(null),
    onSuccess: (user) => {
      // A new account is a new identity: drop everything cached for the previous
      // one, otherwise an old "who am I" (e.g. a buyer) is reused for up to 5
      // minutes and a seller gets bounced to /account.
      qc.clear();
      qc.setQueryData(qk.auth.me, user);

      // Sellers go to onboarding; buyers go to their account.
      const dest =
        user.role === "SELLER"
          ? user.storeSlug
            ? `/seller/${user.storeSlug}/dashboard`
            : "/seller/setup"
          : "/account";
      router.push(dest);
      router.refresh();
    },
    onError: (error) => {
      if (applyFieldErrors(form, error)) {
        setStep("details");
        return;
      }
      setServerError(
        getErrorMessage(
          error,
          "We couldn't create your account. Please try again.",
          {
            EMAIL_TAKEN: "An account with this email already exists.",
            VERIFICATION_REQUIRED:
              "Your email verification expired. Request a new code and try again.",
            RATE_LIMITED:
              "Too many attempts. Please wait a moment and try again.",
            NETWORK_ERROR:
              "Couldn't reach the server. Check your connection and try again.",
          },
        ),
      );
    },
  });

  // Details are valid -> verify the email before the account is created.
  const onDetailsSubmit = (values: RegisterFormValues) => {
    setServerError(null);
    const token = verification.tokenFor(values.email);
    if (token) mutation.mutate({ values, token });
    else setStep("verify");
  };

  const isBuyer = role === "BUYER";

  return (
    <AuthShell>
      {step === "details" ? (
        <div className="auth-swap">
          <h1 className="text-3xl font-semibold tracking-tight text-[#17233a]">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Discover your next favourite find, or start building your own store.
          </p>

          {/* Buyer / Seller switch */}
          <div
            role="radiogroup"
            aria-label="Account type"
            className="mt-8 grid grid-cols-2 rounded-full bg-[#f2f5fa] p-1"
          >
            {roles.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={role === value}
                onClick={() => {
                  if (value === "SELLER") router.push("/register?role=seller");
                  else form.setValue("role", value, { shouldValidate: true });
                }}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2 motion-reduce:transition-none",
                  role === value
                    ? "bg-[#0C68F6] text-white shadow-sm"
                    : "text-[#0C68F6]/70 hover:text-[#0C68F6]",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          {form.formState.errors.role && (
            <p className="mt-2 text-center text-xs text-destructive">
              {form.formState.errors.role.message}
            </p>
          )}

          {/* Google / Apple: buyers only. Slides away for sellers. */}
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
              isBuyer
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden" inert={!isBuyer}>
              <div className="space-y-6 pt-6">
                <SocialButtons />
                <OrDivider>or sign up with email</OrDivider>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onDetailsSubmit)}
              className="mt-6 space-y-3"
              noValidate
            >
              <AuthField
                control={form.control}
                name="name"
                placeholder="Full name"
                icon={User}
                autoComplete="name"
              />
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
                autoComplete="new-password"
              />
              <AuthField
                control={form.control}
                name="confirmPassword"
                placeholder="Confirm password"
                type="password"
                icon={Lock}
                autoComplete="new-password"
              />
              <PasswordStrength password={password} />

              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="px-1 pt-2">
                    <label className="flex cursor-pointer items-start gap-3">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={!!field.value}
                          onChange={field.onChange}
                          className="mt-0.5 h-4 w-4 accent-[#0C68F6]"
                        />
                      </FormControl>
                      <span className="text-sm leading-snug text-muted-foreground">
                        I agree to the{" "}
                        <Link href="/terms" className={textLink}>
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className={textLink}>
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError && (
                <p
                  role="alert"
                  className="auth-swap rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {serverError}
                </p>
              )}

              <div className="pt-3">
                <Button
                  type="submit"
                  className={authPrimaryBtn}
                  disabled={mutation.isPending}
                >
                  Continue
                </Button>
              </div>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className={textLink}>
              Login
            </Link>
          </p>
        </div>
      ) : (
        <div className="auth-swap">
          <EmailVerifyPanel
            email={email}
            verification={verification}
            busy={mutation.isPending}
            serverError={serverError}
            onVerified={(token) =>
              mutation.mutate({ values: form.getValues(), token })
            }
            onChangeEmail={() => {
              setServerError(null);
              setStep("details");
            }}
          />
        </div>
      )}
    </AuthShell>
  );
}
