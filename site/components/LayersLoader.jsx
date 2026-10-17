"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { loading } from "@/lib/loading";
import { img } from "../content";
// Loader "Cake bar" (Motion map M63, rebuilt in Round 5). The engine loader is off (meta.loader = false).
// On cream, a small cake builds itself as the progress bar: a chocolate base slides in, then the strawberry jam, then
// the cream (three stacked bars), with a 0 → 100 counter beside it. At 100 a strawberry drops on top with a small
// bounce and "Crumb & Co" fades in under it. Then a chocolate drip curtain (wavy drip edge) slides down over
// everything and pulls back up, revealing the hero, whose first layer is already dropping (lesson 4).
// The build is pure CSS from the first paint (lesson 11); JS only waits for the hero frames (never more than
// HOLD_MAX) and runs the curtain. Total ≈ 1.9 s when the frames are in.
const BUILT = 1.2; // s: bars + counter + strawberry + wordmark (CSS)
const DOWN = 0.32; // curtain covers
const UP = 0.42; // curtain pulls away
const HOLD_MAX = 10;
let revealed = false;
/** Runs when the curtain has covered the screen and the hero starts (immediately if it already has / ?static=1). */
export function onReveal(fn) {
  if (revealed) {
    fn();
    return () => { };
  }
  const h = () => fn();
  window.addEventListener("crumb:reveal", h, { once: true });
  return () => window.removeEventListener("crumb:reveal", h);
}
const reveal = () => {
  if (revealed)
    return;
  revealed = true;
  window.dispatchEvent(new Event("crumb:reveal"));
};
/** the curtain's wavy drip edge (viewBox 0 0 1200 120): uneven drips of different lengths */
const DRIP = "M0 0H1200V38C1180 38 1172 64 1160 64C1146 64 1146 40 1128 40C1110 40 1112 92 1094 92C1076 92 1078 44 1058 44C1036 44 1040 70 1020 70C1000 70 1004 38 980 38C958 38 962 104 940 104C918 104 922 46 900 46C878 46 884 66 862 66C842 66 846 40 824 40C802 40 806 84 786 84C766 84 770 42 748 42C726 42 732 112 708 112C686 112 690 44 668 44C646 44 652 62 630 62C610 62 614 38 592 38C570 38 576 90 554 90C532 90 536 46 514 46C492 46 498 70 476 70C456 70 460 40 438 40C416 40 420 100 398 100C376 100 382 44 360 44C338 44 344 64 322 64C302 64 306 38 284 38C262 38 268 86 246 86C224 86 228 42 206 42C184 42 190 74 168 74C148 74 152 40 130 40C108 40 114 96 92 96C70 96 74 44 52 44C30 44 36 60 18 60C8 60 4 40 0 40Z";
export default function LayersLoader() {
  const root = useRef(null);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const finish = () => {
      setGone(true);
      reveal();
      loading.markFinished();
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    window.scrollTo(0, 0);
    const el = root.current;
    const t0 = performance.now();
    let framesReady = false;
    let started = false;
    const curtain = () => {
      if (started)
        return;
      started = true;
      const sheet = el.querySelector(".ld-curtain");
      gsap
        .timeline({ onComplete: () => setGone(true) })
        // the sheet waits above the screen (CSS top); moving it down by its own height covers the screen, drips below
        .fromTo(sheet, { yPercent: 0 }, { yPercent: 100, duration: DOWN, ease: "power2.in" })
        // covered: the cream stage goes, the hero starts underneath (text rise, nav, film intro)
        .add(() => {
          el.querySelector(".ld-stage").style.visibility = "hidden";
          el.style.background = "transparent";
          reveal();
          loading.markFinished();
        })
        .to(sheet, { yPercent: 0, duration: UP, ease: "power3.inOut" }, "+=0.04");
    };
    const unsub = loading.subscribe((_, done) => {
      if (done)
        framesReady = true;
    });
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      if ((framesReady && t >= BUILT) || t > HOLD_MAX)
        curtain();
      else
        raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, []);
  if (gone)
    return null;
  return (<div ref={root} data-loader aria-hidden className="fixed inset-0 z-[100] overflow-hidden bg-[#f5ede2]">
    <div className="ld-stage absolute inset-0 grid place-items-center">
      {/* a soft strawberry-milk glow grows behind the cake from the first frame (the cake itself is small) */}
      <div className="ld-glow pointer-events-none absolute left-1/2 top-1/2 h-[95vmin] w-[95vmin] rounded-full" />
      <div className="relative flex flex-col items-center">
        <div className="flex items-end gap-5">
          {/* the cake: strawberry on top, then cream, jam, chocolate base (built bottom-up) */}
          <div className="relative w-[clamp(160px,19vw,270px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img("top-1.webp")} alt="" className="ld-berry absolute bottom-full left-1/2 mb-[-6px] w-[34%] -translate-x-1/2" />
            <span className="ld-bar ld-bar-3 block h-[clamp(20px,2.2vw,28px)] bg-[#fffaf3]" />
            <span className="ld-bar ld-bar-2 block h-[clamp(14px,1.5vw,19px)] bg-[#c83a55]" />
            <span className="ld-bar ld-bar-1 block h-[clamp(26px,2.8vw,36px)] bg-[#3b2418]" />
          </div>
          <p className="font-display ld-count w-[3.2ch] text-left text-[34px] leading-none tabular-nums text-[color:#3b2418]" />
        </div>
        <p className="ld-word font-display mt-7 text-[clamp(40px,5vw,72px)] text-[color:#3b2418]">Crumb &amp; Co</p>
      </div>
    </div>
    {/* the chocolate drip curtain (slides down, pulls away) */}
    <div className="ld-curtain absolute inset-x-0 top-[calc(-100%-14vh)] h-[calc(100%+14vh)]">
      <div className="h-[calc(100%-14vh)] bg-[#3b2418]" />
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block h-[14vh] w-full" aria-hidden>
        <path d={DRIP} fill="#3b2418" />
      </svg>
    </div>
  </div>);
}
