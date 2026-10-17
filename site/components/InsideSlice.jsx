"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { films, inside } from "../content";
import FilmPin from "./FilmPin";
import { NAV_GAP, within } from "./film";
// "Inside the Crown" (ST12 hero metric + image + figure row · Motion map M48 odometer roll).
// The slice film (0–4.6 s: the server slides in, the wedge comes out) scrubs on the right; the big "7 layers"
// metric and copy sit left; the figure row (3 · 2 · 2 · 7) runs along the bottom and rolls as the wedge reveals the
// layers: each digit is a 0–9 column that spins a full turn onto its value when the film CROSSES that layer's second
// (and spins back if you scroll back). In: X7 a pistachio sheet wipes off on a slant as the section arrives.
// Out: X2 the stage washes to strawberry milk as it leaves, so it hands over to the builder's pink with no seam.
// Phone: film on top, metric + figures 2×2 below. ?static=1: the wedge out, figures final, no sheet, no wash.
/** video second each figure rolls in (the wedge reveals sponge → jam → cream; the hours land as it settles) */
const ROLL_AT = [2.3, 2.8, 3.3, 3.9];
const ROW = 1.0; // em per digit row
const place = (phone) => phone
  ? {
    fit: { box: [0.04, 0.12, 0.98, 0.9], area: (c) => ({ top: NAV_GAP + 4, bottom: (within(c, ".inside-copy")?.top ?? c.clientHeight * 0.5) - 6 }) },
    fade: { t: 0.1, b: 0.1, l: 0.08, r: 0.08 },
  }
  : { h: 0.84, x: 0.63, y: 0.44, fade: { l: 0.14, r: 0.04, t: 0.1, b: 0.14 } };
export default function InsideSlice() {
  const rolled = useRef(ROLL_AT.map(() => false));
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const sec = document.getElementById("inside");
    // a slow push-in over the whole section (the sticky stage never moves by itself, lesson 39)
    const push = gsap.fromTo(sec.querySelector("canvas"), { scale: 1 }, { scale: 1.07, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.4 } });
    // X7 in: the pistachio sheet's slanted left edge sweeps across while the section scrolls into place
    const sheet = sec.querySelector(".inside-sheet");
    const w = { p: 0 };
    const wipe = gsap.to(w, {
      p: 1,
      ease: "none",
      onUpdate: () => {
        const x = w.p * 125;
        sheet.style.clipPath = `polygon(${x}% 0, 100% 0, 100% 100%, ${x - 25}% 100%)`;
      },
      scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: true },
    });
    // X2 out: the stage washes to the builder's strawberry milk as it scrolls away
    const wash = gsap.fromTo(sec.querySelector(".inside-wash"), { opacity: 0 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: sec, start: "bottom bottom", end: "bottom 15%", scrub: true } });
    // the digit columns start on 0
    gsap.set(sec.querySelectorAll(".odo-col"), { y: 0 });
    return () => {
      [push, wipe, wash].forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
    };
  }, []);
  // M48: a figure spins a full turn onto its value when the film crosses its second; back below it, it spins home
  const onTime = (t) => {
    if (prefersReducedMotion())
      return;
    const cols = document.querySelectorAll("#inside .odo-col");
    ROLL_AT.forEach((at, i) => {
      const col = cols[i];
      if (!col)
        return;
      const d = Number(col.dataset.d);
      if (t >= at && !rolled.current[i]) {
        rolled.current[i] = true;
        gsap.to(col, { y: `${-(10 + d) * ROW}em`, duration: 1.2, ease: "power3.out", overwrite: true });
      }
      else if (t < at - 0.12 && rolled.current[i]) {
        rolled.current[i] = false;
        gsap.to(col, { y: 0, duration: 0.6, ease: "power2.inOut", overwrite: true });
      }
    });
  };
  return (<FilmPin id="inside" film={films.slice} arrive={1.0} place={place} loadWhen="#counter" onTime={onTime} before={<div className="film-bg absolute inset-0" />} className="inside">
    <div aria-hidden className="inside-sheet pointer-events-none absolute inset-0 z-[5] bg-[var(--pist)]" />
    <div aria-hidden className="inside-wash pointer-events-none absolute inset-0 z-[5] bg-[var(--pink)] opacity-0" />
    <div className="container-x relative z-[2] flex h-full flex-col pb-[5vh] pt-[clamp(96px,15vh,150px)] max-md:justify-end max-md:pt-0">
      <div className="inside-copy w-[min(34vw,480px)] max-md:w-full">
        <p className="flex items-end gap-3">
          <span className="font-display text-[clamp(120px,15vw,240px)] leading-[0.8] text-[color:var(--straw)] max-md:text-[96px]">{inside.metric}</span>
          <span className="font-display pb-2 text-[clamp(28px,2.6vw,44px)]">{inside.metricLabel}</span>
        </p>
        <h2 className="font-display mt-5 text-[clamp(32px,3.2vw,54px)] max-md:mt-2 max-md:text-[30px]">{inside.title}</h2>
        <p className="mt-3 max-w-[38ch] text-[15px] leading-[1.55] text-muted max-md:text-[14px]">{inside.copy}</p>
      </div>
      <dl className="inside-figs mt-auto grid grid-cols-4 border-t-[1.5px] border-[var(--choc)] max-md:mt-4 max-md:grid-cols-2">
        {inside.figures.map((f, i) => (<div key={f.label} className={`pt-4 max-md:pt-2 ${i ? "border-l-[1.5px] border-[var(--choc)] pl-5 max-md:pl-3" : ""} max-md:[&:nth-child(3)]:border-l-0 max-md:[&:nth-child(3)]:pl-0`}>
          <dt className="sr-only">{f.label}</dt>
          <dd className="font-display fig-v text-[clamp(44px,4.6vw,76px)] leading-none max-md:text-[40px]" aria-label={f.v}>
            {/* the final digit sits in flow (static / no-JS); the rolling column covers it */}
            <span className="relative inline-block h-[1em] overflow-hidden align-top leading-none" aria-hidden>
              <span className="invisible">{f.v}</span>
              <span className="odo-col absolute left-0 top-0 flex flex-col" data-d={f.v} style={{ transform: `translateY(${-(10 + Number(f.v)) * ROW}em)` }}>
                {Array.from({ length: 20 }, (_, k) => (<span key={k} className="block h-[1em] leading-none">
                  {k % 10}
                </span>))}
              </span>
            </span>
          </dd>
          <dd className="label mt-2 text-muted">{f.label}</dd>
        </div>))}
      </dl>
    </div>
  </FilmPin>);
}
