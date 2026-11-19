import Link from "next/link";
import { ArrowRight, Clock, MapPin, RotateCcw } from "lucide-react";
import type { StoreDesign } from "@/lib/store-design/types";

/** Shared by the published storefront and its editor preview. */
export function AboutContent({
  design,
  mobile = false,
}: {
  design: StoreDesign;
  mobile?: boolean;
}) {
  const base = `/store/${design.storeSlug}`;
  const layout = design.aboutLayout || "split";
  const centered = layout === "centered";
  const editorial = layout === "editorial";
  const store = design.storeName || "Our store";
  const title =
    design.aboutTitle || design.tagline || `The story behind ${store}`;
  const story = (
    design.aboutText ||
    design.storyText ||
    design.description ||
    ""
  ).trim();
  const paragraphs = story.split(/\n\s*\n/).filter(Boolean);
  const intro =
    design.description && design.description.trim() !== story
      ? design.description
      : "";
  const image = design.aboutImageUrl || design.coverUrl;
  const facts = [
    { label: "Visit us", value: design.address, Icon: MapPin },
    { label: "Opening hours", value: design.businessHours, Icon: Clock },
    {
      label: "Our return policy",
      value: design.showReturnPolicy ? design.returnPolicy : "",
      Icon: RotateCcw,
    },
  ].filter((item) => item.value?.trim());
  const surface = {
    background: "var(--s-surface)",
    borderColor: "var(--s-border)",
  };
  const quiet = { color: "var(--s-text)", opacity: 0.76 };
  const radius = { borderRadius: "var(--sf-radius-lg, 24px)" };

  const brandImage = image ? (
    <figure
      className={`relative overflow-hidden ${editorial && !mobile ? "aspect-[21/9]" : "aspect-[4/3]"}`}
      style={{ ...surface, ...radius }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={`${store} — our story`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </figure>
  ) : (
    <div
      className={`flex min-h-48 flex-col items-center justify-center gap-4 border p-7 ${!mobile && !centered && !editorial ? "md:min-h-72" : ""}`}
      style={{ ...surface, ...radius }}
    >
      {design.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={design.logoUrl}
          alt={store}
          loading="lazy"
          decoding="async"
          className="h-20 w-20 rounded-2xl object-contain"
        />
      ) : (
        <span
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-semibold"
          style={{
            background: "var(--s-primary)",
            color: "var(--s-on-primary)",
          }}
        >
          {store.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="max-w-full break-words text-center text-lg font-semibold tracking-tight">
        {store}
      </span>
    </div>
  );

  const introduction = (
    <div
      className={`min-w-0 ${centered ? "mx-auto max-w-2xl text-center" : ""}`}
    >
      <div
        className={`mb-4 flex items-center gap-3 ${centered ? "justify-center" : ""}`}
      >
        <span
          className="h-px w-8"
          style={{ background: "var(--s-text)", opacity: 0.4 }}
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={quiet}
        >
          About us
        </span>
      </div>
      <h1
        className={`break-words font-semibold leading-[1.12] tracking-[-0.035em] ${mobile ? "text-[30px]" : "text-3xl md:text-[42px]"}`}
        style={{ textWrap: "balance" }}
      >
        {title}
      </h1>
      {intro && (
        <p
          className={`mt-5 max-w-xl text-[15px] leading-7 ${centered ? "mx-auto" : ""}`}
          style={quiet}
        >
          {intro}
        </p>
      )}
      <div
        className={`mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 ${centered ? "justify-center" : ""}`}
      >
        <Link
          href={`${base}/products`}
          scroll={false}
          className="sf-btn !min-h-11 !px-5 !text-sm"
        >
          Explore the collection <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`${base}/contact`}
          scroll={false}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline decoration-current/30 underline-offset-4"
        >
          Get in touch
        </Link>
      </div>
    </div>
  );

  return (
    <article
      className={`mx-auto flex w-full max-w-5xl flex-col px-4 py-5 ${mobile ? "gap-8" : "gap-10 md:px-6 md:py-8"}`}
      style={{ color: "var(--s-text)" }}
    >
      {editorial ? (
        <header className="space-y-7">
          <div className="max-w-3xl">{introduction}</div>
          {brandImage}
        </header>
      ) : centered ? (
        <header className="space-y-7">
          {introduction}
          <div className="mx-auto w-full max-w-xl">{brandImage}</div>
        </header>
      ) : (
        <header
          className={`grid items-center gap-7 ${!mobile ? "md:grid-cols-[1.05fr_1fr] md:gap-10" : ""}`}
        >
          {introduction}
          {brandImage}
        </header>
      )}

      <section
        className={`grid gap-4 border-t pt-7 ${centered ? "mx-auto w-full max-w-2xl text-center" : !mobile ? "md:grid-cols-[1fr_2fr] md:gap-8" : ""}`}
        style={{ borderColor: "var(--s-border)" }}
      >
        <div>
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={quiet}
          >
            Behind the store
          </p>
          <h2 className="text-xl font-semibold tracking-tight">Our story</h2>
        </div>
        <div className="min-w-0 space-y-4">
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="whitespace-pre-line break-words text-[15px] leading-7"
                style={quiet}
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm leading-7" style={quiet}>
              Our story is coming soon. In the meantime, explore our collection
              or contact us with any questions.
            </p>
          )}
        </div>
      </section>

      {facts.length > 0 && (
        <section
          aria-label="Store information"
          className={`grid gap-3 ${!mobile && facts.length > 1 ? (facts.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2") : ""}`}
        >
          {facts.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="min-w-0 border p-5"
              style={{ ...surface, ...radius }}
            >
              <Icon className="mb-4 h-5 w-5" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold">{label}</h3>
              <p
                className="mt-2 whitespace-pre-line break-words text-sm leading-6"
                style={quiet}
              >
                {value}
              </p>
            </div>
          ))}
        </section>
      )}

      <footer
        className="flex flex-wrap items-center justify-between gap-4 border-t pt-5"
        style={{ borderColor: "var(--s-border)" }}
      >
        <span className="text-sm" style={quiet}>
          Have a question about our store?
        </span>
        <Link
          href={`${base}/contact`}
          scroll={false}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
        >
          Contact us <ArrowRight className="h-4 w-4" />
        </Link>
      </footer>
    </article>
  );
}
