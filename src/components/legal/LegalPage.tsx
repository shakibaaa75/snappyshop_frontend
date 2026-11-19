import Link from "next/link";
import { LEGAL_META, type LegalDoc } from "@/lib/legal/content";

const LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Return & Refund Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
];

/** Renders one legal document. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div>
        <h1 className="text-3xl font-extrabold text-primary">{doc.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Effective date: {LEGAL_META.effectiveDate} · Last updated:{" "}
          {LEGAL_META.lastUpdated}
        </p>
      </div>

      <p className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm">
        {doc.intro}
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
        <nav
          aria-label="On this page"
          className="md:sticky md:top-20 md:self-start text-sm"
        >
          <p className="mb-2 font-semibold">On this page</p>
          <ul className="space-y-1.5">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="space-y-8 text-sm leading-7">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="mb-2 text-lg font-bold">{s.title}</h2>
              <div className="space-y-2">
                {s.body.map((line, i) =>
                  line.startsWith("- ") ? (
                    <ul key={i} className="list-disc pl-5">
                      <li>{line.slice(2)}</li>
                    </ul>
                  ) : (
                    <p key={i}>{line}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </article>
      </div>

      <div className="mt-12 border-t pt-6 text-sm">
        <p className="mb-2 font-semibold">Related policies</p>
        <div className="flex flex-wrap gap-4">
          {LINKS.filter((l) => l.href !== `/${doc.slug}`).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="underline underline-offset-2 hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
