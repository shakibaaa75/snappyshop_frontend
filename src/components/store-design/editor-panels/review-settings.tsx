"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/http";
import { authApi } from "@/lib/api/auth";
import { qk } from "@/lib/query/keys";
import { Segmented, TextField, ToggleRow } from "../controls";
import type { PanelProps } from "./types";

type PublishedReview = {
  id: string;
  name: string;
  buyerName?: string;
  title?: string;
  body?: string;
  rating: number;
};

export function ReviewSettings({ design, update }: PanelProps) {
  const [page, setPage] = useState(0);
  const me = useQuery({ queryKey: qk.auth.me, queryFn: authApi.me });
  const manual = !!design.reviewPickedOnly;
  const ids = design.reviewPickedIds ?? [];
  const reviews = useQuery({
    queryKey: ["reviews", me.data?.id, "homepage-picker", page],
    queryFn: ({ signal }) =>
      apiFetch<{ rows: PublishedReview[]; count: number }>(
        "/seller/reviews?status=Published&page=" + page,
        { signal },
      ),
    enabled: manual && !!me.data?.id,
  });
  return (
    <div className="space-y-5">
      <TextField
        label="Section heading"
        value={design.reviewHeading ?? ""}
        placeholder="Customer reviews"
        maxLength={80}
        onChange={(reviewHeading) => update({ reviewHeading })}
      />
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Review layout</legend>
        <Segmented
          label="Review layout"
          value={design.reviewLayout || "grid"}
          options={[
            { value: "grid", label: "Grid" },
            { value: "carousel", label: "Carousel" },
            { value: "testimonial", label: "Testimonials" },
          ]}
          onChange={(reviewLayout) => update({ reviewLayout })}
        />
      </fieldset>
      <label className="block text-sm">
        Section padding · {design.reviewPadding ?? 20}px
        <input
          type="range"
          className="block w-full"
          min={0}
          max={64}
          value={design.reviewPadding ?? 20}
          onChange={(e) => update({ reviewPadding: Number(e.target.value) })}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label>
          <input
            type="checkbox"
            checked={!!design.reviewColor}
            onChange={(e) =>
              update({ reviewColor: e.target.checked ? "#ffffff" : undefined })
            }
          />{" "}
          Custom background
        </label>
        {design.reviewColor && (
          <input
            type="color"
            aria-label="Background color"
            value={design.reviewColor}
            onChange={(e) => update({ reviewColor: e.target.value })}
          />
        )}
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Reviews to show</legend>
        <select
          aria-label="Review selection"
          className="w-full rounded-lg border bg-background p-2 text-sm"
          value={manual ? "pick" : "existing"}
          onChange={(e) =>
            update({ reviewPickedOnly: e.target.value === "pick" })
          }
        >
          <option value="existing">Use previously featured reviews</option>
          <option value="pick">Choose published reviews</option>
        </select>
        {manual && (
          <>
            <p className="text-xs text-muted-foreground">
              {ids.length} of 10 selected
            </p>
            {reviews.isLoading && <p role="status">Loading reviews…</p>}
            {reviews.error && <p role="alert">{reviews.error.message}</p>}
            {reviews.data && !reviews.data.rows?.length && (
              <p className="text-sm">No published reviews on this page.</p>
            )}
            {reviews.data?.rows?.map((r) => (
              <label
                key={r.id}
                className="flex items-start gap-2 rounded-lg border p-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={ids.includes(r.id)}
                  disabled={!ids.includes(r.id) && ids.length >= 10}
                  onChange={(e) =>
                    update({
                      reviewPickedIds: e.target.checked
                        ? [...ids, r.id]
                        : ids.filter((id) => id !== r.id),
                    })
                  }
                />
                <span className="min-w-0">
                  <strong>{r.name}</strong>
                  <span className="block text-xs">
                    {r.buyerName || "Customer"} · {r.rating}/5
                  </span>
                  <span className="line-clamp-2 break-words">
                    {r.title || r.body}
                  </span>
                </span>
              </label>
            ))}
            {(page > 0 || (reviews.data?.count ?? 0) > 10) && (
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  disabled={!page}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                Page {page + 1}
                <button
                  type="button"
                  disabled={(page + 1) * 10 >= (reviews.data?.count ?? 0)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </fieldset>
    </div>
  );
}

export function HomepageReviewsPanel(panel: PanelProps) {
  const { design, update } = panel;
  return (
    <div className="space-y-5">
      <ToggleRow
        label="Show reviews on homepage"
        description="Move Reviews in Section arrangement to change its position."
        checked={
          !!design.sections.find((section) => section.id === "reviews")?.enabled
        }
        onChange={(enabled) =>
          update({
            sections: design.sections.map((section) =>
              section.id === "reviews" ? { ...section, enabled } : section,
            ),
          })
        }
      />
      <ReviewSettings {...panel} />
    </div>
  );
}
