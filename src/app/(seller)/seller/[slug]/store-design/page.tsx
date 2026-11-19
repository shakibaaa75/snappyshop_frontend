"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Check,
  ExternalLink,
  Eye,
  Home,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Monitor,
  Menu,
  Navigation,
  Package,
  Paintbrush,
  Redo2,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Store,
  Truck,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyTemplate,
  getTemplate,
  storeTemplates,
} from "@/lib/store-design/templates";
import { templateAllowed } from "@/lib/subscription";
import { useEntitlements } from "@/lib/query/entitlements";
import { cn } from "@/lib/utils";
import { fetchCategories, fetchProducts } from "@/lib/store-design/api";
import {
  useStoreDesign,
  type SaveStatus,
} from "@/lib/store-design/use-store-design";
import type { Category, Product } from "@/lib/store-design/types";
import { IconButton } from "@/components/store-design/controls";
import {
  LiveStorePreview,
  StorePreviewViewport,
  type PreviewDevice,
} from "@/components/store-design/Storepreview";
import {
  AboutPanel,
  ContactPanel,
  DeliveryPanel,
  HeaderPanel,
  HomepagePanel,
  IdentityPanel,
  ProductCardsPanel,
  ProductPagePanel,
  ProductsPanel,
  SectionArrangementPanel,
  SeoPanel,
  ShopOptionsPanel,
  ThemePanel,
  TrustPanel,
  type PanelProps,
} from "@/components/store-design/panels";

const TOPBAR = 60;
const SELLER_VERIFIED = true;

const NO_PRODUCTS: Product[] = [];
const NO_CATEGORIES: Category[] = [];

type TabId =
  | "identity"
  | "theme"
  | "productCards"
  | "homepage"
  | "arrange"
  | "products"
  | "productPage"
  | "header"
  | "shop"
  | "delivery"
  | "trust"
  | "about"
  | "contact"
  | "seo";

const tabs: {
  id: TabId;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "identity",
    label: "Identity",
    title: "Store identity",
    description: "Name, address, logo and cover",
    icon: Store,
  },
  {
    id: "theme",
    label: "Theme",
    title: "Theme and style",
    description: "Colors, font and shapes",
    icon: Paintbrush,
  },
  {
    id: "productCards",
    label: "Product Cards",
    title: "Product card designs",
    description: "Choose how products look in your store",
    icon: LayoutGrid,
  },
  {
    id: "homepage",
    label: "Homepage",
    title: "Homepage",
    description: "Choose, reorder and edit sections",
    icon: Home,
  },
  {
    id: "arrange",
    label: "Section arrangement",
    title: "Section arrangement",
    description: "Choose where each section goes",
    icon: ArrowUpDown,
  },
  {
    id: "products",
    label: "Products",
    title: "Product layout and details",
    description: "Grid size, image shape and card information",
    icon: LayoutGrid,
  },
  {
    id: "productPage",
    label: "Product page",
    title: "Product page",
    description: "How a product looks when shoppers open it",
    icon: Package,
  },
  {
    id: "header",
    label: "Header",
    title: "Header and footer",
    description: "Menu, announcement and footer",
    icon: Navigation,
  },
  {
    id: "shop",
    label: "Shop options",
    title: "Shop options",
    description: "Filters, payments, chat and pause",
    icon: SlidersHorizontal,
  },
  {
    id: "delivery",
    label: "Delivery",
    title: "Delivery settings",
    description: "Charges inside and outside Dhaka",
    icon: Truck,
  },
  {
    id: "trust",
    label: "Trust",
    title: "Trust and policies",
    description: "Badges and return policy",
    icon: ShieldCheck,
  },
  {
    id: "about",
    label: "About us",
    title: "About us page",
    description: "Layout, introduction, story and image",
    icon: Store,
  },
  {
    id: "contact",
    label: "Contact us",
    title: "Contact page and socials",
    description: "How shoppers reach you",
    icon: MessageCircle,
  },
  {
    id: "seo",
    label: "SEO",
    title: "Search and sharing",
    description: "Google and link previews",
    icon: Search,
  },
];

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return matches;
}

function StatusLabel({
  status,
  unpublished,
}: {
  status: SaveStatus;
  unpublished: boolean;
}) {
  if (status === "saving") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving
      </p>
    );
  }
  if (status === "error") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" /> Couldn&apos;t save. Check your
        storage and try again.
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          unpublished ? "bg-amber-500" : "bg-green-500",
        )}
      />
      {unpublished ? "Draft saved, not published" : "Published"}
    </p>
  );
}

function DeviceToggle({
  device,
  onChange,
}: {
  device: PreviewDevice;
  onChange: (d: PreviewDevice) => void;
}) {
  return (
    <div
      className="flex rounded-full bg-neutral-200/70 p-1"
      role="radiogroup"
      aria-label="Preview device"
    >
      {(
        [
          { id: "desktop", label: "Desktop preview", icon: Monitor },
          { id: "mobile", label: "Mobile preview", icon: Smartphone },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={device === id}
          aria-label={label}
          onClick={() => onChange(id)}
          className={cn(
            "flex h-8 w-9 items-center justify-center rounded-full transition",
            device === id
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

export default function StoreDesignPage() {
  const { slug: sellerSlug } = useParams<{ slug: string }>();
  const {
    design,
    update,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    publish,
    status,
    ready,
    hasUnpublished,
    canChangeSlug,
    slugLockMessage,
    renameShop,
    shopName,
  } = useStoreDesign();

  const [previewTemplate, setPreviewTemplate] =
    useState<PanelProps["previewTemplate"]>(null);
  const router = useRouter();
  const { entitlements, isLoading: planLoading } = useEntitlements();
  const canPublish =
    !planLoading &&
    !previewTemplate &&
    templateAllowed(entitlements, design.template);
  const upgradeUrl = `/seller/${sellerSlug}/subscription`;
  const publishDisabled =
    planLoading || status === "saving" || (canPublish && !hasUnpublished);
  const publishLabel = planLoading
    ? "Checking plan…"
    : !canPublish
      ? "Upgrade to publish"
      : hasUnpublished
        ? "Publish changes"
        : "Published";

  // Rename the shop, then move to the new address with a full page load. The
  // seller area returns 404 for any address that is not the seller's current
  // one, and a full load also drops every in-memory cache that still holds
  // the old name or address (so nothing keeps showing them).
  const onRenameShop = useCallback(
    async (name: string, slugOverride?: string) => {
      const { newSlug } = await renameShop(name, slugOverride);
      window.location.replace(`/seller/${newSlug}/store-design`);
    },
    [renameShop],
  );

  const [active, setActive] = useState<TabId>("identity");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isSm = useMediaQuery("(min-width: 640px)");

  const productsQuery = useQuery({
    queryKey: ["store-design", "products"],
    queryFn: () => fetchProducts(),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
  const categoriesQuery = useQuery({
    queryKey: ["store-design", "categories"],
    queryFn: () => fetchCategories(),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
  const products = productsQuery.data ?? NO_PRODUCTS;
  const categories = categoriesQuery.data ?? NO_CATEGORIES;
  const loading = productsQuery.isLoading || categoriesQuery.isLoading;

  const currentIndex = tabs.findIndex((t) => t.id === active);
  const current = tabs[currentIndex];
  const next = tabs[currentIndex + 1];
  const prev = tabs[currentIndex - 1];

  // Delivery charges save with their own button, not the draft autosave, so
  // the Delivery panel reports unsaved changes here and we ask before leaving.
  const deliveryDirty = useRef(false);
  const onDeliveryDirty = useCallback((dirty: boolean) => {
    deliveryDirty.current = dirty;
  }, []);

  const go = useCallback((id: TabId) => {
    if (
      deliveryDirty.current &&
      !window.confirm(
        "You have delivery changes that aren't saved. Leave without saving?",
      )
    ) {
      return;
    }
    setActive(id);
    // The middle column has its own scroll now — reset it, not the page.
    if (typeof window !== "undefined") {
      const scroller = document.getElementById("editor-scroll");
      if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const storeSlug = design.storeSlug || "my-store";
  const publishedUrl = `/store/${storeSlug}`;

  const previewMode: "storefront" | "product" | "about" | "contact" =
    active === "productPage"
      ? "product"
      : active === "about"
        ? "about"
        : active === "contact"
          ? "contact"
          : "storefront";

  useEffect(() => {
    document.getElementById(`pill-${active}`)?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [active]);

  const previewDialogRef = useRef<HTMLDivElement>(null);
  const closePreview = useCallback(() => {
    setPreviewOpen(false);
  }, []);
  const overlayOpen = previewOpen;
  useEffect(() => {
    if (!overlayOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = previewDialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], select:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
    focusable()[0]?.focus();
    const onDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreview();
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onDialogKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onDialogKey);
      trigger?.focus();
    };
  }, [overlayOpen, closePreview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (previewOpen) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT")
      )
        return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, previewOpen]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(t);
  }, [notice]);

  const handlePublish = useCallback(async () => {
    if (planLoading) return;
    if (!canPublish) {
      router.push(upgradeUrl);
      return;
    }
    const ok = await publish();
    setNotice(ok ? "Store design published" : "Couldn't publish. Try again.");
  }, [publish, planLoading, canPublish, router, upgradeUrl]);

  const handleReset = useCallback(() => {
    if (
      window.confirm(
        "Reset every customization back to the defaults? You can undo this.",
      )
    ) {
      reset();
    }
  }, [reset]);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your store
        editor
      </div>
    );
  }

  const panelProps: PanelProps = {
    design,
    previewTemplate,
    onPreviewTemplate: (id) => {
      setPreviewTemplate(id);
    },
    update,
    products,
    categories,
    verified: SELLER_VERIFIED,
    canChangeSlug,
    slugLockMessage,
    shop: { ...shopName, rename: onRenameShop },
    onDirtyChange: onDeliveryDirty,
  };
  // Resolve live imports during render rather than snapshotting component
  // exports in the module-level tab metadata (including during Fast Refresh).
  const ActivePanel = {
    identity: IdentityPanel,
    theme: ThemePanel,
    productCards: ProductCardsPanel,
    homepage: HomepagePanel,
    arrange: SectionArrangementPanel,
    products: ProductsPanel,
    productPage: ProductPagePanel,
    header: HeaderPanel,
    shop: ShopOptionsPanel,
    delivery: DeliveryPanel,
    trust: TrustPanel,
    about: AboutPanel,
    contact: ContactPanel,
    seo: SeoPanel,
  }[active];

  const previewProps = {
    design: previewTemplate ? applyTemplate(design, previewTemplate) : design,
    products,
    categories,
    verified: SELLER_VERIFIED,
    loading,
  };

  const templatePreviewNotice = previewTemplate ? (
    <div
      className="flex flex-wrap items-center gap-2 border-b bg-amber-50 px-4 py-3 text-xs text-amber-950"
      role="status"
    >
      <span className="flex-1">
        Previewing {getTemplate(previewTemplate)?.name}. Upgrade to publish this
        template. Your saved design is unchanged.
      </span>
      <Link href={upgradeUrl} className="font-semibold underline">
        Upgrade
      </Link>
      <button
        type="button"
        onClick={() => setPreviewTemplate(null)}
        className="font-semibold underline"
      >
        Exit preview
      </button>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-foreground">
      <header
        className="sticky top-0 z-40 bg-[#f2f2f2]/95 px-2 pt-1.5 backdrop-blur md:px-3"
        style={{ height: TOPBAR }}
      >
        <div className="flex h-[calc(100%-6px)] items-center justify-between gap-3 rounded-full bg-white px-3 shadow-sm md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("seller:open-menu"))
              }
              aria-label="Open seller navigation"
              data-seller-menu-trigger
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
              <Paintbrush className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight">
                Store editor
              </h1>
              <StatusLabel status={status} unpublished={hasUnpublished} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconButton label="Undo" onClick={undo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </IconButton>
            <IconButton label="Redo" onClick={redo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </IconButton>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 hidden h-9 sm:inline-flex"
              onClick={handleReset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-full bg-neutral-100 px-4 text-sm font-medium transition hover:bg-neutral-200 md:inline-flex"
            >
              <Eye className="h-4 w-4" />
              Live preview
            </button>
            <Button
              variant="accent"
              size="sm"
              className="ml-1 hidden h-9 rounded-full bg-emerald-700 px-5 hover:bg-emerald-800 xl:inline-flex"
              onClick={handlePublish}
              disabled={publishDisabled}
            >
              {publishLabel}
            </Button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Sections"
        className="sticky z-30 bg-[#f2f2f2]/95 backdrop-blur xl:hidden"
        style={{ top: TOPBAR }}
      >
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] md:px-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            const selected = active === t.id;
            return (
              <button
                key={t.id}
                id={`pill-${t.id}`}
                type="button"
                aria-current={selected ? "page" : undefined}
                onClick={() => go(t.id)}
                className={cn(
                  "flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
                  selected
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-transparent bg-white text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ============ THE FIX: outer grid fixed height + overflow-hidden ============ */}
      <div className="xl:grid xl:h-[calc(100dvh-60px)] xl:grid-cols-[220px_minmax(480px,600px)_minmax(0,1fr)] xl:overflow-hidden">
        <aside className="hidden p-3 pr-0 xl:block">
          <div
            className="sticky overflow-y-auto rounded-[26px] bg-white p-3 shadow-sm"
            style={{ top: TOPBAR, height: `calc(100dvh - ${TOPBAR}px - 24px)` }}
          >
            <nav aria-label="Sections" className="space-y-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const selected = active === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => go(t.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left transition",
                      selected
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selected && "text-white",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {t.label}
                      </span>
                      <span className="block truncate text-[11px] opacity-75">
                        {t.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
            <p className="mt-5 px-3 text-xs leading-5 text-muted-foreground">
              Changes save automatically as a draft. Publish when you&apos;re
              ready for shoppers to see them. Delivery charges are the
              exception: they save with their own button and apply right away.
            </p>
          </div>
        </aside>

        {/* ============ THE FIX: main is the scroll container ============ */}
        <main
          id="editor-scroll"
          className="min-w-0 px-4 pb-32 pt-5 md:px-6 xl:h-full xl:overflow-y-auto xl:overscroll-contain xl:pb-10"
        >
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              {current.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {current.description}
            </p>
          </div>

          <div key={active} className="animate-in fade-in duration-200">
            <ActivePanel {...panelProps} />
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t pt-5">
            {prev ? (
              <Button
                variant="ghost"
                className="h-11"
                onClick={() => go(prev.id)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {prev.label}
              </Button>
            ) : (
              <span />
            )}
            {next ? (
              <Button
                variant="outline"
                className="h-11"
                onClick={() => go(next.id)}
              >
                {next.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="accent"
                className="h-11 rounded-full bg-emerald-700 px-8 hover:bg-emerald-800"
                onClick={handlePublish}
                disabled={publishDisabled}
              >
                {publishLabel}
              </Button>
            )}
          </div>

          <div className="mt-4 sm:hidden">
            <Button
              variant="ghost"
              className="h-10 w-full text-muted-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset everything
            </Button>
          </div>
        </main>

        <aside className="hidden p-3 xl:block">
          <div
            className="sticky flex flex-col"
            style={{ top: TOPBAR, height: `calc(100dvh - ${TOPBAR}px)` }}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Eye className="h-4 w-4 text-accent" />
                {previewMode === "product"
                  ? "Product page preview"
                  : previewMode === "about"
                    ? "About page preview"
                    : previewMode === "contact"
                      ? "Contact page preview"
                      : "Live preview"}
              </div>
              <DeviceToggle device={device} onChange={setDevice} />
            </div>
            {templatePreviewNotice}
            <div className="min-h-0 flex-1 px-5 pb-5">
              <StorePreviewViewport
                {...previewProps}
                device={device}
                mode={previewMode}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 backdrop-blur xl:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-full"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Live preview
          </Button>
          {canPublish && (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border bg-background px-4 text-sm font-medium transition hover:bg-muted"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </a>
          )}
          <Button
            variant="accent"
            className="h-12 flex-1 rounded-full bg-emerald-700 hover:bg-emerald-800"
            onClick={handlePublish}
            disabled={publishDisabled}
          >
            {publishLabel}
          </Button>
        </div>
      </div>

      {overlayOpen && (
        <div
          ref={previewDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={previewTemplate ? "Template preview" : "Store preview"}
          className="fixed inset-0 z-[70] flex flex-col bg-[#eeeeec] animate-in fade-in duration-200"
        >
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-2 shadow-sm sm:gap-3 sm:px-4">
            <button
              type="button"
              onClick={closePreview}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to editor</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="min-w-0 flex-1 border-l border-neutral-200 pl-3 sm:pl-5">
              {previewTemplate ? (
                <select
                  aria-label="Preview template"
                  value={previewTemplate}
                  onChange={(event) =>
                    setPreviewTemplate(
                      event.target.value as NonNullable<
                        PanelProps["previewTemplate"]
                      >,
                    )
                  }
                  className="h-8 w-full max-w-48 rounded bg-white py-0 text-sm font-semibold text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
                >
                  {storeTemplates
                    .filter(
                      (template) =>
                        !templateAllowed(entitlements, template.id) ||
                        template.id === previewTemplate,
                    )
                    .map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                </select>
              ) : (
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {design.storeName}
                </p>
              )}
            </div>
            <div className="hidden sm:block">
              <DeviceToggle device={device} onChange={setDevice} />
            </div>
            {previewTemplate ? (
              <Link
                href={upgradeUrl}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white transition hover:bg-neutral-700"
              >
                Upgrade to use
              </Link>
            ) : (
              <Button
                variant="accent"
                className="h-8 shrink-0 rounded-lg px-3 text-xs"
                onClick={handlePublish}
                disabled={publishDisabled}
              >
                {publishLabel}
              </Button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden bg-neutral-100">
            {device === "mobile" || !isSm ? (
              <div className="h-full min-h-0 p-3 sm:p-5">
                <StorePreviewViewport
                  {...previewProps}
                  device="mobile"
                  chrome={true}
                  mode={previewTemplate ? "storefront" : previewMode}
                />
              </div>
            ) : previewTemplate || previewMode === "storefront" ? (
              <div className="h-full overflow-y-auto overscroll-contain bg-white">
                <LiveStorePreview
                  {...previewProps}
                  device="desktop"
                  interactive={false}
                />
              </div>
            ) : (
              <StorePreviewViewport
                {...previewProps}
                device="desktop"
                chrome={false}
                mode={previewMode}
              />
            )}
          </div>
          {previewTemplate && (
            <div className="flex shrink-0 items-center justify-center gap-2 border-t border-neutral-200 bg-white px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-center text-xs text-neutral-500">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Preview only. Upgrade to use and publish this template.
            </div>
          )}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="fixed left-1/2 top-[72px] z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg animate-in fade-in slide-in-from-top-2"
        >
          <Check className="h-4 w-4" />
          {notice}
        </div>
      )}
    </div>
  );
}
