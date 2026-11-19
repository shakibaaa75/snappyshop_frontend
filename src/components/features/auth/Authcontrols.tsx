"use client";

import { useState } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

/** Main teal pill button. Use with <Button className={authPrimaryBtn}>. */
export const authPrimaryBtn =
  "group h-12 w-full gap-2 rounded-full bg-[#17645F] text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#17645F]/90 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#FF6845] focus-visible:ring-offset-2";

/** Pill input with a left icon, and a show/hide eye for passwords. */
export function AuthField<T extends FieldValues>({
  control,
  name,
  placeholder,
  icon: Icon,
  type = "text",
  autoComplete,
}: {
  control: Control<T>;
  name: Path<T>;
  placeholder: string;
  icon: LucideIcon;
  type?: "text" | "email" | "password";
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="space-y-1.5">
          <div className="relative">
            <Icon
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#17645F]/55"
            />
            <FormControl>
              <input
                {...field}
                value={field.value ?? ""}
                type={isPassword && show ? "text" : type}
                placeholder={placeholder}
                aria-label={placeholder}
                autoComplete={autoComplete}
                className={cn(
                  "h-12 w-full rounded-full border border-[#E6DDD0] bg-white pl-11 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-[#17645F] focus:ring-2 focus:ring-[#17645F]/15",
                  isPassword ? "pr-12" : "pr-4",
                  fieldState.error &&
                    "border-destructive focus:border-destructive focus:ring-destructive/15",
                )}
              />
            </FormControl>
            {isPassword && (
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className={cn(
                  "absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#17645F]/55 transition-colors hover:bg-[#F3EEE8] hover:text-[#17645F]",
                  focusRing,
                )}
              >
                {show ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )}
              </button>
            )}
          </div>
          <FormMessage className="px-4 text-xs" />
        </FormItem>
      )}
    />
  );
}

/** "──── or ────" */
export function OrDivider({ children = "or" }: { children?: React.ReactNode }) {
  return (
    <div
      role="separator"
      className="flex items-center gap-4 text-xs text-muted-foreground"
    >
      <span className="h-px flex-1 bg-[#E6DDD0]" />
      {children}
      <span className="h-px flex-1 bg-[#E6DDD0]" />
    </div>
  );
}

/*
 * The buttons are plain links: the browser leaves for Google / Apple and comes
 * back through the backend, which sets the login cookies and redirects here.
 *
 * Start and callback must be on the SAME host. Set NEXT_PUBLIC_API_URL to the
 * backend's public URL, or leave it empty if Next proxies /api/v1/* to it.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function oauthHref(provider: "google" | "apple", next?: string | null) {
  const base = `${API_BASE}/api/v1/auth/${provider}/start`;
  return next && next.startsWith("/")
    ? `${base}?next=${encodeURIComponent(next)}`
    : base;
}

const socialBase = cn(
  "flex h-12 w-full items-center justify-center gap-3 rounded-full text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  focusRing,
);

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.29v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.3A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.39-2.3V6.61H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.39l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l4 3.09C6.23 6.88 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

/** Continue with Google / Apple. Buyers only. */
export function SocialButtons({ next }: { next?: string | null }) {
  return (
    <div className="space-y-3">
      <a
        href={oauthHref("google", next)}
        className={cn(
          socialBase,
          "bg-[#F3EEE8] text-[#17645F] hover:bg-[#EAE2D7]",
        )}
      >
        <GoogleG />
        Continue with Google
      </a>
      <a
        href={oauthHref("apple", next)}
        className={cn(
          socialBase,
          "bg-[#FF6845] text-white hover:bg-[#FF6845]/90",
        )}
      >
        <AppleLogo />
        Continue with Apple
      </a>
    </div>
  );
}
