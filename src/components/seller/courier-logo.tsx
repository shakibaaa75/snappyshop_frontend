"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Courier logos, keyed by provider id. Add one line to support a new courier.
 * Anything without a logo (or whose image fails to load) falls back to a
 * letter badge.
 */
const R2 = "https://pub-26505cd19886412c924eeb2ebb98afb2.r2.dev/logs";
const LOGOS: Record<string, string> = {
  pathao: `${R2}/images.png`,
  steadfast: `${R2}/images%20(1).png`,
};

export function CourierLogo({
  provider,
  name,
  size = 40,
  muted = false,
  className,
}: {
  /** Provider id from the API, e.g. "pathao". */
  provider: string;
  name: string;
  size?: number;
  /** Greyed out (couriers that are not working). */
  muted?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = LOGOS[provider];
  const box = { width: size, height: size };

  if (!src || failed) {
    return (
      <span
        style={box}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
          muted ? "bg-neutral-300" : "bg-primary",
          className,
        )}
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      style={box}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-card ring-1 ring-border",
        muted && "opacity-60 grayscale",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-contain p-1.5"
      />
    </span>
  );
}
