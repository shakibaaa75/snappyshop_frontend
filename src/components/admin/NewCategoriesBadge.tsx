"use client";

import { useEffect, useState } from "react";
import { adminCategories } from "@/lib/api/adminCategories";

/** Sidebar badge: how many categories sellers created that admin has not seen. */
export function NewCategoriesBadge() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () =>
      adminCategories
        .listNew()
        .then((l) => alive && setN(l.length))
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    const onSeen = () => load();
    window.addEventListener("admin-categories-changed", onSeen);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("admin-categories-changed", onSeen);
    };
  }, []);
  if (n === 0) return null;
  return (
    <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}
