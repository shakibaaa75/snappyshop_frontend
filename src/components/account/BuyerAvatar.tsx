import { cn } from "@/lib/utils";

/** Round avatar: the buyer's photo, or their initials when there is none. */
export function BuyerAvatar({
  name,
  src,
  className,
}: {
  name?: string;
  src?: string;
  className?: string;
}) {
  const initials =
    (name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700",
        className,
      )}
    >
      {src ? (
        // Buyer photos can live on any https host, so next/image is not used.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
