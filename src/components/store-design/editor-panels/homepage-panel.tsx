"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { LockBadge } from "@/components/seller/plan-lock";
import { useEntitlements } from "@/lib/query/entitlements";
import { premiumDesignAllowed } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import {
  type HomeSection,
  type HomeSectionId,
  sectionMeta,
} from "@/lib/store-design/types";
import { IconButton, Notice } from "../controls";
import { SectionSettings } from "./section-settings";
import { summary } from "./section-summary";
import { ToggleSwitch } from "./toggle-switch";
import { type PanelProps } from "./types";

export function HomepagePanel(panel: PanelProps) {
  const { design, update } = panel;
  const [open, setOpen] = useState<HomeSectionId | null>("hero");
  const { entitlements } = useEntitlements();
  const premium = premiumDesignAllowed(entitlements);

  const patchSection = (id: HomeSectionId, p: Partial<HomeSection>) =>
    update({
      sections: design.sections.map((s) => (s.id === id ? { ...s, ...p } : s)),
    });

  const move = (i: number, dir: -1 | 1) => {
    const next = [...design.sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    /* The hero banner always stays at the top */
    if (next[i].id === "hero" || next[j].id === "hero") return;
    [next[i], next[j]] = [next[j], next[i]];
    update({ sections: next });
  };

  return (
    <div className="space-y-3">
      <Notice>
        Use the arrows to change the order. Tap a section to edit it. Turn a
        section off to hide it from your store.
      </Notice>
      {design.sections.map((s, i) => {
        const meta = sectionMeta[s.id];
        const expanded = open === s.id;
        return (
          <div
            key={s.id}
            className={cn(
              "overflow-hidden rounded-2xl border bg-card shadow-sm transition",
              !s.enabled && "opacity-70",
              expanded && "ring-1 ring-accent/60",
            )}
          >
            <div className="flex items-center gap-1 p-2">
              <div className="flex flex-col">
                <IconButton
                  label={`Move ${meta.label} up`}
                  onClick={() => move(i, -1)}
                  disabled={
                    i === 0 ||
                    s.id === "hero" ||
                    design.sections[i - 1]?.id === "hero"
                  }
                >
                  <ArrowUp className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Move ${meta.label} down`}
                  onClick={() => move(i, 1)}
                  disabled={i === design.sections.length - 1 || s.id === "hero"}
                >
                  <ArrowDown className="h-4 w-4" />
                </IconButton>
              </div>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : s.id)}
                className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {meta.label}
                    {s.id === "gallery" && !premium && (
                      <LockBadge className="ml-2 align-middle" />
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.enabled ? summary(s, design) : "Hidden from your store"}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>
              <div className="pr-2">
                <ToggleSwitch
                  label={`Show ${meta.label}`}
                  checked={s.enabled}
                  onChange={(v) => {
                    /* Premium section: open its panel instead of enabling */
                    if (s.id === "gallery" && v && !premium) {
                      setOpen("gallery");
                      return;
                    }
                    patchSection(s.id, { enabled: v });
                  }}
                />
              </div>
            </div>
            {expanded && (
              <div className="animate-in fade-in slide-in-from-top-1 border-t bg-muted/20 p-4 duration-200">
                <SectionSettings
                  section={s}
                  patch={(p) => patchSection(s.id, p)}
                  panel={panel}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
