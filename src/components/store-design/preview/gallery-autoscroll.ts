import { useEffect } from "react";

/** Gentle bidirectional scrolling with no duplicated links or photos. */
export function useGalleryAutoScroll(
  ref: { current: HTMLDivElement | null },
  enabled: boolean,
  speed = 28,
  contentKey = "",
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0,
      last = 0,
      direction = 1,
      position = el.scrollLeft,
      resumeAt = 0;
    let hovered = el.matches(":hover"),
      focused = el.contains(document.activeElement),
      touching = false,
      visible = true;
    const oldSnap = el.style.scrollSnapType;
    const oldBehavior = el.style.scrollBehavior;
    const preference = () => {
      el.style.scrollSnapType = reduce.matches ? oldSnap : "none";
      el.style.scrollBehavior = reduce.matches ? oldBehavior : "auto";
      last = 0;
    };
    preference();
    const nudge = () => {
      resumeAt = performance.now() + 2500;
      position = el.scrollLeft;
    };
    const enter = () => {
      hovered = true;
    };
    const leave = () => {
      hovered = false;
      nudge();
    };
    const focus = () => {
      focused = true;
    };
    const blur = (event: FocusEvent) => {
      focused = el.contains(event.relatedTarget as Node | null);
      nudge();
    };
    const touch = () => {
      touching = true;
    };
    const untouch = () => {
      touching = false;
      nudge();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);
    const tick = (now: number) => {
      const elapsed = last ? Math.min(now - last, 64) / 1000 : 0;
      last = now;
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      if (
        !reduce.matches &&
        !document.hidden &&
        visible &&
        !hovered &&
        !focused &&
        !touching &&
        now >= resumeAt &&
        max > 1
      ) {
        position = Math.max(
          0,
          Math.min(
            max,
            position + direction * Math.max(10, Math.min(80, speed)) * elapsed,
          ),
        );
        el.scrollLeft = position;
        if (position >= max) direction = -1;
        if (position <= 0) direction = 1;
      } else position = el.scrollLeft;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("focusin", focus);
    el.addEventListener("focusout", blur);
    el.addEventListener("touchstart", touch, { passive: true });
    el.addEventListener("touchend", untouch, { passive: true });
    el.addEventListener("touchcancel", untouch, { passive: true });
    el.addEventListener("wheel", nudge, { passive: true });
    el.addEventListener("keydown", nudge);
    reduce.addEventListener("change", preference);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      el.style.scrollSnapType = oldSnap;
      el.style.scrollBehavior = oldBehavior;
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("focusin", focus);
      el.removeEventListener("focusout", blur);
      el.removeEventListener("touchstart", touch);
      el.removeEventListener("touchend", untouch);
      el.removeEventListener("touchcancel", untouch);
      el.removeEventListener("wheel", nudge);
      el.removeEventListener("keydown", nudge);
      reduce.removeEventListener("change", preference);
    };
  }, [ref, enabled, speed, contentKey]);
}
