"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { boxed, films } from "../content";
import FilmPin from "./FilmPin";
import { NAV_GAP, within } from "./film";
// "Boxed by four" (VD12 video then feature grid · Motion map M72 glacial-then-sudden pin).
// The box film scrubs: flaps fold slowly (the glacial 60%), then the lid lands and the tab tucks (the sudden payoff,
// where the four feature tiles snap up along the bottom in Round 2), then the pink sticker flies on.
// Phone: film on top, tiles 2×2 under it. ?static=1: the closed box with its sticker, tiles in place.
const place = (phone) => phone
  ? {
    fit: { box: [0.12, 0.04, 0.98, 0.9], area: (c) => ({ top: NAV_GAP + 4, bottom: (within(c, ".boxed-copy")?.top ?? c.clientHeight * 0.5) - 6 }) },
    fade: { t: 0.1, b: 0.1, l: 0.08, r: 0.08 },
  }
  : { h: 0.9, x: 0.6, y: 0.42, fade: { l: 0.14, t: 0.1, b: 0.16, r: 0.04 } };
/** video second the lid lands (measured): the "sudden" payoff */
const LID = 2.45;
export default function BoxedFilm() {
  const root = useRef(null);
  const up = useRef(false);
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    gsap.set(root.current.querySelectorAll(".boxed-tile"), { y: 70, opacity: 0 });
    const sec = document.getElementById("boxed");
    const stage = sec.querySelector(".pin-stage");
    // X18 in: the builder's cake card pops once (1 → 1.05 → 1) as the box film dissolves up through its pink
    const cover = gsap.fromTo(sec.querySelector(".boxed-cover"), { opacity: 1 }, { opacity: 0, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "top 55%", scrub: true } });
    const pop = ScrollTrigger.create({
      trigger: sec,
      start: "top 92%",
      onEnter: () => gsap.fromTo("#build .build-diagram", { scale: 1 }, { scale: 1.05, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" }),
    });
    // X1 out: the order feed slides up over the pinned box (its tail), which dims and sinks a little
    const dim = gsap.fromTo(stage, { filter: "brightness(1)", scale: 1 }, { filter: "brightness(0.62)", scale: 0.97, ease: "none", scrollTrigger: { trigger: "#orders", start: "top bottom", end: "top top", scrub: true } });
    return () => {
      [cover, dim].forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      pop.kill();
    };
  }, []);
  // glacial, then sudden: the film creeps (slow push-in) until the lid lands, then the four tiles snap up along the
  // stepped bottom edge in one quick stagger; scrolling back above the lid folds them away again
  const onTime = (t) => {
    const el = root.current;
    if (!el || prefersReducedMotion())
      return;
    const canvas = el.parentElement?.querySelector("canvas");
    if (canvas)
      canvas.style.transform = `scale(${(1 + t * 0.016).toFixed(4)})`;
    const tiles = el.querySelectorAll(".boxed-tile");
    if (t >= LID && !up.current) {
      up.current = true;
      gsap.to(tiles, { y: 0, opacity: 1, duration: 0.55, ease: "power2.out", stagger: 0.07, overwrite: true });
      gsap.fromTo(el.querySelector(".boxed-copy h2"), { y: 0 }, { y: -6, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
    }
    else if (t < LID - 0.15 && up.current) {
      up.current = false;
      gsap.to(tiles, { y: 70, opacity: 0, duration: 0.35, ease: "power2.in", stagger: 0.04, overwrite: true });
    }
  };
  return (<FilmPin id="boxed" film={films.box} arrive={1.0} place={place} onTime={onTime} loadWhen="#build" tail={100} before={<>
    <div className="film-bg absolute inset-0" />
    <div aria-hidden className="boxed-cover pointer-events-none absolute inset-0 z-[6] bg-[var(--pink)]" />
  </>}>
    <div ref={root} className="container-x relative z-[2] flex h-full flex-col pb-[4vh] pt-[clamp(96px,15vh,150px)] max-md:justify-end max-md:pt-0">
      <div className="boxed-copy w-[min(32vw,460px)] max-md:w-full">
        <h2 className="font-display text-[clamp(48px,5.6vw,96px)] max-md:text-[44px]">
          Boxed by <span className="text-[color:var(--straw)]">four.</span>
        </h2>
        <p className="mt-3 max-w-[34ch] text-[15px] leading-[1.55] text-muted max-md:text-[14px]">{boxed.sub}</p>
        <a href="#counter" className="btn btn-solid mt-5 max-md:mt-3" data-cursor="Order" data-mag>
          <span className="mag-label">{boxed.cta}</span>
        </a>
      </div>
      <ul className="boxed-tiles mt-auto grid grid-cols-4 gap-3 max-md:mt-4 max-md:grid-cols-2 max-md:gap-2">
        {boxed.features.map((f, i) => (<li key={f.name} className={`boxed-tile ${["tone-pistachio", "tone-pink", "tone-cream", "tone-blush"][i]} border-[1.5px] border-[var(--choc)] px-4 py-3 max-md:px-3 max-md:py-2`}>
          <p className="font-display text-[22px] max-md:text-[17px]">{f.name}</p>
          <p className="mt-1 text-[13px] leading-snug text-muted max-md:text-[12px]">{f.note}</p>
        </li>))}
      </ul>
    </div>
  </FilmPin>);
}
