import { Image as ImageIcon } from "lucide-react";

/** Shown when a template or card that sits on a decorative background is chosen. */
export function PngTip() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4"
    >
      <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <div>
        <p className="text-sm font-semibold">
          Tip: use PNG photos with no background
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          This design shows each product on a decorative background. Transparent
          PNG photos (the product cut out, no background) look much better than
          regular photos with a background.
        </p>
      </div>
    </div>
  );
}
