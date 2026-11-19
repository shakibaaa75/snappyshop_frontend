"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Lock } from "lucide-react";
import { LockBadge, UpgradeNotice } from "@/components/seller/plan-lock";
import { useEntitlements } from "@/lib/query/entitlements";
import { premiumDesignAllowed } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import {
  type HomeSection,
  type HomeSectionId,
  sectionMeta,
} from "@/lib/store-design/types";
import { IconButton, Notice } from "../controls";
import { ToggleSwitch } from "./toggle-switch";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* Section arrangement                                                 */
/* ------------------------------------------------------------------ */

export function SectionArrangementPanel({ design, update }: PanelProps) {
  const { entitlements } = useEntitlements();
  const premium = premiumDesignAllowed(entitlements);
  const hero = design.sections.find((s) => s.id === "hero");
  const rest = design.sections.filter((s) => s.id !== "hero");
  const [dragId, setDragId] = useState<HomeSectionId | null>(null);
  const [overId, setOverId] = useState<HomeSectionId | null>(null);

  /* The hero banner is always written first */
  const commit = (next: HomeSection[]) =>
    update({ sections: hero ? [hero, ...next] : next });

  const move = (i: number, dir: -1 | 1) => {
    if (!premium) return;
    const j = i + dir;
    if (j < 0 || j >= rest.length) return;
    const next = [...rest];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  const drop = (targetId: HomeSectionId) => {
    if (!premium) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const from = rest.findIndex((s) => s.id === dragId);
    const to = rest.findIndex((s) => s.id === targetId);
    setDragId(null);
    setOverId(null);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...rest];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  };

  const toggle = (id: HomeSectionId, enabled: boolean) => {
    if (id === "gallery" && enabled && !premium) return;
    commit(rest.map((s) => (s.id === id ? { ...s, enabled } : s)));
  };

  return (
    <div className="space-y-3">
      {!premium && (
        <UpgradeNotice title="Arranging sections is a premium feature">
          Moving sections up or down is included with a paid plan. You can still
          switch any section on or off, and each template comes with its own
          arrangement.
        </UpgradeNotice>
      )}
      <Notice>
        {premium
          ? "Drag a section, or use the arrows, to choose where it appears on your homepage. The hero banner always stays at the top. Switch a section off to hide it."
          : "Switch a section off to hide it. The hero banner always stays at the top."}
      </Notice>

      {hero && (
        <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-3">
          <Lock
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {sectionMeta.hero.label}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Always first
            </span>
          </span>
        </div>
      )}

      <ol className="space-y-2" aria-label="Homepage sections">
        {rest.map((s, i) => {
          const meta = sectionMeta[s.id];
          const lockedPremium = s.id === "gallery" && !premium;
          return (
            <li
              key={s.id}
              draggable={premium}
              onDragStart={(e) => {
                if (!premium) {
                  e.preventDefault();
                  return;
                }
                setDragId(s.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (overId !== s.id) setOverId(s.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(s.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-sm transition",
                !s.enabled && "opacity-60",
                dragId === s.id && "opacity-40",
                overId === s.id &&
                  dragId &&
                  dragId !== s.id &&
                  "ring-2 ring-accent",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-7 shrink-0 items-center justify-center",
                  premium
                    ? "cursor-grab text-muted-foreground active:cursor-grabbing"
                    : "text-muted-foreground/40",
                )}
                aria-hidden
              >
                <GripVertical className="h-4 w-4" />
              </span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {meta.label}
                  {lockedPremium && <LockBadge className="ml-2 align-middle" />}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s.enabled ? meta.description : "Hidden from your store"}
                </span>
              </span>
              <div className="flex shrink-0 items-center">
                <IconButton
                  label={`Move ${meta.label} up`}
                  onClick={() => move(i, -1)}
                  disabled={!premium || i === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Move ${meta.label} down`}
                  onClick={() => move(i, 1)}
                  disabled={!premium || i === rest.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </IconButton>
              </div>
              <ToggleSwitch
                label={`Show ${meta.label}`}
                checked={s.enabled}
                onChange={(v) => toggle(s.id, v)}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
