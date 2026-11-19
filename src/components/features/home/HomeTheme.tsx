"use client";

import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useBuyerProfile } from "@/lib/query/buyer";
import { qk } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

/**
 * Wraps the HOME PAGE ONLY. When the signed-in buyer chose "Dark" in their
 * account settings, this adds the `dark` class, which switches the colour
 * variables (see `.dark` in globals.css) and every `dark:` style inside.
 *
 * Nothing outside this wrapper changes: other pages, the header and the
 * account area keep the light look. Visitors who are not signed in as a
 * buyer always get light.
 */
export function HomeTheme({ children }: { children: ReactNode }) {
  // Same keys as the header, so this reuses the cached user (no extra request).
  const { data: me } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 30_000,
  });
  const { data: profile } = useBuyerProfile(me?.role === "BUYER");
  const dark = profile?.homeTheme === "dark";

  // The header sits outside this wrapper (in the layout), and the mobile menu
  // renders in a portal, so the `dark` class also goes on <html> while the
  // home page is open. It is removed when the visitor leaves the home page.
  useEffect(() => {
    if (!dark) return;
    const root = document.documentElement;
    root.classList.add("dark");
    return () => root.classList.remove("dark");
  }, [dark]);

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground transition-colors duration-200 motion-reduce:transition-none",
        dark && "dark",
      )}
    >
      {children}
    </div>
  );
}
