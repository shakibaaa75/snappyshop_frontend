"use client";

import { Check, Moon, Sun, type LucideIcon } from "lucide-react";
import type { HomeTheme } from "@/lib/api/buyer";
import { useBuyerProfile, useSetHomeTheme } from "@/lib/query/buyer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const OPTIONS: {
  value: HomeTheme;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Tiny preview of the look, so the choice is not just a word. */
  preview: { page: string; card: string; line: string };
}[] = [
  {
    value: "light",
    label: "Light",
    hint: "Bright cream background",
    icon: Sun,
    preview: { page: "bg-[#F3EEE8]", card: "bg-white", line: "bg-[#17645F]" },
  },
  {
    value: "dark",
    label: "Dark",
    hint: "Easy on the eyes at night",
    icon: Moon,
    preview: { page: "bg-black", card: "bg-neutral-800", line: "bg-green-500" },
  },
];

export default function AccountSettings() {
  const { data: profile, isLoading } = useBuyerProfile();
  const save = useSetHomeTheme();
  const current: HomeTheme = profile?.homeTheme === "dark" ? "dark" : "light";

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Choose how ShopBD looks for you.
        </p>
      </div>

      <section
        aria-labelledby="home-appearance"
        className="rounded-3xl bg-white p-6 shadow-sm"
      >
        <h2 id="home-appearance" className="text-lg font-semibold">
          Home page appearance
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Applies to the home page only. Saved on your account, so it follows
          you on every device.
        </p>

        {isLoading ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-labelledby="home-appearance"
            className="mt-5 grid gap-3 sm:grid-cols-2"
          >
            {OPTIONS.map(({ value, label, hint, icon: Icon, preview }) => {
              const on = current === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={save.isPending}
                  onClick={() => !on && save.mutate(value)}
                  className={cn(
                    "rounded-2xl border-2 p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-wait",
                    on
                      ? "border-[#17645F] bg-[#17645F]/5"
                      : "border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-20 flex-col justify-center gap-1.5 rounded-xl px-3",
                      preview.page,
                    )}
                    aria-hidden
                  >
                    <div className={cn("h-7 rounded-md", preview.card)} />
                    <div
                      className={cn("h-1.5 w-1/3 rounded-full", preview.line)}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="text-sm font-semibold">{label}</span>
                    {on && (
                      <Check
                        className="ml-auto h-4 w-4 text-[#17645F]"
                        aria-label="Selected"
                      />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>
                </button>
              );
            })}
          </div>
        )}

        {save.isError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            Couldn’t save your choice. Please try again.
          </p>
        )}
        <p className="sr-only" aria-live="polite">
          {save.isSuccess ? "Saved" : ""}
        </p>
      </section>
    </div>
  );
}
