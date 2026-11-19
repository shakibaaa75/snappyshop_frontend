import { type Category, type Product } from "@/lib/store-design/types";

/** Shared search matcher for desktop and mobile store search. */
function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
export function searchStoreProducts(
  products: Product[],
  categories: Category[],
  query: string,
  limit: number,
): Product[] {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const full = terms.join(" ");

  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  const startsWithWord = (text: string, term: string) =>
    text.split(" ").some((w) => w.startsWith(term));

  const scored: { p: Product; score: number }[] = [];

  for (const product of products) {
    const name = normalizeSearchText(product.name);
    const category = normalizeSearchText(categoryNames.get(product.categoryId));
    const extra = normalizeSearchText(
      [
        product.badge,
        ...(product.attributes ?? []).flatMap((a) => [a.key, a.value]),
        ...(product.options ?? []).flatMap((o) => [
          o.name,
          ...o.values.map((v) => v.label),
        ]),
      ].join(" "),
    );

    const matches = terms.every(
      (t) =>
        startsWithWord(name, t) ||
        startsWithWord(category, t) ||
        startsWithWord(extra, t),
    );
    if (!matches) continue;

    let score = 3;
    if (name.startsWith(full))
      score = 0; // name begins with what was typed
    else if (terms.every((t) => startsWithWord(name, t)))
      score = 1; // a word in the name begins with it
    else if (
      terms.every((t) => startsWithWord(name, t) || startsWithWord(category, t))
    )
      score = 2;

    scored.push({ p: product, score });
  }

  return scored
    .sort((a, b) => a.score - b.score || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}
