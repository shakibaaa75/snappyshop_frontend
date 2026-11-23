"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  Lock,
  Minus,
  Plus,
  Trash2,
  Smartphone,
  Truck,
} from "lucide-react";
import { publicOrders } from "@/lib/api/orders";
import { Button } from "@/components/ui/button";
import { useCheckoutValidation } from "@/components/checkout/field-validation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { getApiErrorMessage } from "@/lib/api/form-errors";
import { fetchPublicStore } from "@/lib/store-design/api";
import { lineKey, useCart } from "@/lib/store-design/cart";
import { isBlocked, liveFor } from "@/lib/cart/live";
import { DISTRICT_GROUPS } from "@/lib/geo/districts";
import { useCheckoutDelivery } from "@/lib/delivery/use-delivery";
import {
  formatPrice,
  loadFont,
  readableOn,
  themeVars,
} from "@/lib/store-design/utilts";
import { ProductArt } from "@/components/store-design/productArt";
import { pixelTrack } from "@/lib/meta-pixel";
import type { Product, StoreDesign } from "@/lib/store-design/types";

type PaymentMethod = "bkash" | "nagad" | "rocket" | "cod" | "card";

const PAYMENTS: {
  id: PaymentMethod;
  label: string;
  hint: string;
  Icon: typeof Banknote;
  color: string;
}[] = [
  {
    id: "bkash",
    label: "bKash",
    hint: "Pay from your bKash account",
    Icon: Smartphone,
    color: "#e2136e",
  },
  {
    id: "nagad",
    label: "Nagad",
    hint: "Pay from your Nagad account",
    Icon: Smartphone,
    color: "#f6921e",
  },
  {
    id: "rocket",
    label: "Rocket",
    hint: "Pay from your Rocket account",
    Icon: Smartphone,
    color: "#8c3494",
  },
  {
    id: "cod",
    label: "Cash on delivery",
    hint: "Pay the courier when your order arrives",
    Icon: Banknote,
    color: "#16a34a",
  },
  {
    id: "card",
    label: "Card",
    hint: "Visa, Mastercard, AmEx",
    Icon: CreditCard,
    color: "#2563eb",
  },
];

function QtyStepper({
  qty,
  max,
  disabled,
  onChange,
  onRemove,
}: {
  qty: number;
  max: number;
  disabled?: boolean;
  onChange: (q: number) => void;
  onRemove: () => void;
}) {
  const btn =
    "sf-press flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-40";
  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || qty <= 1}
        onClick={() => onChange(qty - 1)}
        className={btn}
        style={{ background: "var(--s-bg)" }}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span
        key={qty}
        className="sf-pop min-w-6 text-center text-xs font-semibold tabular-nums"
        aria-live="polite"
      >
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || qty >= max}
        onClick={() => onChange(qty + 1)}
        className={btn}
        style={{ background: "var(--s-bg)" }}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Remove item"
        disabled={disabled}
        onClick={onRemove}
        className={`${btn} ml-1`}
        style={{ color: "var(--s-muted)" }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

const DISTRICTS = new Set(DISTRICT_GROUPS.flatMap((g) => g.districts));

/** Other spellings people type; they find the official name above. */
const DISTRICT_ALIASES: Record<string, string[]> = {
  Chattogram: ["chittagong", "ctg"],
  Comilla: ["cumilla"],
  Jashore: ["jessore"],
  Bogura: ["bogra"],
  Barisal: ["barishal"],
  "Cox's Bazar": ["coxs bazar", "coxsbazar", "cox bazar"],
  Moulvibazar: ["maulvibazar", "moulvi bazar"],
  Brahmanbaria: ["brahmanbaria", "b baria"],
  Chapainawabganj: ["nawabganj", "chapai nawabganj"],
  Jhalokati: ["jhalakathi", "jhalokathi"],
  Khagrachhari: ["khagrachari"],
  Narsingdi: ["narsinghdi"],
  Netrokona: ["netrakona"],
};

const DISTRICT_OPTIONS = DISTRICT_GROUPS.flatMap((g) =>
  g.districts.map((name) => ({
    name,
    division: g.division,
    search: [name, ...(DISTRICT_ALIASES[name] ?? [])].map((x) =>
      x.toLowerCase(),
    ),
  })),
).sort((a, b) => a.name.localeCompare(b.name));

/* ------------------------------------------------------------------ */
/* Thana / upazila / area suggestions                                  */
/* ------------------------------------------------------------------ */

const norm = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");

type Opt = { name: string; hint?: string; search: string[] };
const toOpt = (name: string, hint?: string): Opt => ({
  name,
  hint,
  search: [name.toLowerCase()],
});

const DISTRICT_COMBO: Opt[] = DISTRICT_OPTIONS.map((o) => ({
  name: o.name,
  hint: o.division,
  search: o.search,
}));

/** Options matching what was typed: names that start with it come first. */
function matchOptions(opts: Opt[], query: string): Opt[] {
  const q = query.trim().toLowerCase();
  if (!q) return opts;
  const starts = opts.filter((o) => o.search.some((t) => t.startsWith(q)));
  const rest = opts.filter(
    (o) => !starts.includes(o) && o.search.some((t) => t.includes(q)),
  );
  return [...starts, ...rest];
}

/* --- nuhil/bangladesh-geocode (MIT): district -> upazila -> union ------ */

/**
 * Where the dataset is served from. jsDelivr is a real CDN for GitHub files;
 * raw.githubusercontent.com is the fallback. To pin an exact version, replace
 * "@master" with a commit hash. To self-host, point this at your own domain.
 */
const GEO_BASES = [
  "https://cdn.jsdelivr.net/gh/nuhil/bangladesh-geocode@master",
  "https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master",
];
const GEO_FILES = {
  districts: "districts/districts.json",
  upazilas: "upazilas/upazilas.json",
  unions: "unions/unions.json",
} as const;

/** Other spellings of our district names, so they match the dataset's. */
const API_NAME_ALTS: Record<string, string[]> = {
  Chattogram: ["chittagong"],
  Comilla: ["cumilla"],
  Jashore: ["jessore"],
  Bogura: ["bogra"],
  Barisal: ["barishal"],
  "Cox's Bazar": ["coxbazar"],
  Moulvibazar: ["maulvibazar"],
  Jhalokati: ["jhalakathi", "jhalakati", "jhalokathi"],
  Khagrachhari: ["khagrachari"],
  Chapainawabganj: ["nawabganj"],
  Narsingdi: ["narsinghdi"],
  Netrokona: ["netrakona"],
  Lakshmipur: ["laxmipur"],
  Joypurhat: ["jaipurhat"],
  Sirajganj: ["serajganj"],
  Jhenaidah: ["jhenidah"],
  Brahmanbaria: ["brahamanbaria"],
  Lalmonirhat: ["lalmanirhat"],
};

type GeoRow = Record<string, unknown>;

/** The files are phpMyAdmin exports ([header, db, {type:"table", data}]),
 *  but a plain array or {data:[]} works too. */
function unwrapRows(json: unknown): GeoRow[] {
  if (Array.isArray(json)) {
    const table = json.find(
      (x) =>
        x &&
        typeof x === "object" &&
        (x as GeoRow).type === "table" &&
        Array.isArray((x as GeoRow).data),
    ) as GeoRow | undefined;
    return (table ? (table.data as GeoRow[]) : (json as GeoRow[])).filter(
      (x) => x && typeof x === "object" && "name" in x,
    );
  }
  const d = (json as GeoRow | null)?.data;
  return Array.isArray(d) ? (d as GeoRow[]) : [];
}

async function fetchRows(file: string): Promise<GeoRow[]> {
  for (const base of GEO_BASES) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(`${base}/${file}`, { signal: ctrl.signal });
      if (!res.ok) continue;
      const rows = unwrapRows(await res.json());
      if (rows.length) return rows;
    } catch {
      /* try the next host */
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`Could not load ${file}`);
}

/* The union file is large, so keep a compact copy in the browser for 30 days. */
const GEO_CACHE = "shopbd-geo:v1:";
const GEO_TTL = 30 * 24 * 60 * 60 * 1000;
function readGeoCache<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(GEO_CACHE + key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw) as { t: number; v: T };
    return Date.now() - t < GEO_TTL ? v : null;
  } catch {
    return null;
  }
}
function writeGeoCache(key: string, v: unknown) {
  try {
    window.localStorage.setItem(
      GEO_CACHE + key,
      JSON.stringify({ t: Date.now(), v }),
    );
  } catch {
    /* storage full or blocked: just skip caching */
  }
}

type GeoUpazila = { id: string; districtId: string; name: string };
type Geo = {
  districts: { id: string; name: string }[];
  upazilas: GeoUpazila[];
};

let geoPromise: Promise<Geo> | null = null;
function loadGeo(): Promise<Geo> {
  if (!geoPromise) {
    geoPromise = (async () => {
      const cached = readGeoCache<Geo>("geo");
      if (cached) return cached;
      const [d, u] = await Promise.all([
        fetchRows(GEO_FILES.districts),
        fetchRows(GEO_FILES.upazilas),
      ]);
      const geo: Geo = {
        districts: d.map((r) => ({ id: String(r.id), name: String(r.name) })),
        upazilas: u.map((r) => ({
          id: String(r.id),
          districtId: String(r.district_id),
          name: String(r.name),
        })),
      };
      writeGeoCache("geo", geo);
      return geo;
    })();
    geoPromise.catch(() => {
      geoPromise = null; // allow a retry on the next attempt
    });
  }
  return geoPromise;
}

/** upazila id -> union names */
type UnionMap = Record<string, string[]>;
let unionPromise: Promise<UnionMap> | null = null;
function loadUnions(): Promise<UnionMap> {
  if (!unionPromise) {
    unionPromise = (async () => {
      const cached = readGeoCache<UnionMap>("unions");
      if (cached) return cached;
      const rows = await fetchRows(GEO_FILES.unions);
      const map: UnionMap = {};
      for (const r of rows) {
        // the dataset spells this column "upazilla_id" (double l)
        const key = String(r.upazilla_id ?? r.upazila_id ?? "");
        if (!key) continue;
        (map[key] ??= []).push(String(r.name));
      }
      writeGeoCache("unions", map);
      return map;
    })();
    unionPromise.catch(() => {
      unionPromise = null;
    });
  }
  return unionPromise;
}

/** Upazilas of a district. Fails quietly to an empty list. */
function useThanas(district: string) {
  const [state, setState] = useState<{ list: GeoUpazila[]; loading: boolean }>({
    list: [],
    loading: false,
  });
  useEffect(() => {
    if (!district) {
      setState({ list: [], loading: false });
      return;
    }
    let alive = true;
    setState({ list: [], loading: true });
    loadGeo()
      .then((geo) => {
        const keys = [norm(district), ...(API_NAME_ALTS[district] ?? [])];
        const d =
          geo.districts.find((x) => keys.includes(norm(x.name))) ??
          geo.districts.find((x) =>
            keys.some(
              (k) => k.length >= 5 && norm(x.name).startsWith(k.slice(0, 5)),
            ),
          );
        const list = d ? geo.upazilas.filter((u) => u.districtId === d.id) : [];
        if (alive) setState({ list, loading: false });
      })
      .catch(() => alive && setState({ list: [], loading: false }));
    return () => {
      alive = false;
    };
  }, [district]);
  return state;
}

/** Unions of one upazila. Loaded only once a real upazila is chosen. */
function useUnions(upazilaId: string) {
  const [state, setState] = useState<{ list: string[]; loading: boolean }>({
    list: [],
    loading: false,
  });
  useEffect(() => {
    if (!upazilaId) {
      setState({ list: [], loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    loadUnions()
      .then((map) => {
        if (alive) setState({ list: map[upazilaId] ?? [], loading: false });
      })
      .catch(() => alive && setState({ list: [], loading: false }));
    return () => {
      alive = false;
    };
  }, [upazilaId]);
  return state;
}

/**
 * City thanas the dataset does not list (it only has upazilas). Starter data:
 * extend or replace it with a fuller dataset when you have one.
 */
const EXTRA_THANAS: Record<string, string[]> = {
  Dhaka: [
    "Adabor",
    "Badda",
    "Banani",
    "Bangshal",
    "Cantonment",
    "Chawkbazar",
    "Dakshinkhan",
    "Darus Salam",
    "Demra",
    "Dhanmondi",
    "Gendaria",
    "Gulshan",
    "Hatirjheel",
    "Hazaribagh",
    "Jatrabari",
    "Kadamtali",
    "Kafrul",
    "Kalabagan",
    "Kamrangirchar",
    "Khilgaon",
    "Khilkhet",
    "Kotwali",
    "Lalbagh",
    "Mirpur",
    "Mohammadpur",
    "Motijheel",
    "Mugda",
    "New Market",
    "Pallabi",
    "Paltan",
    "Ramna",
    "Rampura",
    "Sabujbagh",
    "Shah Ali",
    "Shahbagh",
    "Sher-e-Bangla Nagar",
    "Shyampur",
    "Sutrapur",
    "Tejgaon",
    "Turag",
    "Uttara East",
    "Uttara West",
    "Uttarkhan",
    "Vatara",
    "Wari",
  ],
  Chattogram: [
    "Akbar Shah",
    "Bakalia",
    "Bandar",
    "Bayazid Bostami",
    "Chandgaon",
    "Chawkbazar",
    "Double Mooring",
    "EPZ",
    "Halishahar",
    "Khulshi",
    "Kotwali",
    "Pahartali",
    "Panchlaish",
    "Patenga",
    "Sadarghat",
  ],
};

/**
 * Local areas per thana, keyed "district|thana" (letters only, lowercase).
 * Starter examples only; the dataset has no city-area data. Typing any other
 * area is always allowed.
 */
const AREAS_BY_THANA: Record<string, string[]> = {
  "dhaka|dhanmondi": [
    "Dhanmondi R/A",
    "Jigatola",
    "Science Laboratory",
    "Satmasjid Road",
  ],
  "dhaka|gulshan": ["Gulshan 1", "Gulshan 2", "Niketan"],
  "dhaka|motijheel": ["Motijheel C/A", "Arambagh"],
  "dhaka|tejgaon": ["Farmgate", "Karwan Bazar", "Tejkunipara", "Nakhalpara"],
  "dhaka|badda": ["Merul Badda", "Uttar Badda", "Satarkul"],
  "dhaka|mohammadpur": [
    "Town Hall",
    "Tajmahal Road",
    "Nurjahan Road",
    "Katasur",
  ],
};

/**
 * Type-ahead field. `strict` = the value can only be one of the options
 * (districts). Otherwise suggestions help but any text is accepted
 * (thana and area), because no list covers every locality.
 */
function Combobox({
  id,
  "aria-invalid": invalid,
  "aria-describedby": description,
  value,
  onChange,
  options,
  strict = false,
  placeholder,
  disabled,
  loading,
  emptyText,
  className,
  style,
}: {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  strict?: boolean;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyText?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Follow outside changes (e.g. cleared when the district changes). In
  // strict mode an empty value just means "not picked yet": keep the typing.
  useEffect(() => {
    if (!strict || value) setQuery(value);
  }, [value, strict]);

  const matches = matchOptions(options, query);
  const typedButNotPicked = strict && query.trim() !== "" && !value;
  const showList =
    open && !disabled && (strict || loading || matches.length > 0);

  const pick = (name: string) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  useEffect(() => {
    if (!showList) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-i="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, showList]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      // Enter picks a suggestion instead of submitting the whole form.
      if (showList && matches[active]) {
        e.preventDefault();
        pick(matches[active].name);
      } else if (strict && open) {
        e.preventDefault();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const onBlur = () => {
    setOpen(false);
    if (!strict) return;
    if (value) {
      setQuery(value); // undo half-edits of a chosen district
      return;
    }
    // Typed a full name (or a known spelling) without clicking: accept it.
    const exact = matchOptions(options, query).find((o) =>
      o.search.includes(query.trim().toLowerCase()),
    );
    if (exact) pick(exact.name);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && matches[active] ? `${uid}-opt-${active}` : undefined
        }
        id={id}
        aria-describedby={description}
        aria-invalid={invalid || typedButNotPicked || undefined}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setActive(0);
          setOpen(true);
          if (strict) {
            // Editing drops the previous choice until a new pick.
            if (value) onChange("");
          } else {
            onChange(v);
          }
        }}
        className={cn(className, "pr-11")}
        style={style}
      />
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform duration-200",
          showList && "rotate-180",
          disabled && "opacity-40",
        )}
        style={{ color: "var(--s-muted)" }}
      />

      {showList && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="sf-fade-in absolute left-0 right-0 top-full z-30 mt-2 max-h-60 min-w-[15rem] overflow-y-auto rounded-2xl p-1.5 shadow-xl"
          style={{
            background: "var(--s-bg)",
            border: "1px solid var(--s-border)",
          }}
        >
          {loading && matches.length === 0 ? (
            <li
              className="flex items-center gap-2 px-3 py-3 text-sm"
              style={{ color: "var(--s-muted)" }}
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </li>
          ) : matches.length === 0 ? (
            <li
              className="px-3 py-3 text-sm"
              style={{ color: "var(--s-muted)" }}
            >
              {emptyText ?? "No matches."}
            </li>
          ) : (
            matches.map((o, i) => (
              <li
                key={o.name}
                id={`${uid}-opt-${i}`}
                data-i={i}
                role="option"
                aria-selected={o.name === value}
                // mousedown (not click) so the input doesn't blur first
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o.name);
                }}
                onMouseEnter={() => setActive(i)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                style={{
                  background: i === active ? "var(--s-surface)" : "transparent",
                }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">{o.name}</span>
                  {o.hint && (
                    <span
                      className="shrink-0 text-xs"
                      style={{ color: "var(--s-muted)" }}
                    >
                      {o.hint}
                    </span>
                  )}
                </span>
                {o.name === value && <Check className="h-4 w-4 shrink-0" />}
              </li>
            ))
          )}
        </ul>
      )}

      {typedButNotPicked && !open && (
        <p className="mt-1.5 px-1 text-xs" style={{ color: "#dc2626" }}>
          Please pick from the suggestions.
        </p>
      )}
    </div>
  );
}

/** Shared with the public marketplace checkout: the exact storefront geocode loader,
 * district aliases, city thanas, curated areas and union data. */
export function useStorefrontLocationSuggestions(city: string, thana: string) {
  const geoThanas = useThanas(city);
  const thanaOptions = useMemo(() => {
    const extra = (EXTRA_THANAS[city] ?? []).map((n) => toOpt(n, "Thana"));
    const seen = new Set(extra.map((o) => norm(o.name)));
    const upazilas = geoThanas.list
      .filter((u) => !seen.has(norm(u.name)))
      .map((u) => toOpt(u.name, "Upazila"));
    return [...extra, ...upazilas].sort((a, b) => a.name.localeCompare(b.name));
  }, [city, geoThanas.list]);
  const upazilaId = useMemo(
    () => geoThanas.list.find((u) => norm(u.name) === norm(thana))?.id ?? "",
    [geoThanas.list, thana],
  );
  const unions = useUnions(upazilaId);
  const areaOptions = useMemo(() => {
    const curated = AREAS_BY_THANA[`${norm(city)}|${norm(thana)}`] ?? [];
    return [...new Set([...curated, ...unions.list])]
      .sort((a, b) => a.localeCompare(b))
      .map((n) => toOpt(n));
  }, [city, thana, unions.list]);
  return {
    thanas: thanaOptions.map((o) => o.name),
    areas: areaOptions.map((o) => o.name),
    loading: geoThanas.loading || unions.loading,
  };
}

const inputCls =
  "h-12 rounded-full border-0 px-5 shadow-none focus-visible:ring-2";

export default function CheckoutClient() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const cart = useCart();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: () => fetchPublicStore(slug),
    retry: (count, err) =>
      err instanceof ApiError && err.status === 404 ? false : count < 2,
    staleTime: 30_000,
  });

  const design = data?.design as StoreDesign | undefined;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [thana, setThana] = useState("");
  const [area, setArea] = useState("");

  // District -> thana/upazila -> union/area, all narrowed by the step before.
  const geoThanas = useThanas(city);
  const thanaOptions = useMemo<Opt[]>(() => {
    const extra = (EXTRA_THANAS[city] ?? []).map((n) => toOpt(n, "Thana"));
    const seen = new Set(extra.map((o) => norm(o.name)));
    const upazilas = geoThanas.list
      .filter((u) => !seen.has(norm(u.name)))
      .map((u) => toOpt(u.name, "Upazila"));
    return [...extra, ...upazilas].sort((a, b) => a.name.localeCompare(b.name));
  }, [city, geoThanas.list]);
  // Unions are only known for real upazilas (not for city thanas).
  const upazilaId = useMemo(
    () => geoThanas.list.find((u) => norm(u.name) === norm(thana))?.id ?? "",
    [geoThanas.list, thana],
  );
  const unions = useUnions(upazilaId);
  const areaOptions = useMemo<Opt[]>(() => {
    const curated = AREAS_BY_THANA[`${norm(city)}|${norm(thana)}`] ?? [];
    return [...new Set([...curated, ...unions.list])]
      .sort((a, b) => a.localeCompare(b))
      .map((n) => toOpt(n));
  }, [city, thana, unions.list]);
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("bkash");
  const [submitting, setSubmitting] = useState(false);
  const validation = useCheckoutValidation({
    name,
    phone,
    address,
    thana,
    validDistrict: DISTRICTS.has(city),
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Meta Pixel: fire InitiateCheckout exactly once per checkout session.
  // Must live above the early returns below (rules of hooks).
  const startedCheckout = useRef(false);
  useEffect(() => {
    if (startedCheckout.current || !cart.ready || cart.lines.length === 0)
      return;
    startedCheckout.current = true;
    pixelTrack("InitiateCheckout", {
      content_ids: cart.lines.map((l) => l.productId),
      content_type: "product",
      num_items: cart.count,
      value: cart.subtotal,
      currency: "BDT",
    });
  }, [cart.ready, cart.lines, cart.count, cart.subtotal]);

  // Live delivery price for the chosen district. Must stay above the early
  // returns below (rules of hooks).
  const quote = useCheckoutDelivery(slug, city, cart.lines, cart.subtotal);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground"
        role="status"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading checkout…
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Store unavailable</h1>
        <Button variant="outline" onClick={() => router.push(`/store/${slug}`)}>
          Back to store
        </Button>
      </div>
    );
  }

  loadFont(design.fontFamily);
  const accent = design.productAccentColor || "var(--s-text)";
  const accentOn = accent.startsWith("#") ? readableOn(accent) : "var(--s-bg)";
  const storeHref = `/store/${slug}`;

  if (cart.lines.length === 0) {
    return (
      <div style={themeVars(design)} className="storefront">
        <div
          className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
          style={{ background: "var(--s-bg)", color: "var(--s-text)" }}
        >
          <h1 className="text-xl font-semibold">Your cart is empty</h1>
          <p className="text-sm" style={{ color: "var(--s-muted)" }}>
            Add items to your cart before checking out.
          </p>
          <Link
            href={storeHref}
            className="flex h-12 items-center justify-center rounded-full px-8 text-sm font-semibold"
            style={{ background: accent, color: accentOn }}
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const { delivery, discount, total } = quote;

  // A variant the seller deleted or sold out since it was added to the cart.
  const blockedLine = cart.lines.find((l) =>
    isBlocked(liveFor(data, l), l.qty),
  );

  /** Changing the district clears the thana and area that depended on it. */
  const changeCity = (d: string) => {
    if (d === city) return;
    setCity(d);
    setThana("");
    setArea("");
  };

  /** Most the buyer can order of one line (variant stock; -1 = unlimited). */
  const maxFor = (line: (typeof cart.lines)[number]) => {
    const live = liveFor(data, line);
    return live && live.stock > 0 ? live.stock : Infinity;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (blockedLine) {
      setFormError(
        `${blockedLine.name}${
          blockedLine.variantLabel ? ` (${blockedLine.variantLabel})` : ""
        } is no longer available in that quantity. Please update your cart.`,
      );
      return;
    }

    if (!validation.validate(e.currentTarget)) return;
    // The order has one "area" field, so thana travels with it: "Area, Thana".
    const areaFull = [area.trim(), thana.trim()].filter(Boolean).join(", ");

    setSubmitting(true);

    try {
      const order = await publicOrders.create(slug, {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        shippingAddress: address.trim(),
        shippingCity: city.trim(),
        shippingArea: areaFull,
        notes: notes.trim(),
        paymentMethod: payment,
        lines: cart.lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          // Without this the seller would get the wrong size/colour.
          ...(l.variantId ? { variantId: l.variantId } : {}),
        })),
      });

      try {
        window.sessionStorage.setItem(
          `shopbd-last-order:${slug}`,
          JSON.stringify({
            id: order.id,
            number: order.number,
            slug,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim(),
            city: city.trim(),
            area: areaFull,
            notes: notes.trim(),
            payment,
            // What the server charged, not the on-screen estimate.
            delivery: order.delivery,
            discount: order.discount ?? 0,
            deliveryZone: order.deliveryZone ?? "",
            deliveryBase: order.deliveryBase ?? 0,
            deliveryWaived: order.deliveryWaived ?? false,
            subtotal: order.subtotal,
            total: order.total,
            lines: cart.lines,
            createdAt: new Date().toISOString(),
          }),
        );
      } catch {
        /* ignore */
      }

      // Meta Pixel: Purchase. Fired only after the order is accepted by
      // the API. `order.id` is used as the event ID so a duplicate
      // submission or a server-side CAPI replay with the same ID is
      // deduplicated by Meta.
      pixelTrack(
        "Purchase",
        {
          content_ids: cart.lines.map((l) => l.productId),
          content_type: "product",
          num_items: cart.count,
          value: order.total,
          currency: "BDT",
        },
        order.id,
      );

      cart.clear();
      router.push(`/store/${slug}/order/${order.id}`);
    } catch (err) {
      setFormError(
        getApiErrorMessage(
          err,
          "Could not place your order. Please try again.",
        ),
      );
      setSubmitting(false);
    }
  };

  const panel = "rounded-[28px] p-5 sm:p-7";
  const panelStyle = { background: "var(--s-surface)" } as const;
  const fieldBg = { background: "var(--s-bg)" } as const;

  const submitBtn = (
    <button
      type="submit"
      disabled={submitting}
      className={cn(
        "sf-press flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold shadow-lg lg:shadow-none",
        submitting && "cursor-not-allowed opacity-70",
      )}
      style={{ background: accent, color: accentOn }}
    >
      {submitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Placing order…
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" />
          Place order · {formatPrice(total)}
        </>
      )}
    </button>
  );

  return (
    <div
      style={themeVars(design)}
      className="storefront text-[15px] leading-normal"
    >
      <div
        className="min-h-screen"
        style={{ background: "var(--s-bg)", color: "var(--s-text)" }}
      >
        <header
          className="sticky top-0 z-50 backdrop-blur"
          style={{
            background: "color-mix(in srgb, var(--s-bg) 90%, transparent)",
          }}
        >
          <div className="mx-auto grid h-16 w-full max-w-[1120px] grid-cols-[44px_1fr_44px] items-center gap-2 px-4 sm:px-6 lg:px-8">
            <Link
              href={`${storeHref}/cart`}
              aria-label="Back to cart"
              className="flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90"
              style={{ background: "var(--s-surface)" }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-center text-base font-bold tracking-tight">
              Checkout
            </h1>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: "var(--s-surface)" }}
              title="Secure checkout"
            >
              <Lock className="h-4 w-4" />
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1120px] px-4 pt-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
          <form
            onSubmit={handleSubmit}
            className="sf-fade-in grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10"
          >
            <aside
              className={cn(
                panel,
                "h-fit min-w-0 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24",
              )}
              style={panelStyle}
            >
              <h2 className="mb-5 text-base font-bold tracking-tight">
                Order summary
              </h2>

              <ul className="space-y-5">
                {cart.lines.map((line) => (
                  <li key={lineKey(line)} className="flex items-start gap-3">
                    <span
                      className="relative mt-1 h-16 w-16 shrink-0 rounded-[16px]"
                      style={{ background: "var(--s-bg)" }}
                    >
                      <span className="block h-full w-full overflow-hidden rounded-[16px]">
                        <ProductArt
                          product={
                            {
                              id: line.productId,
                              name: line.name,
                              categoryId: "",
                              price: line.price,
                              emoji: line.emoji,
                              hue: line.hue,
                              rating: 0,
                              reviews: 0,
                              sold: 0,
                              stock: 99,
                              createdAt: "",
                              imageUrl: line.imageUrl,
                            } as Product
                          }
                          emojiClassName="text-xl"
                        />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-sm font-medium leading-snug">
                        {line.name}
                      </span>
                      {line.variantLabel && (
                        <span
                          className="mt-0.5 block text-xs"
                          style={{ color: "var(--s-muted)" }}
                        >
                          {line.variantLabel}
                        </span>
                      )}
                      <span className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                        <QtyStepper
                          qty={line.qty}
                          max={maxFor(line)}
                          disabled={submitting}
                          onChange={(q) => cart.updateQty(lineKey(line), q)}
                          onRemove={() => cart.removeItem(lineKey(line))}
                        />
                        <span className="text-sm font-semibold">
                          {formatPrice(line.price * line.qty)}
                        </span>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <dl
                className="mt-4 space-y-2 border-t pt-4 text-sm"
                style={{ borderColor: "var(--s-border)" }}
              >
                <div className="flex justify-between">
                  <dt style={{ color: "var(--s-muted)" }}>Subtotal</dt>
                  <dd className="font-semibold">
                    {formatPrice(cart.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt style={{ color: "var(--s-muted)" }}>
                    Delivery
                    {quote.zone && (
                      <span className="ml-1 text-xs">
                        (
                        {quote.zone === "inside_dhaka"
                          ? "Inside Dhaka"
                          : "Outside Dhaka"}
                        )
                      </span>
                    )}
                  </dt>
                  <dd
                    className={cn(
                      "font-semibold",
                      quote.pending && "opacity-60",
                    )}
                  >
                    {!quote.hasDistrict ? (
                      <span
                        className="text-xs font-normal"
                        style={{ color: "var(--s-muted)" }}
                      >
                        Choose your district
                      </span>
                    ) : quote.waived ? (
                      <>
                        <s
                          className="mr-1.5 text-xs font-normal"
                          style={{ color: "var(--s-muted)" }}
                        >
                          {formatPrice(quote.base)}
                        </s>
                        Free
                      </>
                    ) : delivery === 0 ? (
                      "Free"
                    ) : (
                      formatPrice(delivery)
                    )}
                  </dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt style={{ color: "var(--s-muted)" }}>Discount</dt>
                    <dd className="font-semibold">−{formatPrice(discount)}</dd>
                  </div>
                )}
              </dl>

              <div
                className="mt-3 flex justify-between border-t pt-3 text-base"
                style={{ borderColor: "var(--s-border)" }}
              >
                <span className="font-semibold">Total</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>

              <div className="mt-5 hidden lg:block">{submitBtn}</div>

              <p
                className="mt-3 text-center text-[11px] leading-relaxed"
                style={{ color: "var(--s-muted)" }}
              >
                By placing this order you agree to the seller&apos;s terms.
              </p>
            </aside>
            <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
              <section className={panel} style={panelStyle}>
                <h2 className="mb-5 flex items-center gap-2 text-base font-bold tracking-tight">
                  <Truck className="h-4 w-4" /> Delivery details
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required>
                    <Input
                      {...validation.props("name")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sakib Hasan"
                      autoComplete="name"
                      className={inputCls}
                      style={fieldBg}
                    />
                    {validation.message("name")}
                  </Field>

                  <Field label="Phone" required>
                    <Input
                      {...validation.props("phone")}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      inputMode="tel"
                      autoComplete="tel"
                      className={inputCls}
                      style={fieldBg}
                    />
                    {validation.message("phone")}
                  </Field>

                  <Field label="Email (optional)" className="sm:col-span-2">
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                      className={inputCls}
                      style={fieldBg}
                    />
                  </Field>

                  {/* District and thana sit side by side (stacked on very narrow phones) */}
                  <div className="grid gap-4 min-[460px]:grid-cols-2 sm:col-span-2">
                    <Field label="City / District" required>
                      <Combobox
                        strict
                        {...validation.props("city")}
                        value={city}
                        onChange={changeCity}
                        options={DISTRICT_COMBO}
                        placeholder="Search district"
                        emptyText="No matching district. We deliver to 64 districts only."
                        className={inputCls}
                        style={fieldBg}
                      />
                      {validation.message("city")}
                    </Field>

                    <Field label="Thana / Upazila" required>
                      <Combobox
                        {...validation.props("thana")}
                        value={thana}
                        onChange={setThana}
                        options={thanaOptions}
                        loading={geoThanas.loading}
                        disabled={!city}
                        placeholder={
                          city
                            ? "Type your thana / upazila"
                            : "Select district first"
                        }
                        className={inputCls}
                        style={fieldBg}
                      />
                      {validation.message("thana")}
                    </Field>
                  </div>

                  <Field label="Area / Union" className="sm:col-span-2">
                    <Combobox
                      value={area}
                      onChange={setArea}
                      options={areaOptions}
                      loading={unions.loading}
                      disabled={!thana.trim()}
                      placeholder={
                        thana.trim()
                          ? "Type your area or union (optional)"
                          : "Enter thana first"
                      }
                      className={inputCls}
                      style={fieldBg}
                    />
                  </Field>

                  <Field
                    label="House name / Road / Block"
                    required
                    className="sm:col-span-2"
                  >
                    <Input
                      {...validation.props("address")}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House 12, Road 5, Block B"
                      autoComplete="street-address"
                      className={inputCls}
                      style={fieldBg}
                    />
                    {validation.message("address")}
                  </Field>

                  <Field
                    label="Delivery notes (optional)"
                    className="sm:col-span-2"
                  >
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ring the bell twice"
                      className={inputCls}
                      style={fieldBg}
                    />
                  </Field>
                </div>
              </section>

              <section className={panel} style={panelStyle}>
                <h2 className="mb-1 flex items-center gap-2 text-base font-bold tracking-tight">
                  <Banknote className="h-4 w-4" /> Payment method
                </h2>
                <p className="mb-4 text-xs" style={{ color: "var(--s-muted)" }}>
                  Choose how you&apos;d like to pay.
                </p>

                <div className="space-y-2.5">
                  {PAYMENTS.map((p) => {
                    const selected = payment === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setPayment(p.id)}
                        className="flex w-full items-center gap-3 rounded-[22px] p-3 text-left transition active:scale-[0.99]"
                        style={{
                          background: "var(--s-bg)",
                          boxShadow: selected
                            ? `0 0 0 2px ${p.color}`
                            : "0 0 0 1px var(--s-border)",
                        }}
                      >
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                          style={{ background: p.color, color: "#fff" }}
                        >
                          <p.Icon className="h-5 w-5" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">
                            {p.label}
                          </span>
                          <span
                            className="block truncate text-xs"
                            style={{ color: "var(--s-muted)" }}
                          >
                            {p.hint}
                          </span>
                        </span>

                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: selected ? p.color : "transparent",
                            border: selected
                              ? "none"
                              : "1.5px solid var(--s-border)",
                          }}
                        >
                          {selected && (
                            <Check className="h-3.5 w-3.5 text-white" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {(payment === "bkash" ||
                  payment === "nagad" ||
                  payment === "rocket") && (
                  <Note>
                    You&apos;ll receive a payment request on{" "}
                    <strong>{phone || "your phone"}</strong> after placing the
                    order. Approve it with your PIN to confirm.
                  </Note>
                )}
                {payment === "cod" && (
                  <Note>
                    Please have the exact amount ready when the courier arrives.
                    A small COD handling fee may apply.
                  </Note>
                )}
                {payment === "card" && (
                  <Note>
                    You&apos;ll enter your card details on the next screen.
                  </Note>
                )}
              </section>

              {formError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-[22px] p-4 text-sm font-medium"
                  style={{
                    background: "color-mix(in srgb, #dc2626 10%, var(--s-bg))",
                    color: "#dc2626",
                  }}
                >
                  {formError}
                </div>
              )}
            </div>

            {/* Mobile sticky submit */}
            <div
              className="fixed inset-x-0 bottom-0 z-40 px-4 pt-8 sm:px-6 lg:hidden"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                backgroundImage:
                  "linear-gradient(to top, var(--s-bg) 55%, transparent)",
              }}
            >
              {submitBtn}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-4 rounded-[18px] p-3.5 text-xs leading-relaxed"
      style={{ background: "var(--s-bg)", color: "var(--s-text)" }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block min-w-0 space-y-2", className)}>
      <span className="block px-1 text-xs font-semibold">
        {label}
        {required && (
          <span className="ml-0.5" style={{ color: "#dc2626" }}>
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
