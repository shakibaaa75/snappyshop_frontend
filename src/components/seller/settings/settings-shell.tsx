"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SETTINGS_SECTIONS,
  sectionHref,
  settingsBase,
} from "./settings-nav";

/**
 * Frame for every /seller/[slug]/settings page.
 *
 * Desktop: the section list is a sidebar next to the page.
 * Mobile:  /settings shows the same list as a category list; a section page
 *          shows only itself, with a back link to the list.
 */
export function SettingsShell({
  storeSlug,
  children,
}: {
  storeSlug: string;
  children: React.ReactNode;
}) {
  const pathname = (usePathname() ?? "").replace(/\/$/, "");
  const base = settingsBase(storeSlug);
  const isIndex = pathname === base;
  // On desktop /settings shows the first section, so it is highlighted there.
  const activeId = isIndex
    ? SETTINGS_SECTIONS[0].id
    : SETTINGS_SECTIONS.find((s) => pathname.startsWith(sectionHref(storeSlug, s)))
        ?.id;

  return (
    <div className="w-full min-w-0">
      <header className={cn("mb-5 lg:mb-8", !isIndex && "hidden lg:block")}>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Manage your account, sign-in and store address.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <nav
          aria-label="Settings sections"
          className={cn(
            isIndex ? "block" : "hidden",
            "lg:sticky lg:top-6 lg:block",
          )}
        >
          <ul className="space-y-2 lg:space-y-1">
            {SETTINGS_SECTIONS.map((s) => {
              const active = s.id === activeId;
              const soon = s.status === "soon";
              return (
                <li key={s.id}>
                  <Link
                    href={sectionHref(storeSlug, s)}
                    aria-current={active && !isIndex ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors duration-200",
                      "lg:min-h-0 lg:rounded-full lg:border-transparent lg:bg-transparent",
                      active
                        ? "lg:border-primary lg:bg-primary lg:text-primary-foreground"
                        : "lg:text-muted-foreground lg:hover:bg-muted lg:hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted",
                        "lg:h-auto lg:w-auto lg:bg-transparent",
                      )}
                    >
                      <s.icon
                        className={cn(
                          "h-[18px] w-[18px]",
                          active && "lg:text-primary-foreground",
                        )}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {s.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground lg:hidden">
                        {s.description}
                      </span>
                    </span>
                    {soon && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
                          active && "lg:bg-white/20 lg:text-primary-foreground",
                        )}
                      >
                        Soon
                      </span>
                    )}
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-muted-foreground lg:hidden"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={cn("min-w-0", isIndex && "hidden lg:block")}>
          <Link
            href={base}
            className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1 rounded-full pl-2 pr-4 text-sm font-medium text-primary transition-colors hover:bg-muted lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            Settings
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
