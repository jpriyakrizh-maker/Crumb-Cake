"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { crown, films, toppings } from "../content";
import FilmPin from "./FilmPin";
import { HOLD_PUSH } from "./BuildHero";
import { NAV_GAP, within } from "./film";
// Signature "The Crown" (VD01 pinned frame-scrub with segment cards · Motion map M74 thrown curved path + F7).
// The ganache film (0–6.8 s) scrubs; the camera zooms in from wide to close on its own. Three square tags (Pour · Drip ·
// Crown) light up by video time. At crown.throwAt (3.6 s, the berries fall into frame) cut-outs of the same toppings
// are thrown OUT of the film on curved arcs (Round 2) and float on into the counter (F7). Phone: film on top, tags
// in a row under it. ?static=1: the crowned cake, all tags on.
// The camera zooms from wide to close and the crown sits at the very top of the source frame, so the film is never
// cropped: it is shrunk inside the stage (desktop 84% high, below the nav), only the left edge fades into the copy.
// X5 hard cut from the hero: the Crown's section is pulled up one screen (FilmPin overlap), so its stage replaces the
// hero's in place. Its film starts framed EXACTLY like the hero's last frame (the hero film at full height, y .58,
// pushed 1.06 × 1.12 → h 1.19, centre y .595, the hero's soft edges) and eases to its own place (84% high, right of the copy)
// while the ganache starts to pour: the plain cake simply carries on into the pour.
// hero end: film h 1 at y .58, scaled 1.06 (scroll push) × (1 + HOLD_PUSH) (cake hold) around the stage centre
const HERO_END = 1.06 * (1 + HOLD_PUSH);
const START = { h: HERO_END, x: 0.5, y: 0.5 + 0.08 * HERO_END, fade: { l: 0.06, r: 0.06, t: 0.1, b: 0.12 } };
const END = { h: 0.84, x: 0.66, y: 0.55, fade: { l: 0.14, r: 0.05, t: 0.025, b: 0.1 } };
const MOVE = 2.0; // video seconds the move takes
const placeFor = (onLayout, desk) => (phone) => phone
  ? {
    fit: { box: [0.02, 0, 0.98, 1], area: (c) => ({ top: NAV_GAP + 4, bottom: (within(c, ".crown-copy")?.top ?? c.clientHeight * 0.6) - 6 }) },
    fade: { t: 0.03, b: 0.08, l: 0.06, r: 0.06 },
    onLayout,
  }
  : Object.assign(desk, { onLayout });
/* M74 thrown toppings: where each cut-out lands (fractions of the stage), how big (depth) and how far it spins.
   Landing spots keep clear of the copy column on the left; three fall out of the bottom, into the counter below. */
const THROW = [
  { x: 0.9, y: 0.17, d: 1.3, r: 220 },
  { x: 0.95, y: 0.62, d: 0.85, r: -160 },
  { x: 0.82, y: 0.9, d: 1.5, r: 140 },
  { x: 0.6, y: 1.12, d: 1.15, r: -260 },
  { x: 0.44, y: 0.94, d: 0.9, r: 180 },
  { x: 0.73, y: 0.07, d: 0.7, r: -120 },
  { x: 0.99, y: 0.38, d: 1.0, r: 300 },
  { x: 0.5, y: 1.16, d: 1.4, r: -200 },
];
// phones: four toppings, landing in the top corners only (never over the heading or the cake's middle)
const PHONE_LAND = { 0: [0.12, 0.14], 1: [0.88, 0.12], 5: [0.9, 0.36], 6: [0.1, 0.38] };
export default function TheCrown() {
  const root = useRef(null);
  const film = useRef(null);
  const now = useRef(crown.throwAt + 3); // video second (static: everything landed)
  // the desktop place is one mutable object: onTime moves it from START to END (the player reads it every draw)
  const desk = useRef({ ...START, fade: { ...START.fade } }).current;
  const place = useRef(placeFor((r) => (film.current = r), desk)).current;
  /** Positions every thrown topping for video second t (+ a small time-based bob once landed, so a held frame lives). */
  const layout = (t, time) => {
    const el = root.current;
    if (!el)
      return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const phone = W < 768;
    // until the film reports where it landed (or with ?static=1), use its planned final desktop place
    const ph = H * 0.84;
    const r = film.current ?? { w: (ph * 16) / 9, h: ph, x: W * 0.66 - (ph * 8) / 9, y: H * 0.55 - ph / 2 };
    // the berries enter the film near its top centre: that is where they are thrown from
    const x0 = r.x + r.w * 0.52;
    const y0 = r.y + r.h * 0.16;
    el.querySelectorAll(".thrown").forEach((img, i) => {
      const spec = THROW[i];
      if (phone && !PHONE_LAND[i]) {
        img.style.opacity = "0";
        return;
      }
      const k = gsap.utils.clamp(0, 1, (t - crown.throwAt - i * 0.07) / 1.05);
      const e = 1 - Math.pow(1 - k, 2.2); // fast out of the film, settling as it lands
      const x2 = (phone ? PHONE_LAND[i][0] : spec.x) * W;
      const y2 = (phone ? PHONE_LAND[i][1] : spec.y) * H;
      // quadratic arc: thrown up and outward first, then down onto its spot
      const x1 = (x0 + x2) / 2 + (x2 - x0) * 0.25;
      const y1 = Math.min(y0, y2) - H * (phone ? 0.12 : 0.24);
      const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * x1 + e * e * x2;
      const bob = k >= 1 ? Math.sin(time * (1.1 + spec.d * 0.3) + i * 1.7) * 9 * spec.d : 0;
      const y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * y1 + e * e * y2 + bob;
      const sc = 0.35 + ((phone ? Math.min(spec.d, 0.9) : spec.d) - 0.35) * e;
      const rot = spec.r * e + (k >= 1 ? Math.sin(time * 0.7 + i) * 8 : 0);
      img.style.opacity = k > 0 ? String(Math.min(1, k * 6)) : "0";
      img.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
      img.style.filter = spec.d < 0.8 ? "blur(1.5px)" : "drop-shadow(0 16px 18px rgba(59,36,24,.22))";
    });
  };
  // X5: the stage is hidden while the section (pulled up one screen) slides in under the pinned hero, and appears in
  // place at the exact scroll point where the hero's pin ends: a hard cut, never a slide
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const sec = document.getElementById("crown");
    const stage = sec.querySelector(".pin-stage");
    const show = (on) => (stage.style.visibility = on ? "visible" : "hidden");
    const st = ScrollTrigger.create({ trigger: sec, start: "top top", onToggle: (self) => show(self.isActive || self.progress > 0), onRefresh: (self) => show(self.progress > 0) });
    show(st.progress > 0);
    return () => st.kill();
  }, []);
  // a ticker keeps the landed toppings bobbing while the stage is on screen (a held, scrubbed stage never freezes)
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const el = root.current;
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(el);
    const tick = (time) => {
      if (on)
        layout(now.current, time);
    };
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onTime = (t) => {
    const el = root.current;
    if (!el)
      return;
    now.current = t;
    const k = prefersReducedMotion() ? 1 : gsap.parseEase("power2.inOut")(gsap.utils.clamp(0, 1, t / MOVE));
    const lerp = (a, b) => a + (b - a) * k;
    desk.h = lerp(START.h, END.h);
    desk.x = lerp(START.x, END.x);
    desk.y = lerp(START.y, END.y);
    desk.fade = { l: lerp(START.fade.l, END.fade.l), r: lerp(START.fade.r, END.fade.r), t: lerp(START.fade.t, END.fade.t), b: lerp(START.fade.b, END.fade.b) };
    // the Crown's copy arrives after the cut, as the pour begins
    const copy = el.querySelector(".crown-copy");
    if (copy && !prefersReducedMotion()) {
      const o = gsap.utils.clamp(0, 1, (t - 0.12) / 0.8);
      copy.style.opacity = String(o);
      copy.style.transform = `translateY(${((1 - o) * 24).toFixed(1)}px)`;
    }
    if (prefersReducedMotion())
      requestAnimationFrame(() => layout(t, 0));
    let active = 0;
    crown.tags.forEach((g, i) => t >= (i ? crown.tags[i - 1].until : 0) && (active = i));
    el.querySelectorAll(".crown-tag").forEach((tag, i) => {
      tag.classList.toggle("is-on", i <= active);
      tag.classList.toggle("is-now", i === active);
    });
    const pct = Math.round(Math.min(1, Math.max(0, (t - 0.5) / 2.7)) * 100);
    const n = el.querySelector(".ganache-n");
    if (n)
      n.textContent = String(pct);
    el.querySelector(".ganache-bar")?.style.setProperty("transform", `scaleX(${pct / 100})`);
  };
  return (<FilmPin id="crown" film={films.crown} arrive={0.15} overlap place={place} onTime={onTime} loadWhen="#hero" before={<div className="film-bg absolute inset-0" />}>
    <div ref={root} className="absolute inset-0">
      <div className="container-x relative z-[2] flex h-full flex-col justify-center max-md:justify-end max-md:pb-[4svh]">
        <div className="crown-copy w-[min(28vw,400px)] max-md:w-full">
          <h2 className="font-display text-[clamp(56px,7vw,120px)] max-md:text-[52px]">
            {crown.title[0]} <span className="text-[color:var(--straw)]">{crown.title[1]}</span>
          </h2>
          <p className="mt-4 max-w-[36ch] text-[15px] leading-[1.55] text-muted max-md:mt-2 max-md:text-[14px]">{crown.sub}</p>
          <ol className="mt-7 grid gap-2 max-md:mt-4 max-md:grid-cols-3">
            {crown.tags.map((g) => (<li key={g.id} className={`crown-tag is-on tone-${g.tone} flex items-baseline gap-3 border-[1.5px] border-[var(--choc)] px-4 py-3 max-md:flex-col max-md:gap-0 max-md:px-2.5 max-md:py-2`}>
              <span className="font-display text-[26px] max-md:text-[20px]">{g.name}</span>
              <span className="text-[13px] leading-snug text-muted max-md:text-[12px]">{g.note}</span>
            </li>))}
          </ol>
          <div className="mt-6 flex items-center gap-3 max-md:hidden">
            <span className="label text-muted">Ganache</span>
            <span className="relative block h-[6px] w-[160px] bg-[rgba(59,36,24,0.15)]">
              <span className="ganache-bar absolute inset-0 block origin-left bg-[var(--choc)]" />
            </span>
            <span className="label tabular-nums">
              <span className="ganache-n">100</span>%
            </span>
          </div>
        </div>
      </div>
      {/* thrown toppings (M74): same cut-outs as the film's berries + macarons; hidden until Round 2 throws them */}
      <div className="crown-thrown pointer-events-none absolute inset-0 z-[3]" aria-hidden>
        {toppings.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="thrown absolute left-0 top-0 w-[clamp(52px,6.4vw,104px)] opacity-0 will-change-transform" data-i={i} />))}
      </div>
    </div>
  </FilmPin>);
}
