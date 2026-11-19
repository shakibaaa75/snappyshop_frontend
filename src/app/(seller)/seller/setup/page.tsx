"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import { saveDraft } from "@/lib/store-design/api";
import { defaultDesign } from "@/lib/store-design/types";
import { slugify } from "@/lib/store-design/utilts";
import { ApiError } from "@/lib/api/http";
import { ONBOARDING_STORE_KEY } from "@/lib/store-design/purge";
import {
  clearPlanIntent,
  readPlanIntent,
  subscriptionUrl,
} from "@/lib/plan-intent";

import {
  sellingCategories,
  normalizeSellingCategory,
} from "@/lib/store-design/selling-categories";

export default function SellerSetupPage() {
  const router = useRouter();
  const created = useRef(false);
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false,
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [sellingCategory, setSellingCategory] = useState("");
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState(defaultDesign.primaryColor);
  const [productsPerRow, setProductsPerRow] = useState(
    defaultDesign.productsPerRow,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (created.current) return;
    if (!isLoading && me?.storeSlug) {
      router.replace(`/seller/${me.storeSlug}/dashboard`);
    }
    if (!isLoading && me && me.role !== "SELLER") {
      router.replace("/account");
    }
    if (!isLoading && !me) {
      router.replace("/login?next=/seller/setup");
    }
  }, [me, isLoading, router]);

  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(name || ""));
  }, [name, slugTouched]);

  // Carry over the shop name and address typed in the registration wizard.
  // Declared AFTER the effect above so its slug wins on the first render.
  useEffect(() => {
    if (!me?.id || me.role !== "SELLER") return;
    try {
      const raw = window.sessionStorage.getItem(ONBOARDING_STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        userId?: string;
        sellingCategory?: string;
        storeDescription?: string;
        brandColor?: string;
        productLayout?: string;
        storeName?: string;
        storeSlug?: string;
      };
      if (saved.userId !== me.id) return;
      setSellingCategory(normalizeSellingCategory(saved.sellingCategory));
      if (typeof saved.storeDescription === "string")
        setDescription(saved.storeDescription.slice(0, 1000));
      if (
        typeof saved.brandColor === "string" &&
        /^#[0-9a-f]{6}$/i.test(saved.brandColor)
      )
        setBrandColor(saved.brandColor);
      setProductsPerRow(
        saved.productLayout === "compact"
          ? 4
          : saved.productLayout === "large"
            ? 2
            : 3,
      );
      if (saved.storeName) setName(String(saved.storeName).slice(0, 60));
      if (saved.storeSlug) {
        setSlugTouched(true);
        setSlug(slugify(String(saved.storeSlug)));
      }
    } catch {
      // Nothing usable stored; the seller just types it here.
    }
  }, [me?.id, me?.role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // The shop name is required: no default name is ever filled in for you.
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (cleanName.length < 3) {
      setError("Shop name is required (at least 3 characters).");
      return;
    }

    const cleanSlug = slugify(slug.trim() || name.trim());
    if (cleanSlug.length < 3) {
      setError("Store address must be at least 3 characters.");
      return;
    }

    if (!normalizeSellingCategory(sellingCategory)) {
      setError("Choose the kind of products you plan to sell.");
      return;
    }

    setSaving(true);
    try {
      const design = {
        ...defaultDesign,
        sellingCategory: normalizeSellingCategory(sellingCategory),
        description,
        primaryColor: brandColor,
        productsPerRow,
        storeName: cleanName,
        storeSlug: cleanSlug,
      };
      await saveDraft(design);
      created.current = true;
      try {
        window.sessionStorage.removeItem(ONBOARDING_STORE_KEY);
      } catch {
        /* Storage may be blocked. */
      }
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
      // A paid pack picked earlier: go pay for it now that the store exists.
      // Free (or nothing picked): straight to the store designer.
      const intent = readPlanIntent();
      clearPlanIntent();
      router.replace(
        intent && intent.plan !== "free"
          ? subscriptionUrl(cleanSlug, intent)
          : `/seller/${cleanSlug}/store-design`,
      );
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Set up your store
            </h1>
            <p className="text-xs text-muted-foreground">
              One-time step. Your shop name can be changed only once later, and
              then it is locked for 30 days.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Store name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Luna Boutique"
              required
              maxLength={60}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Store address</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">/seller/</span>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="luna-boutique"
                maxLength={40}
                className="h-11 flex-1 font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Storefront: /store/{slug || "your-store"} · Dashboard: /seller/
              {slug || "your-store"}/dashboard
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="selling-category" className="text-sm font-medium">
              What will you sell?
            </label>
            <select
              id="selling-category"
              required
              value={sellingCategory}
              onChange={(e) => setSellingCategory(e.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Choose a product category
              </option>
              {sellingCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-muted-foreground">
              We’ll highlight suitable templates in your store designer. You can
              change this later.
            </p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            type="submit"
            variant="accent"
            disabled={saving || slug.length < 3 || name.trim().length < 3}
            className="h-11 w-full rounded-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Create my store"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
