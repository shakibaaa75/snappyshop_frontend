"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Segmented, TextField } from "../controls";
import type { PanelProps } from "./types";

type LinkKind = "product" | "category" | "custom";
type Catalog = Pick<PanelProps, "products" | "categories">;

export function StoreLinkPicker({ label: fieldLabel, url, slug, products, categories, onChange }: Catalog & {
  label: string;
  url: string;
  slug: string;
  onChange: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<LinkKind>("product");
  const [query, setQuery] = useState("");
  const base = `/store/${encodeURIComponent(slug)}/products`;
  const destination = (type: LinkKind, id: string) =>
    type === "category" ? `${base}?category=${encodeURIComponent(id)}` : `${base}/${encodeURIComponent(id)}`;
  const linkedProduct = url.startsWith(base + "/")
    ? products.find((item) => destination("product", item.id) === url) : undefined;
  const linkedCategory = url.startsWith(base + "?category=")
    ? categories.find((item) => destination("category", item.id) === url) : undefined;
  const options = kind === "product" ? products : categories;
  const matches = options.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const label = linkedProduct ? `Product · ${linkedProduct.name}` :
    linkedCategory ? `Category · ${linkedCategory.name}` : url;

  function finish(value: string) {
    onChange(value);
    setEditing(false);
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium">{fieldLabel}</p>
      {url && <p className="break-words text-xs text-muted-foreground">{label}</p>}
      {!editing ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => {
            setKind(linkedCategory ? "category" : url && !linkedProduct ? "custom" : "product");
            setQuery(url && !linkedCategory && !linkedProduct ? url : "");
            setEditing(true);
          }}>{url ? "Change link" : "Choose link"}</Button>
          {url && <Button type="button" size="sm" variant="ghost" onClick={() => finish("")}>Remove link</Button>}
        </div>
      ) : (
        <>
          <Segmented<LinkKind> label={fieldLabel} value={kind}
            options={[{ value: "product", label: "Product" }, { value: "category", label: "Category" }, { value: "custom", label: "Custom URL" }]}
            onChange={(value) => { setKind(value); setQuery(value === "custom" && !linkedProduct && !linkedCategory ? url : ""); }} />
          {kind === "custom" ? (
            <>
              <TextField label="Custom URL" value={query} onChange={setQuery} placeholder="/store/your-shop/products" />
              <Button type="button" size="sm" variant="outline" disabled={!query.trim()} onClick={() => finish(query.trim())}>Save link</Button>
            </>
          ) : (
            <>
              <label className="block space-y-1 text-sm">
                <span>{kind === "product" ? "Search products" : "Search categories"}</span>
                <input key={kind} type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}
                  placeholder="Type a name…" className="h-10 w-full rounded-md border bg-background px-3" />
              </label>
              {matches.length ? (
                <ul className="max-h-48 overflow-y-auto rounded-md border">
                  {matches.slice(0, 50).map((item) => (
                    <li key={item.id}>
                      <button type="button" className="min-h-10 w-full break-words px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted"
                        onClick={() => finish(destination(kind, item.id))}>{item.name}</button>
                    </li>
                  ))}
                </ul>
              ) : <p role="status" className="text-xs text-muted-foreground">No matching {kind === "product" ? "products" : "categories"}.</p>}
              {matches.length > 50 && <p className="text-xs text-muted-foreground">Showing the first 50 matches. Type more to narrow the list.</p>}
            </>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </>
      )}
    </div>
  );
}
