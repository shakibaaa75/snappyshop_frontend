"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  changeShopName,
  changeStoreAddress,
  isSlugCooldownError,
  loadDraftWithMeta,
  publishDesign,
  saveDraft,
  slugCooldownMessage,
  type SlugChangeInfo,
} from "./api";
import { defaultDesign, type StoreDesign } from "./types";
import { purgeLocalStoreData } from "./purge";

interface History {
  past: StoreDesign[];
  present: StoreDesign;
  future: StoreDesign[];
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const MAX_HISTORY = 50;
const COALESCE_MS = 800;

export function useStoreDesign() {
  const [history, setHistory] = useState<History>({
    past: [],
    present: defaultDesign,
    future: [],
  });
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [published, setPublished] = useState<StoreDesign | null>(null);
  const [slugInfo, setSlugInfo] = useState<SlugChangeInfo>({
    canChangeSlug: true,
    canChangeName: true,
    nameChangesRemaining: 1,
  });
  const [slugError, setSlugError] = useState<string | null>(null);

  const lastEdit = useRef(0);
  const lastKey = useRef("");
  const skipFirstSave = useRef(true);
  // Set when the saved draft could not be loaded. While true, autosave is off
  // so the editor's default values can never overwrite the seller's saved work.
  const loadFailed = useRef(false);
  // The address currently stored on the server (last known good).
  const serverSlug = useRef<string>("");
  // Always-current copy of slugInfo. persist() reads it from here instead of
  // closing over the state: otherwise every save (which stores a new slugInfo)
  // would create a new persist(), re-run the autosave effect, and save again,
  // forever.
  const slugInfoRef = useRef(slugInfo);
  slugInfoRef.current = slugInfo;

  // Load the seller's draft from the API on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { design: draft, slugInfo: info } = await loadDraftWithMeta();
        if (cancelled) return;
        if (draft) setHistory({ past: [], present: draft, future: [] });
        setPublished(draft);
        setSlugInfo(info);
        serverSlug.current =
          info.currentSlug ||
          (draft?.storeSlug ? String(draft.storeSlug) : "") ||
          "";
      } catch {
        // The server could not be reached or returned an error. Keep the
        // defaults on screen but do NOT autosave them over the real draft.
        loadFailed.current = true;
        if (!cancelled) setStatus("error");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    (patch: Partial<StoreDesign>) => {
      // The shop name only changes through renameShop (one confirmed change).
      if ("storeName" in patch) {
        const { storeName: _name, ...rest } = patch;
        patch = rest;
        if (Object.keys(patch).length === 0) return;
      }
      // While the address is locked, ignore attempts to change storeSlug so
      // other design edits still work and autosave never trips the cooldown.
      if (
        "storeSlug" in patch &&
        !slugInfo.canChangeSlug &&
        patch.storeSlug !== serverSlug.current
      ) {
        const { storeSlug: _ignored, ...rest } = patch;
        patch = rest;
        if (Object.keys(patch).length === 0) return;
      }

      const now = Date.now();
      const key = Object.keys(patch).sort().join(",");
      const coalesce =
        now - lastEdit.current < COALESCE_MS && key === lastKey.current;
      lastEdit.current = now;
      lastKey.current = key;
      setHistory((h) => ({
        past: coalesce
          ? h.past
          : [...h.past.slice(-(MAX_HISTORY - 1)), h.present],
        present: { ...h.present, ...patch },
        future: [],
      }));
    },
    [slugInfo.canChangeSlug],
  );

  const undo = useCallback(() => {
    lastEdit.current = 0;
    setHistory((h) =>
      h.past.length === 0
        ? h
        : {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future],
          },
    );
  }, []);

  const redo = useCallback(() => {
    lastEdit.current = 0;
    setHistory((h) =>
      h.future.length === 0
        ? h
        : {
            past: [...h.past, h.present],
            present: h.future[0],
            future: h.future.slice(1),
          },
    );
  }, []);

  const reset = useCallback(() => {
    lastEdit.current = 0;
    setHistory((h) => ({
      past: [...h.past.slice(-(MAX_HISTORY - 1)), h.present],
      // Resetting the look must never rename the shop or move its URL.
      present: {
        ...defaultDesign,
        storeName: h.present.storeName,
        storeSlug: h.present.storeSlug,
      },
      future: [],
    }));
  }, []);

  /**
   * Rename the shop (one change after registration, 30-day lock). The caller
   * must have shown the disclaimer and collected the seller's confirmation.
   * The server rebuilds the shop URL and retires the old one; the editor state
   * is rewritten so nothing here still refers to the old name or URL.
   */
  const renameShop = useCallback(
    async (
      name: string,
      slugOverride?: string,
    ): Promise<{ oldSlug: string; newSlug: string; newName: string }> => {
      const info = await changeShopName({
        storeName: name,
        storeSlug: slugOverride,
        acknowledgeLock: true,
      });
      const oldSlug = serverSlug.current;
      const newSlug = info.currentSlug || serverSlug.current;
      const newName = info.currentName || name.trim();

      const rewrite = (d: StoreDesign): StoreDesign => ({
        ...d,
        storeName: newName,
        storeSlug: newSlug,
      });

      serverSlug.current = newSlug;
      setSlugInfo(info);
      setSlugError(null);
      // Undo/redo must not bring the old name or address back.
      setHistory((h) => ({
        past: h.past.map(rewrite),
        present: rewrite(h.present),
        future: h.future.map(rewrite),
      }));
      setPublished((p) => (p ? rewrite(p) : p));
      if (oldSlug && oldSlug !== newSlug) purgeLocalStoreData(oldSlug);
      return { oldSlug, newSlug, newName };
    },
    [],
  );

  /**
   * Persist design. If storeSlug changed vs the server, use the dedicated
   * address endpoint first so the previous URL is retired; other fields still
   * go through saveDraft as usual.
   */
  const persist = useCallback(
    async (design: StoreDesign, mode: "draft" | "publish"): Promise<boolean> => {
      setSlugError(null);
      const nextSlug = (design.storeSlug || "").trim().toLowerCase();
      const prevSlug = (serverSlug.current || "").trim().toLowerCase();
      // Set when the store address really moved during this save.
      let movedTo: string | null = null;

      try {
        if (nextSlug && nextSlug !== prevSlug) {
          if (!slugInfoRef.current.canChangeSlug) {
            // Restore locked slug and continue saving the rest of the design.
            design = { ...design, storeSlug: serverSlug.current };
            setHistory((h) => ({
              ...h,
              present: { ...h.present, storeSlug: serverSlug.current },
            }));
            setSlugError(slugCooldownMessage(undefined, slugInfoRef.current));
          } else {
            try {
              const info = await changeStoreAddress(nextSlug);
              setSlugInfo(info);
              serverSlug.current = info.currentSlug || nextSlug;
              movedTo = serverSlug.current;
            } catch (err) {
              if (isSlugCooldownError(err)) {
                setSlugError(slugCooldownMessage(err, slugInfoRef.current));
                design = { ...design, storeSlug: serverSlug.current };
                setHistory((h) => ({
                  ...h,
                  present: { ...h.present, storeSlug: serverSlug.current },
                }));
              } else {
                throw err;
              }
            }
          }
        }

        const info =
          mode === "publish"
            ? await publishDesign(design)
            : await saveDraft(design);
        setSlugInfo(info);
        if (info.currentSlug) serverSlug.current = info.currentSlug;
        if (movedTo && typeof window !== "undefined") {
          // The seller area answers 404 for a retired address, so move to the
          // new one with a full load (also drops caches of the old address).
          const oldBase = `/seller/${prevSlug}`;
          const path = window.location.pathname;
          window.location.replace(
            path.startsWith(oldBase)
              ? path.replace(oldBase, `/seller/${movedTo}`)
              : `/seller/${movedTo}/store-design`,
          );
        }
        return true;
      } catch {
        return false;
      }
    },
    // Stable on purpose (see slugInfoRef above).
    [],
  );

  // Autosave the draft to the API.
  useEffect(() => {
    if (!ready || loadFailed.current) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    setStatus("saving");
    const timer = window.setTimeout(async () => {
      try {
        const ok = await persist(history.present, "draft");
        setStatus(ok ? "saved" : "error");
      } catch {
        setStatus("error");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [history.present, ready, persist]);

  const publish = useCallback(async () => {
    if (loadFailed.current) {
      // Never publish the empty defaults over a draft we could not read.
      setStatus("error");
      return false;
    }
    setStatus("saving");
    try {
      const ok = await persist(history.present, "publish");
      if (ok) {
        setPublished(history.present);
        setStatus("saved");
        return true;
      }
      setStatus("error");
      return false;
    } catch {
      setStatus("error");
      return false;
    }
  }, [history.present, persist]);

  const hasUnpublished = useMemo(
    () => JSON.stringify(history.present) !== JSON.stringify(published),
    [history.present, published],
  );

  const slugLockMessage = useMemo(() => {
    if (slugError) return slugError;
    if (slugInfo.canChangeSlug) return null;
    return slugCooldownMessage(undefined, slugInfo);
  }, [slugError, slugInfo]);

  return {
    design: history.present,
    update,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset,
    publish,
    status,
    ready,
    hasUnpublished,
    // Store address cooldown (UI)
    canChangeSlug: slugInfo.canChangeSlug,
    slugLockMessage,
    // Shop name rules (one change, 30-day lock)
    renameShop,
    shopName: {
      canChange: slugInfo.canChangeName,
      remaining: slugInfo.nameChangesRemaining,
      nextChangeAt: slugInfo.nextNameChangeAt ?? null,
      disclaimer: slugInfo.nameChangeDisclaimer,
    },
  };
}