"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resolveHeaderStyle,
  type StoreDesign,
  uid,
} from "@/lib/store-design/types";
import {
  ChoiceGrid,
  IconButton,
  Panel,
  TextAreaField,
  TextField,
  ToggleRow,
} from "../controls";
import { type PanelProps } from "./types";

function HeaderLayoutThumb({ layout }: { layout: string }) {
  return (
    <svg
      viewBox="0 0 160 76"
      className="h-20 w-full rounded-lg border bg-background"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="7"
        width="144"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity=".15"
      />
      {layout === "minimal" ? (
        <g fill="currentColor">
          <circle cx="24" cy="37" r="10" opacity=".35" />
          <rect x="43" y="32" width="65" height="5" rx="2" />
          <rect x="43" y="42" width="43" height="3" opacity=".3" />
          <rect x="123" y="32" width="25" height="12" rx="6" opacity=".3" />
        </g>
      ) : layout === "editorial" ? (
        <g fill="currentColor">
          <rect x="8" y="18" width="85" height="49" rx="4" opacity=".18" />
          <circle cx="116" cy="25" r="7" opacity=".4" />
          <rect x="103" y="39" width="43" height="5" rx="2" />
          <rect x="103" y="49" width="32" height="3" opacity=".3" />
        </g>
      ) : layout === "spotlight" ? (
        <g fill="currentColor">
          <rect x="8" y="22" width="89" height="7" rx="2" />
          <rect x="8" y="34" width="69" height="7" rx="2" />
          <rect x="8" y="52" width="34" height="10" rx="5" opacity=".4" />
          <rect x="111" y="18" width="41" height="49" rx="20" opacity=".18" />
        </g>
      ) : layout === "framed" ? (
        <g fill="currentColor">
          <rect x="8" y="17" width="144" height="36" rx="4" opacity=".2" />
          <rect
            x="28"
            y="36"
            width="104"
            height="31"
            rx="5"
            fill="var(--background, white)"
            stroke="currentColor"
            strokeOpacity=".2"
          />
          <circle cx="45" cy="49" r="6" opacity=".4" />
          <rect x="58" y="45" width="59" height="4" rx="2" />
          <rect x="58" y="54" width="37" height="3" opacity=".3" />
        </g>
      ) : layout === "banner" ? (
        <g fill="currentColor">
          <rect x="8" y="17" width="144" height="50" rx="4" opacity=".55" />
          <rect x="18" y="48" width="76" height="5" rx="2" fill="white" />
          <rect x="18" y="57" width="46" height="3" fill="white" opacity=".5" />
        </g>
      ) : (
        <g fill="currentColor">
          <rect x="8" y="17" width="144" height="29" rx="4" opacity=".2" />
          <circle cx="19" cy="58" r="7" opacity=".4" />
          <rect x="33" y="54" width="71" height="4" rx="2" />
          <rect x="33" y="62" width="43" height="3" opacity=".3" />
        </g>
      )}
    </svg>
  );
}
export function HeaderPanel({ design, update }: PanelProps) {
  const patchLink = (id: string, p: Partial<StoreDesign["navLinks"][number]>) =>
    update({
      navLinks: design.navLinks.map((l) => (l.id === id ? { ...l, ...p } : l)),
    });

  const moveLink = (i: number, dir: -1 | 1) => {
    const next = [...design.navLinks];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    update({ navLinks: next });
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Announcement bar"
        description="Promote delivery, offers or news at the very top."
      >
        <ToggleRow
          label="Show announcement bar"
          checked={design.announcementEnabled}
          onChange={(v) => update({ announcementEnabled: v })}
        />
        {design.announcementEnabled && (
          <TextField
            label="Message"
            value={design.announcementText}
            onChange={(v) => update({ announcementText: v })}
            placeholder="Free delivery on orders over ৳999"
            maxLength={90}
          />
        )}
      </Panel>

      <Panel
        title="Header"
        description="How your cover, profile image and store name are arranged at the top of your store."
      >
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Layout</p>
          <ChoiceGrid
            label="Header layout"
            cols={2}
            value={resolveHeaderStyle(design.headerStyle)}
            onChange={(v) => update({ headerStyle: v })}
            options={[
              { value: "standard", label: "Classic" },
              { value: "banner", label: "Banner" },
              { value: "minimal", label: "Minimal" },
              { value: "editorial", label: "Editorial" },
              { value: "framed", label: "Framed" },
              { value: "spotlight", label: "Spotlight" },
            ].map((option) => ({
              ...option,
              value: option.value as StoreDesign["headerStyle"],
              preview: <HeaderLayoutThumb layout={option.value} />,
            }))}
          />
        </div>
        <ToggleRow
          label="Search"
          description="Lets shoppers search products in your store."
          checked={design.showSearch}
          onChange={(v) => update({ showSearch: v })}
        />
        <ToggleRow
          label="Cart icon"
          checked={design.showCartIcon}
          onChange={(v) => update({ showCartIcon: v })}
        />
        <ToggleRow
          label="Keep header visible while scrolling"
          checked={design.stickyHeader}
          onChange={(v) => update({ stickyHeader: v })}
        />
      </Panel>

      <Panel title="Menu links" description="Shown in your header and footer.">
        {design.navLinks.map((l, i) => (
          <div key={l.id} className="space-y-2 rounded-xl border p-2.5">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                aria-label={`Link ${i + 1} label`}
                value={l.label}
                maxLength={20}
                placeholder="Label"
                onChange={(e) => patchLink(l.id, { label: e.target.value })}
                className="h-11"
              />
              <Input
                aria-label={`Link ${i + 1} address`}
                value={l.url}
                placeholder="/page"
                onChange={(e) => patchLink(l.id, { url: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="flex justify-end gap-1">
              <IconButton
                label="Move up"
                onClick={() => moveLink(i, -1)}
                disabled={i === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton
                label="Move down"
                onClick={() => moveLink(i, 1)}
                disabled={i === design.navLinks.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={`Delete ${l.label || "link"}`}
                danger
                onClick={() =>
                  update({
                    navLinks: design.navLinks.filter((x) => x.id !== l.id),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          disabled={design.navLinks.length >= 8}
          onClick={() =>
            update({
              navLinks: [
                ...design.navLinks,
                { id: uid(), label: "New link", url: "/" },
              ],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {design.navLinks.length >= 8 ? "Maximum of 8 links" : "Add link"}
        </Button>
      </Panel>

      <Panel title="Footer">
        <ToggleRow
          label="Show footer"
          checked={design.showFooter}
          onChange={(v) => update({ showFooter: v })}
        />
        {design.showFooter && (
          <TextAreaField
            label="Footer text"
            value={design.footerText}
            onChange={(v) => update({ footerText: v })}
            rows={2}
            maxLength={140}
          />
        )}
      </Panel>
    </div>
  );
}
