"use client";
import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
/**
 * Never a frozen hold: while ?record=1 stands still on a stop (record:hold), the held picture pushes in slowly
 * (1.00 → 1.035, a camera move), then eases back as the scroll moves on. The stop element names what to push with
 * data-hold-push="<selector>" (default: the element itself).
 */
export default function HoldPush() {
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const onHold = (e) => {
      const stop = e.target;
      const sel = stop.dataset?.holdPush;
      if (sel === undefined)
        return;
      const el = sel ? stop.querySelector(sel) : stop;
      if (!el)
        return;
      const d = e.detail?.duration ?? 1;
      gsap.fromTo(el, { scale: 1 }, { scale: 1.035, duration: d + 0.5, ease: "sine.inOut", overwrite: true });
    };
    const onEnd = (e) => {
      const stop = e.target;
      const sel = stop.dataset?.holdPush;
      if (sel === undefined)
        return;
      const el = sel ? stop.querySelector(sel) : stop;
      if (el)
        gsap.to(el, { scale: 1, duration: 1.2, ease: "sine.inOut", overwrite: true });
    };
    document.addEventListener("record:hold", onHold);
    document.addEventListener("record:holdend", onEnd);
    return () => {
      document.removeEventListener("record:hold", onHold);
      document.removeEventListener("record:holdend", onEnd);
    };
  }, []);
  return null;
}
