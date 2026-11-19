import { cn } from "@/lib/utils";

export function CategoryThumb({
  name,
  imageUrl,
  className,
  textClassName,
}: {
  name: string;
  imageUrl?: string | null;
  /** Size and shape, e.g. "h-6 w-6" or "h-16 w-16". */
  className?: string;
  /** Size of the fallback letter, e.g. "text-xl". */
  textClassName?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-700",
        textClassName ?? "text-xs",
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
