import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  id,
  title,
  href,
  linkLabel = "View All",
}: {
  /** Put on the <h2> so the parent <section> can use aria-labelledby. */
  id?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2
        id={id}
        className="text-xl font-semibold tracking-tight text-primary dark:text-[#FF4D3D] md:text-2xl"
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 rounded-sm text-xs font-semibold text-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-[#F5A524] focus-visible:ring-offset-2"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </Link>
      )}
    </div>
  );
}
