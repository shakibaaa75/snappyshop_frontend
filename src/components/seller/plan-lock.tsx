"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Link to the seller's subscription page. */
export function useUpgradeHref() {
  const { slug } = useParams<{ slug: string }>();
  return slug ? `/seller/${slug}/subscription` : "/";
}

/** Small "Pro" pill with a lock, for cards and headings. */
export function LockBadge({
  label = "Upgrade",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800",
        className,
      )}
    >
      <Lock className="h-3 w-3" aria-hidden /> {label}
    </span>
  );
}

/** Banner shown on top of a locked section. */
export function UpgradeNotice({
  title,
  children,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const href = useUpgradeHref();
  return (
    <div
      role="note"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900",
        className,
      )}
    >
      <Lock className="h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {children && <p className="mt-0.5 text-xs text-amber-800">{children}</p>}
      </div>
      <Link
        href={href}
        className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
      >
        Upgrade
      </Link>
    </div>
  );
}
