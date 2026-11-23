"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type District = { id: string; name: string };
type Upazila = { id: string; district_id: string; name: string };
type Union = { upazilla_id?: string; upazila_id?: string; name: string };
type Geo = { districts: District[]; upazilas: Upazila[] };
const BASES = [
  "https://cdn.jsdelivr.net/gh/nuhil/bangladesh-geocode@master",
  "https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master",
];
const normalize = (s: unknown) =>
  typeof s === "string" ? s.toLowerCase().replace(/[^a-z]/g, "") : "";
let geoCache: Promise<Geo> | undefined;
let unionCache: Promise<Union[]> | undefined;
async function rows<T>(file: string): Promise<T[]> {
  for (const base of BASES) {
    try {
      const response = await fetch(`${base}/${file}`);
      if (!response.ok) continue;
      const json: unknown = await response.json();
      if (Array.isArray(json)) return json as T[];
    } catch {
      /* Try next CDN */
    }
  }
  throw new Error("Location suggestions unavailable");
}
function geo() {
  if (!geoCache)
    geoCache = Promise.all([
      rows<District>("districts/districts.json"),
      rows<Upazila>("upazilas/upazilas.json"),
    ])
      .then(([districts, upazilas]) => ({ districts, upazilas }))
      .catch((e) => {
        geoCache = undefined;
        throw e;
      });
  return geoCache;
}
function unions() {
  if (!unionCache)
    unionCache = rows<Union>("unions/unions.json").catch((e) => {
      unionCache = undefined;
      throw e;
    });
  return unionCache;
}
const aliases: Record<string, string[]> = {
  Chattogram: ["chittagong"],
  Comilla: ["cumilla"],
  Barishal: ["barisal"],
  Jashore: ["jessore"],
  CoxsBazar: ["coxbazar"],
};
export function usePublicLocation(district: string, thana: string) {
  const [data, setData] = useState<Geo | null>(null);
  const [allUnions, setAllUnions] = useState<Union[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!district) return;
    let alive = true;
    setLoading(true);
    geo()
      .then((v) => {
        if (alive) setData(v);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [district]);
  const districtId = useMemo(() => {
    const names = [
      normalize(district),
      ...(aliases[district] ?? []).map(normalize),
    ];
    return data?.districts.find(
      (d) => normalize(d?.name) && names.includes(normalize(d.name)),
    )?.id;
  }, [data, district]);
  const thanas = useMemo(
    () =>
      data?.upazilas.filter(
        (u) =>
          districtId != null &&
          String(u?.district_id ?? "") === String(districtId) &&
          typeof u?.name === "string",
      ) ?? [],
    [data, districtId],
  );
  const upazilaId = useMemo(
    () =>
      thanas.find(
        (u) => normalize(u?.name) && normalize(u.name) === normalize(thana),
      )?.id,
    [thanas, thana],
  );
  useEffect(() => {
    if (!upazilaId) return;
    let alive = true;
    unions()
      .then((v) => {
        if (alive) setAllUnions(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [upazilaId]);
  const areas = useMemo(
    () =>
      allUnions
        .filter(
          (u) =>
            String(u?.upazilla_id ?? u?.upazila_id ?? "") ===
              String(upazilaId) && typeof u?.name === "string",
        )
        .map((u) => u.name),
    [allUnions, upazilaId],
  );
  return { thanas: thanas.map((u) => u.name), areas, loading };
}
export function LocationInput({
  label,
  value,
  onChange,
  suggestions,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  suggestions: string[];
  disabled?: boolean;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [typing, setTyping] = useState(false);
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const choices = [
      ...new Set(
        suggestions.filter(
          (s): s is string => typeof s === "string" && !!s.trim(),
        ),
      ),
    ];
    return (
      typing && q ? choices.filter((s) => s.toLowerCase().includes(q)) : choices
    ).slice(0, 60);
  }, [suggestions, value, typing]);
  const choose = (item: string) => {
    onChange(item);
    setTyping(false);
    setOpen(false);
    setActive(0);
  };
  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <Input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && filtered.length > 0}
        onFocus={() => {
          setOpen(true);
          setTyping(false);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setTyping(true);
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "ArrowDown" && filtered.length) {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, filtered.length - 1));
          }
          if (e.key === "ArrowUp" && filtered.length) {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          }
          if (e.key === "Enter" && open && filtered.length) {
            e.preventDefault();
            choose(filtered[active] ?? filtered[0]);
          }
        }}
      />
      {open && !disabled && filtered.length > 0 && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {filtered.map((item, i) => (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(item)}
              className={`block w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-blue-50 ${i === active ? "bg-blue-50" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
