import Link from "next/link";
import { ShoppingBag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** One quiet fade-up, same easing as the home hero. Off for "reduce motion". */
const AUTH_CSS = `
@keyframes auth-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.auth-card { animation: auth-rise 500ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
.auth-swap { animation: auth-rise 320ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
@media (prefers-reduced-motion: reduce) { .auth-card, .auth-swap { animation: none; } }
`;

export function AuthBrand() {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full text-[#0C68F6] outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2",
      )}
    >
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0C68F6] text-white">
        <ShoppingBag className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span className="text-xl font-extrabold tracking-tight">ShopBD</span>
    </Link>
  );
}

/**
 * Compact card for sign-in; a responsive split layout for seller onboarding.
 */
export function AuthShell({
  children,
  sidebar,
}: {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "auth-card w-full overflow-hidden rounded-3xl border border-[#dce2eb] bg-white shadow-sm",
        sidebar
          ? "grid max-w-5xl md:grid-cols-[300px_minmax(0,1fr)]"
          : "max-w-md",
      )}
    >
      <style>{AUTH_CSS}</style>
      {sidebar && (
        <aside className="border-b border-[#dce2eb] bg-[#eff5ff] p-6 md:border-b-0 md:border-r md:p-8">
          {sidebar}
        </aside>
      )}
      <div className="min-w-0 p-6 sm:p-10">{children}</div>
    </div>
  );
}

/** Kept so older imports still compile. The side panel is gone. */
export function AuthPromo(_props: { title: string; text: string }) {
  return null;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#0C68F6]">
      {children}
    </h3>
  );
}

/**
 * Selectable option card for the onboarding wizard (seller type, product
 * layout). Used inside a role="radiogroup" wrapper.
 */
export function ChoiceCard({
  active,
  onClick,
  icon: Icon,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  text?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-left outline-none transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-[#0C68F6] focus-visible:ring-offset-2",
        "motion-reduce:transition-none",
        active
          ? "border-[#0C68F6] bg-[#0C68F6]/5 ring-1 ring-[#0C68F6]"
          : "border-[#dce2eb] bg-white hover:border-[#0C68F6]/50",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
          active ? "bg-[#0C68F6] text-white" : "bg-[#F4EEE4] text-[#0C68F6]",
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#0C68F6]">
          {title}
        </span>
        {text && (
          <span className="mt-0.5 block text-xs text-[#0C68F6]/70">{text}</span>
        )}
      </span>
    </button>
  );
}
