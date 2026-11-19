"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";

export default function LegacyDashboardRedirect() {
  const router = useRouter();
  const { data: me, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      router.replace("/login");
    } else if (me.role !== "SELLER") {
      router.replace("/account");
    } else if (me.storeSlug) {
      router.replace(`/seller/${me.storeSlug}/dashboard`);
    } else {
      router.replace("/seller/setup");
    }
  }, [me, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…
    </div>
  );
}
