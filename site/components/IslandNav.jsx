"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { nav } from "../content";
import { order } from "../cart";
import { onReveal } from "./LayersLoader";
// Nav "Three islands" (NV11 restyled as N11 split bars; Motion map M18 corner grow, built in Round 2).
// Square cream islands with a chocolate hairline: wordmark · links · Pickup/Delivery + the strawberry Order pill
// (F8 landing spot: .order-pill). Phone: wordmark + Order pill + a Menu button that opens a sheet.
export default function IslandNav() {
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState(0);
  const [open, setOpen] = useState(false);
  const pill = useRef(null);
  // M18 corner grow: on the loader's exit each island unfolds out of its outer corner (left: top-left, links: top
  // centre, order: top-right), 0.1 s apart
  const head = useRef(null);
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const el = head.current;
    const islands = ["island-l", "island-c", "island-r"].map((c) => el.querySelector(`.${c}`));
    const from = ["polygon(0 0, 0 0, 0 0, 0 0)", "polygon(50% 0, 50% 0, 50% 0, 50% 0)", "polygon(100% 0, 100% 0, 100% 0, 100% 0)"];
    islands.forEach((isl, i) => gsap.set(isl, { clipPath: from[i] }));
    return onReveal(() => {
      islands.forEach((isl, i) => gsap.to(isl, { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 0.85, ease: "power3.out", delay: 0.25 + i * 0.1, clearProps: "clipPath" }));
    });
  }, []);
  useEffect(() => order.subscribe((n, added) => {
    setCount(n);
    if (added && pill.current && !prefersReducedMotion())
      gsap.fromTo(pill.current, { scale: 1.18 }, { scale: 1, duration: 0.6, ease: "expo.out" });
  }), []);
  return (<header ref={head} className="nav-islands fixed inset-x-0 top-0 z-50 px-[clamp(12px,2vw,28px)] pt-[clamp(10px,1.6vw,20px)]">
    <div className="flex items-start justify-between gap-3">
      <a href="#top" className="island island-l flex h-[46px] items-center px-4 max-md:px-3">
        <span className="font-display whitespace-nowrap text-[22px] leading-none max-md:text-[19px]">Crumb &amp; Co</span>
      </a>

      <nav className="island island-c flex h-[46px] items-center gap-1 px-2 max-md:hidden" aria-label="Main">
        {nav.links.map((l) => (<a key={l.href} href={l.href} className="link-underline px-3 py-1 text-[14px] font-medium">
          {l.label}
        </a>))}
      </nav>

      <div className="island island-r flex h-[46px] items-center gap-2 pl-2 pr-1.5">
        <div className="seg nav-seg" role="group" aria-label="Order type">
          {nav.modes.map((m, i) => (<button key={m} type="button" aria-pressed={mode === i} onClick={() => setMode(i)}>
            {m}
          </button>))}
        </div>
        <a ref={pill} href="#counter" className="order-pill btn-solid relative flex h-[34px] overflow-hidden items-center gap-2 px-3 text-[13px] font-semibold" data-cursor="Order">
          Order
          <span className="grid h-[20px] min-w-[20px] place-items-center bg-[var(--paper)] px-1 text-[12px] font-bold text-[color:var(--straw)] tabular-nums">
            {count}
          </span>
        </a>
        <button type="button" className="px-2 text-[14px] font-semibold md:hidden" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </div>

    {open && (<div className="island mt-2 grid gap-1 p-3 md:hidden">
      {nav.links.map((l) => (<a key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-display py-1 text-[34px]">
        {l.label}
      </a>))}
    </div>)}
  </header>);
}
