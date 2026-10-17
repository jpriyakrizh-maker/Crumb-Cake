"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { films, hero } from "../content";
import { onReveal } from "./LayersLoader";
import FilmPin from "./FilmPin";
import { NAV_GAP, within } from "./film";
// Hero "Build a ___ by scrolling." (HR28 split header over a landscape stage · Motion map M59 liquid morphing words).
// The hero-build film scrubs by video time (eager, the loader waits for every frame; a 1 s intro drops the first layer
// by itself). The headline's missing word melts base → jam → crème → cake through a gooey threshold filter, fired when
// the video CROSSES the measured beats (content.ts → hero.words), so the sentence finishes when the cake does.
// A layer meter (1 → 7) ticks on the measured landings. ?static=1: the finished cake, "cake", 7/7.
// The intro plays the film by itself from the loader's last frame until the scroll has caught up (lesson 4): no still
// moment after the loader while the record scroll is still accelerating.
// intro: video 0 → 1.3 s (the first sponge + jam land) by itself; the scroll then maps 1.3 → 6.3 (films.build.start)
const INTRO = { from: 0, to: 1.3, secs: 1.25 };
const place = (phone) => phone
  ? {
    fit: { box: [0.02, 0.1, 0.98, 0.93], area: (c) => ({ top: NAV_GAP + 8, bottom: (within(c, ".hero-copy")?.top ?? c.clientHeight * 0.55) - 8 }) },
    fade: { t: 0.06, b: 0.1, l: 0.08, r: 0.08 },
  }
  : { h: 1, y: 0.58, fade: { t: 0.1, b: 0.12, l: 0.06, r: 0.06 } };
/** extra push-in over the finished-cake hold (TheCrown imports it: its START framing matches) */
export const HOLD_PUSH = 0.12;
/** seconds a word melts into the next · seconds every word stays fully readable (sharp, no filter) */
const MELT = 0.45;
const READ = 0.4;
const BLUR = (f) => Math.min(8 / Math.max(f, 0.01) - 8, 60);
export default function BuildHero() {
  const root = useRef(null);
  const hold = useRef(null);
  // shown = the word on screen · target = the word the video has reached · readyAt = when `shown` became sharp
  // starts on "base" (index 0): the film reports the intro's first second before this component's own effect runs,
  // so the queue must already be at the start (starting at "cake" made it melt backwards: cake → crème → jam → base).
  // ?static=1 never runs the queue: the server-rendered text there is the final word, "cake".
  const q = useRef({ shown: 0, target: 0, busy: false, readyAt: 0, timer: 0 });
  // word slot: two stacked spans melt into each other through the goo filter (Magic UI morphing-text idea, MIT).
  // A queue: one word at a time, and only after the current word has been sharp for READ seconds, so every word
  // (base, jam, crème, cake) is readable even when the scroll races ahead. The goo filter is on ONLY while melting:
  // a settled word is plain, sharp type.
  const step = () => {
    const s = q.current;
    const el = root.current;
    if (!el || s.busy || s.target === s.shown)
      return;
    const wait = s.readyAt + READ * 1000 - performance.now();
    if (wait > 0) {
      window.clearTimeout(s.timer);
      s.timer = window.setTimeout(step, wait + 5);
      return;
    }
    const next = s.shown + Math.sign(s.target - s.shown);
    const slot = el.querySelector(".slot-word");
    const a = el.querySelector(".slot-a");
    const b = el.querySelector(".slot-b");
    a.textContent = hero.words[s.shown].word;
    b.textContent = hero.words[next].word;
    s.busy = true;
    slot.style.filter = "url(#crumb-goo)";
    const o = { f: 0 };
    gsap.to(o, {
      f: 1,
      duration: MELT,
      ease: "none",
      onUpdate: () => {
        b.style.filter = `blur(${BLUR(o.f).toFixed(1)}px)`;
        b.style.opacity = `${Math.pow(o.f, 0.4)}`;
        a.style.filter = `blur(${BLUR(1 - o.f).toFixed(1)}px)`;
        a.style.opacity = `${Math.pow(1 - o.f, 0.4)}`;
      },
      onComplete: () => {
        s.shown = next;
        s.busy = false;
        s.readyAt = performance.now();
        a.textContent = hero.words[next].word;
        a.style.filter = "none";
        a.style.opacity = "1";
        b.style.opacity = "0";
        b.style.filter = "none";
        slot.style.filter = "none";
        step();
      },
    });
  };
  const onTime = (t) => {
    const el = root.current;
    if (!el)
      return;
    hold.current?.(t);
    let idx = 0;
    hero.words.forEach((w, i) => t >= w.at && (idx = i));
    if (!prefersReducedMotion() && idx !== q.current.target) {
      q.current.target = idx;
      step();
    }
    const n = hero.layers.filter((at) => t >= at).length;
    const m = el.querySelector(".meter-n");
    if (m && m.textContent !== String(n))
      m.textContent = String(n);
    el.querySelectorAll(".meter-cell").forEach((c, i) => c.classList.toggle("on", i < n));
  };
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    // start on "base" (the first layer drops during the intro)
    const el = root.current;
    // the word on screen is the queue's word ("base" unless the film has already moved it on)
    q.current.readyAt = performance.now();
    if (!q.current.busy)
      el.querySelector(".slot-a").textContent = hero.words[q.current.shown].word;
    // a slow push-in over the whole pin (the stage itself never moves, lesson 39): scroll-linked, smaller than the film
    const section = el.closest("#hero");
    // film scale = scroll push (1 → 1.06 over the pin) × arrival settle (1.06 → 1): one setter, two drivers
    const canvas = section.querySelector(".hero-canvas");
    const z = { push: 1, settle: 1.06, hold: 1 };
    const apply = () => gsap.set(canvas, { scale: z.push * z.settle * z.hold });
    // the finished-cake hold: once the film reaches 6.0 s the cake pushes in a further HOLD_PUSH over 1.15 s on the
    // clock (not the scroll: the record scroll slows into the cut, a scroll-tied push would stand still there)
    let holding = false;
    hold.current = (t) => {
      if (t >= 6.0 && !holding) {
        holding = true;
        gsap.to(z, { hold: 1 + HOLD_PUSH, duration: 1.15, ease: "none", overwrite: true, onUpdate: apply });
      }
      else if (t < 5.95 && holding) {
        holding = false;
        gsap.to(z, { hold: 1, duration: 0.4, ease: "power2.out", overwrite: true, onUpdate: apply });
      }
    };
    apply();
    const push = gsap.to(z, { push: 1.06, ease: "none", onUpdate: apply, scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.4 } });
    // the arrival (on the loader's exit, while the first layers drop): the film settles from a slight zoom, the
    // headline lines rise out of their masks, the copy + buttons follow (≤ 3 staggered entrances, lesson: motion budget)
    gsap.set(el.querySelectorAll(".hero-line"), { yPercent: 105 });
    gsap.set(el.querySelectorAll(".hero-side, .hero-meta"), { opacity: 0, y: 18 });
    const offReveal = onReveal(() => {
      gsap.to(z, { settle: 1, duration: 2.4, ease: "power2.out", onUpdate: apply });
      gsap.to(el.querySelectorAll(".hero-line"), { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.12, delay: 0.4 });
      gsap.to(el.querySelectorAll(".hero-side, .hero-meta"), { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.75 });
    });
    return () => {
      offReveal();
      window.clearTimeout(q.current.timer);
      push.scrollTrigger?.kill();
      push.kill();
    };
  }, []);
  return (<FilmPin id="hero" film={films.build} arrive={0} eager blockLoader place={place} intro={INTRO} onTime={onTime} className="hero" before={<div className="film-bg absolute inset-0" />} canvasClass="hero-canvas absolute inset-0 h-full w-full">
    <div ref={root} className="absolute inset-0">
      <div id="top" className="absolute top-0" />
      <div className="container-x relative z-[2] flex h-full flex-col max-md:justify-end max-md:pb-[4svh]">
        <div className="hero-copy grid grid-cols-[1fr_auto_1fr] items-start gap-8 pt-[clamp(96px,14vh,140px)] max-md:grid-cols-1 max-md:gap-4 max-md:pt-0">
          <h1 className="font-display text-[clamp(44px,6.1vw,104px)] max-md:text-[44px]">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="hero-line inline-block whitespace-nowrap">
                {hero.lead}{" "}
                <span className="slot-word">
                  <span className="slot-a">{hero.words[hero.words.length - 1].word}</span>
                  <span className="slot-b" style={{ opacity: 0 }} aria-hidden />
                </span>
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="hero-line inline-block">{hero.tail}</span>
            </span>
          </h1>
          <div className="w-[min(30vw,420px)] max-md:hidden" />
          <div className="hero-side justify-self-end pt-3 max-md:justify-self-start max-md:pt-0">
            <p className="max-w-[34ch] text-[15px] leading-[1.55] text-muted max-md:text-[14px]">{hero.copy}</p>
            <div className="mt-5 flex flex-wrap gap-2 max-md:mt-3">
              <a href="#counter" className="btn btn-solid" data-cursor="Order" data-mag>
                <span className="mag-label">{hero.ctas[0]}</span>
              </a>
              <a href="#build" className="btn btn-ink">
                {hero.ctas[1]}
              </a>
            </div>
          </div>
        </div>
        <div className="hero-meta mt-auto flex items-end justify-between pb-[4.5vh] max-md:hidden">
          <div className="flex items-center gap-4">
            <div className="flex gap-[3px]" aria-hidden>
              {hero.layers.map((_, i) => (<span key={i} className={`meter-cell on block h-[18px] w-[10px] ${["bg-[#e7b765]", "bg-[var(--straw)]", "bg-[var(--paper)]"][[0, 1, 2, 0, 1, 0, 2][i]]} border border-[var(--choc)]`} />))}
            </div>
            <p className="label text-muted">
              Layer <span className="meter-n tabular-nums">7</span> / 7
            </p>
          </div>
          <p className="label text-muted">Vanilla sponge · Strawberry jam · Whipped cream · Baked at 6 am</p>
        </div>
      </div>
    </div>
    <svg className="absolute h-0 w-0" aria-hidden>
      <filter id="crumb-goo">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
      </filter>
    </svg>
  </FilmPin>);
}
