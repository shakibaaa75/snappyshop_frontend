"use client";

import Link from "next/link";
import { MapPin, Package, UserPen } from "lucide-react";
import { useBuyerProfile } from "@/lib/query/buyer";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder profile page. The real profile card (avatar, stats, badges)
 * replaces this in part 1c.
 */
export default function AccountHome() {
  const { data: profile, isLoading } = useBuyerProfile();

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        {isLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <h1 className="text-2xl font-bold">Hello, {profile?.name ?? "there"}!</h1>
        )}
        <p className="mt-1 text-sm text-neutral-500">
          Your ShopBD buyer profile is being built step by step.
        </p>
      </div>

      <div className="grid gap-3">
        {[
          { href: "/account/profile", label: "Edit profile", icon: UserPen },
          { href: "/account/addresses", label: "Saved addresses", icon: MapPin },
          { href: "/account/orders", label: "My orders", icon: Package },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-medium shadow-sm transition active:scale-[0.99]"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
