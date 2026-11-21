"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sellerOnboardingSchema,
  SellerOnboardingValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { FloatingField } from "@/components/ui/floating-field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  AuthBrand,
  AuthShell,
  ChoiceCard,
  SectionLabel,
} from "@/components/features/auth/AuthShell";
import { EmailVerifyPanel } from "@/components/features/auth/EmailVerifyPanel";
import { useEmailVerification } from "@/components/features/auth/hooks/useEmailVerification";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { ONBOARDING_STORE_KEY } from "@/lib/store-design/purge";

import { sellingCategories } from "@/lib/store-design/selling-categories";

const steps = [
  { id: 1, title: "Seller Account" },
  { id: 2, title: "Verify Email" },
  { id: 3, title: "Store Details" },
  { id: 4, title: "Verification" },
];

function WizardSidebar({ currentStep }: { currentStep: number }) {
  return (
    <div>
      <AuthBrand />
      <h2 className="mt-8 text-2xl font-semibold tracking-tight md:mt-12">
        Build a store that feels like you.
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Tell us about your products. We’ll help you find a storefront that fits.
      </p>

      {/* Mobile: compact progress */}
      <div className="mt-5 md:hidden">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}:{" "}
          <span className="font-medium text-foreground">
            {steps[currentStep - 1].title}
          </span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: vertical stepper */}
      <ol className="mt-10 hidden md:block" aria-label="Progress">
        {steps.map((step, i) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <li
              key={step.id}
              aria-current={active ? "step" : undefined}
              className="relative flex items-start gap-4 pb-10 last:pb-0"
            >
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "absolute bottom-2 left-[17px] top-11 w-0.5 rounded-full transition-colors",
                    done ? "bg-accent" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done && "bg-accent text-accent-foreground",
                  active && "bg-accent text-accent-foreground",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </span>
              <span
                className={cn(
                  "pt-1.5 text-base font-semibold transition-colors",
                  done || active
                    ? "text-foreground"
                    : "text-muted-foreground/60",
                )}
              >
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function SellerOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const qc = useQueryClient();

  const form = useForm<SellerOnboardingValues>({
    resolver: zodResolver(sellerOnboardingSchema),
    defaultValues: {
      legalName: "",
      email: "",
      phone: "",
      password: "",
      sellerType: "INDIVIDUAL",
      storeName: "",
      storeSlug: "",
      storeCategory: "",
      storeDescription: "",
      tradeLicenseNumber: "",
      agreeTerms: undefined,
      brandColor: "#17233a",
      productLayout: "grid",
    },
    mode: "onChange",
  });

  // Email verification: the token only counts for the exact email it was issued for.
  const verification = useEmailVerification();
  const email = form.watch("email");
  const emailVerified = !!verification.tokenFor(email);

  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    // Creates the real seller account in the database and signs the seller in.
    // Store details (name, address, category, trade license, brand color,
    // layout) are saved by the seller/store endpoints that come next.
    mutationFn: (values: SellerOnboardingValues) =>
      authApi.register(
        {
          name: values.legalName,
          email: values.email,
          password: values.password,
          confirmPassword: values.password,
          role: "SELLER",
        },
        verification.tokenFor(values.email) ?? "",
      ),
    onMutate: () => setServerError(null),
    onSuccess: (user, values) => {
      // New seller account = new identity: never reuse the previous user's
      // cached "who am I", or the seller area bounces them to /account.
      qc.clear();
      qc.setQueryData(qk.auth.me, user);

      // The shop name is chosen here; the setup step that creates the store
      // picks it up so the seller doesn't have to type it twice.
      try {
        window.sessionStorage.setItem(
          ONBOARDING_STORE_KEY,
          JSON.stringify({
            userId: user.id,
            sellingCategory: values.storeCategory,
            storeDescription: values.storeDescription,
            brandColor: values.brandColor,
            productLayout: values.productLayout,
            storeName: values.storeName.trim(),
            storeSlug: values.storeSlug,
          }),
        );
      } catch {
        // Storage blocked: the setup page simply asks again.
      }
      // Next: choose a plan (free or paid), then create the store.
      router.push("/seller/plan");
      router.refresh();
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        // Show field errors on the step they belong to (account fields are step 1).
        const map: Record<string, keyof SellerOnboardingValues> = {
          name: "legalName",
          email: "email",
          password: "password",
        };
        let applied = false;
        for (const [field, message] of Object.entries(error.fields)) {
          const target = map[field];
          if (target) {
            form.setError(target, { type: "server", message });
            applied = true;
          }
        }
        if (applied) {
          setCurrentStep(1);
          return;
        }
        setServerError(
          error.code === "RATE_LIMITED" && error.retryAfter
            ? `Too many attempts. Please try again in ${error.retryAfter} seconds.`
            : error.code === "VERIFICATION_REQUIRED"
              ? "Your email verification expired. Go back to the Verify Email step and request a new code."
              : error.code === "INTERNAL"
                ? "We couldn't create your store. Please try again."
                : error.message,
        );
        return;
      }
      setServerError("We couldn't create your store. Please try again.");
    },
  });

  // Validate only the fields of the current step before proceeding
  const validateStep = async () => {
    let fieldsToValidate: (keyof SellerOnboardingValues)[] = [];

    if (currentStep === 1)
      fieldsToValidate = [
        "legalName",
        "email",
        "phone",
        "password",
        "sellerType",
      ];
    if (currentStep === 2) return emailVerified;
    if (currentStep === 3)
      fieldsToValidate = ["storeName", "storeSlug", "storeCategory"];
    if (currentStep === 4)
      fieldsToValidate = ["tradeLicenseNumber", "agreeTerms"];

    return form.trigger(fieldsToValidate);
  };

  const next = async () => {
    if (await validateStep()) setCurrentStep((prev) => prev + 1);
  };

  const back = () => setCurrentStep((prev) => prev - 1);

  // Enter advances the wizard instead of doing nothing
  const onKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (
      e.key === "Enter" &&
      currentStep < steps.length &&
      e.target instanceof HTMLInputElement
    ) {
      e.preventDefault();
      next();
    }
  };

  const storeSlug = form.watch("storeSlug");
  const sellerType = form.watch("sellerType");

  return (
    <AuthShell sidebar={<WizardSidebar currentStep={currentStep} />}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          onKeyDown={onKeyDown}
          className="flex min-h-[540px] flex-col"
        >
          <div className="mb-8 border-b pb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0C68F6]">
              Step {currentStep} of {steps.length}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {steps[currentStep - 1].title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {currentStep === 3
                ? "Give your store a name and tell us what you plan to sell."
                : "A few details to get your store ready."}
            </p>
          </div>
          <div className="flex-1 space-y-8">
            {/* --- STEP 1: ACCOUNT --- */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-3">
                  <SectionLabel>Account type</SectionLabel>
                  <FormField
                    control={form.control}
                    name="sellerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div
                            role="radiogroup"
                            aria-label="Seller type"
                            className="grid gap-3 sm:grid-cols-2"
                          >
                            <ChoiceCard
                              active={field.value === "INDIVIDUAL"}
                              onClick={() => field.onChange("INDIVIDUAL")}
                              icon={User}
                              title="Individual seller"
                              text="Selling as a person"
                            />
                            <ChoiceCard
                              active={field.value === "BUSINESS"}
                              onClick={() => field.onChange("BUSINESS")}
                              icon={Building2}
                              title="Registered business"
                              text="Selling with a trade license"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <SectionLabel>Your personal details</SectionLabel>
                  <FloatingField
                    control={form.control}
                    name="legalName"
                    label="Full legal name"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-4">
                  <SectionLabel>Contact details</SectionLabel>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FloatingField
                      control={form.control}
                      name="email"
                      label="Email address"
                      type="email"
                      autoComplete="email"
                    />
                    <FloatingField
                      control={form.control}
                      name="phone"
                      label="Mobile number"
                      type="tel"
                      autoComplete="tel"
                      hint="e.g. 01XXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <SectionLabel>Account security</SectionLabel>
                  <FloatingField
                    control={form.control}
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    className="sm:max-w-[calc(50%-0.5rem)]"
                  />
                </div>
              </div>
            )}

            {/* --- STEP 2: VERIFY EMAIL --- */}
            {currentStep === 2 && (
              <div className="animate-in fade-in duration-300">
                {emailVerified ? (
                  <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-medium">Email verified</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                  </div>
                ) : (
                  <EmailVerifyPanel
                    email={email}
                    verification={verification}
                    onVerified={() => setCurrentStep(3)}
                    onChangeEmail={() => setCurrentStep(1)}
                  />
                )}
              </div>
            )}

            {/* --- STEP 3: STORE DETAILS --- */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <SectionLabel>Your store</SectionLabel>
                  <FloatingField
                    control={form.control}
                    name="storeName"
                    label="Store name"
                    hint="This is public. Your legal name stays private."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FloatingField
                      control={form.control}
                      name="storeSlug"
                      label="Unique store URL"
                      hint={`shopbd.com/store/${storeSlug || "your-store"}`}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="storeCategory"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <h2 className="text-base font-semibold">
                        What kind of products will you sell?
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Choose your main category. We’ll recommend templates for
                        it in the store designer.
                      </p>
                      <div
                        className="grid gap-3 sm:grid-cols-2"
                        role="group"
                        aria-label="Main product category"
                      >
                        {sellingCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            aria-pressed={field.value === category.id}
                            onClick={() => field.onChange(category.id)}
                            className={cn(
                              "relative rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C68F6]",
                              field.value === category.id
                                ? "border-[#0C68F6] bg-[#0C68F6]/5 ring-1 ring-[#0C68F6]"
                                : "hover:border-[#0C68F6]/50",
                            )}
                          >
                            <span className="block pr-5 text-sm font-semibold">
                              {category.label}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {category.detail}
                            </span>
                            {field.value === category.id && (
                              <Check
                                aria-hidden
                                className="absolute right-3 top-4 h-4 w-4 text-[#0C68F6]"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <SectionLabel>About your store (optional)</SectionLabel>
                  <FloatingField
                    control={form.control}
                    name="storeDescription"
                    label="Store description"
                    multiline
                  />
                </div>
              </div>
            )}

            {/* --- STEP 4: VERIFICATION --- */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <SectionLabel>Identity verification</SectionLabel>
                  <div className="flex gap-3 rounded-xl bg-accent/5 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm text-muted-foreground">
                      Our team reviews every seller to keep ShopBD trusted.
                      Business sellers add their trade license below.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sellerType === "BUSINESS" && (
                      <FloatingField
                        control={form.control}
                        name="tradeLicenseNumber"
                        label="Trade license number"
                        hint="Required for registered businesses"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionLabel>Agreement</SectionLabel>
                  <FormField
                    control={form.control}
                    name="agreeTerms"
                    render={({ field }) => (
                      <FormItem>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:border-accent/50">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={!!field.value}
                              onChange={field.onChange}
                              className="mt-0.5 h-4 w-4 accent-accent"
                            />
                          </FormControl>
                          <span className="text-sm leading-snug">
                            I agree to the{" "}
                            <Link
                              href="/seller-agreement"
                              className="font-medium text-accent hover:underline"
                            >
                              Seller Agreement
                            </Link>{" "}
                            and{" "}
                            <Link
                              href="/privacy"
                              className="font-medium text-accent hover:underline"
                            >
                              Privacy Policy
                            </Link>
                          </span>
                        </label>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {serverError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {serverError}
              </p>
            )}
          </div>

          {/* Footer: divider + pill button */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="ghost"
                className="h-12 gap-2 rounded-full px-5"
                onClick={back}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-accent hover:underline"
                >
                  Sign in
                </Link>
              </p>
            )}

            {currentStep < steps.length ? (
              <Button
                type="button"
                variant="accent"
                className="h-12 rounded-full px-10 text-base"
                onClick={next}
                disabled={currentStep === 2 && !emailVerified}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="accent"
                className="h-12 rounded-full px-10 text-base"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                    account...
                  </>
                ) : (
                  "Create my account"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </AuthShell>
  );
}
