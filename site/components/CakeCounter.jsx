"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, isRecording, loadPlugin, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { cakes, counter, counterSmall, inr, toppings } from "../content";
import { order } from "../cart";
// "The Counter" cake menu (GL19 make-way expanding grid as a bakery counter · Motion map M54 Flip layout morph + F7/F8).
// A FIXED grid (5 columns): the big "on the stand" ticket (2×2) shows the featured cake large; the four cakes sit as
// small C9 tickets that never move (Nº, cut-out, ₹ per kg, Add); a tall chocolate "Build your own" ticket closes the
// row. Every 2.2 s the next cake is featured: a strawberry frame glides to its small ticket (Flip, the M54 move) and the
// big ticket's cake + text change in place (text away ≈ 0.3 s, so labels read ~85% of the time). No tile ever leaves
// the grid, nothing overlaps any text. F8: the featured cake flies into the Order pill once. F7: the thrown toppings
// float around the heading. Phone: 2 columns, one featured cake, no auto-change. ?static=1: Chocolate Crown featured.
const FLOAT = [
  { i: 0, x: 8, y: 6, d: 1.1 },
  { i: 3, x: 26, y: -18, d: 0.75 },
  { i: 4, x: 44, y: 14, d: 0.45 },
  { i: 1, x: 66, y: -22, d: 1.1 },
  { i: 7, x: 86, y: 0, d: 0.75 },
  { i: 5, x: 98, y: -30, d: 0.45 },
];
/** F8: a copy of the cake flies out of its tile on a short up-arc into the nav's Order pill (Flip.fit), then the count bumps. */
async function flyToOrder(from, onLand) {
  const pill = document.querySelector(".order-pill");
  if (!pill)
    return onLand();
  const Flip = await loadPlugin("Flip");
  const r = from.getBoundingClientRect();
  const clone = from.cloneNode(true);
  Object.assign(clone.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, transform: "none", zIndex: "80", pointerEvents: "none", objectFit: "contain" });
  document.body.appendChild(clone);
  gsap
    .timeline({ onComplete: () => (clone.remove(), onLand()) })
    .to(clone, { y: -70, scale: 0.9, duration: 0.3, ease: "power2.out" })
    .add(Flip.fit(clone, pill, { duration: 0.8, ease: "power3.in", scale: true, absolute: true }))
    .to(clone, { opacity: 0, duration: 0.15 }, "-=0.12");
}
const EVERY = 2.2; // seconds between featured cakes
export default function CakeCounter() {
  const [open, setOpen] = useState(0);
  const root = useRef(null);
  const flip = useRef(null);
  const snap = useRef(null);
  const flown = useRef(false);
  /** M54: the featured cake changes. Its big ticket's text dips out (0.12 s), the content changes, the strawberry
   *  frame glides to the newly featured small ticket (Flip), and the big cake + text arrive back in (0.18 s). */
  const bigText = () => root.current.querySelectorAll(".feat-text");
  const openTile = (i) => {
    if (!flip.current || !root.current || prefersReducedMotion())
      return setOpen(i);
    gsap.to(bigText(), {
      opacity: 0,
      y: -6,
      duration: 0.12,
      ease: "power1.in",
      overwrite: true,
      onComplete: () => {
        snap.current = flip.current.getState(root.current.querySelector(".feat-frame"));
        setOpen(i);
      },
    });
  };
  useEffect(() => {
    if (!root.current)
      return;
    if (snap.current && flip.current)
      flip.current.from(snap.current, { duration: 0.6, ease: "power3.inOut" });
    snap.current = null;
    if (prefersReducedMotion())
      return;
    gsap.fromTo(bigText(), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out", overwrite: true });
    gsap.fromTo(root.current.querySelector(".feat-img"), { opacity: 0, scale: 0.94, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out" });
    // ticket tear (detail): the featured ticket's stub tips open from its left notch and settles back, by itself
    gsap.fromTo(root.current.querySelector(".feat-tile .ticket-stub"), { rotate: 0 }, { rotate: -1.6, y: 2, duration: 0.3, ease: "power2.out", yoyo: true, repeat: 1, delay: 0.25 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const addFlying = (i) => {
    const img = root.current?.querySelector(".feat-img");
    if (!img || prefersReducedMotion())
      return order.add(cakes[i].name);
    flyToOrder(img, () => order.add(cakes[i].name));
  };
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const el = root.current;
    loadPlugin("Flip").then((F) => (flip.current = F));
    // hands-free (on camera nobody hovers): while the counter is on screen the next cake opens every 1.5 s (labels
    // readable for ~0.6 s between moves); the open cake floats gently meanwhile
    let on = false;
    let k = 0;
    const step = () => {
      if (!on || innerWidth < 768)
        return;
      k = (k + 1) % cakes.length;
      openTile(k);
    };
    let first = 0;
    const io = new IntersectionObserver(([e]) => {
      const was = on;
      on = e.intersectionRatio > 0.35;
      // the first change comes right as the counter arrives (no still wait), then every EVERY seconds
      if (on && !was)
        first = window.setTimeout(step, 250);
    }, { threshold: [0, 0.35, 0.6] });
    io.observe(el);
    // phones keep one featured cake (no auto-change)
    const id = window.setInterval(step, EVERY * 1000);
    // F8 once by itself: in record mode on the counter's hold, otherwise the first time it is well in view
    const fly = () => {
      if (flown.current)
        return;
      flown.current = true;
      window.setTimeout(() => addFlying(k), 900);
    };
    const onHold = (e) => e.target === el && fly();
    document.addEventListener("record:hold", onHold);
    const st = isRecording() ? null : ScrollTrigger.create({ trigger: el, start: "top 35%", once: true, onEnter: fly });
    // F7: the thrown toppings float at three depths (bob + scroll parallax, deeper = slower)
    const floats = gsap.utils.toArray(".float-top", el);
    const tick = (time) => {
      if (!on && !isNear())
        return;
      // the featured cake floats and turns very slightly on its stand (never a still hold between changes)
      const openImg = el.querySelector(".feat-img");
      if (openImg) {
        openImg.style.translate = `0 ${(Math.sin(time * 2.2) * 9).toFixed(1)}px`;
        openImg.style.rotate = `${(Math.sin(time * 1.3) * 2.2).toFixed(2)}deg`;
      }
      const y = el.getBoundingClientRect().top;
      floats.forEach((f, i) => {
        const d = Number(f.dataset.d);
        const bob = Math.sin(time * (0.9 + d * 0.5) + i * 1.9) * 10 * d;
        const par = y * -0.08 * d;
        f.style.transform = `translate(-50%,-50%) translateY(${(bob + par).toFixed(1)}px) rotate(${(Math.sin(time * 0.6 + i) * 14).toFixed(1)}deg) scale(${d})`;
      });
    };
    const isNear = () => {
      const r = el.getBoundingClientRect();
      return r.bottom > -100 && r.top < innerHeight + 100;
    };
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      window.clearInterval(id);
      window.clearTimeout(first);
      document.removeEventListener("record:hold", onHold);
      st?.kill();
      gsap.ticker.remove(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (<section ref={root} id="counter" data-record-time="0.9" data-record-hold="3" data-record-label="counter" data-hold-push=".counter-grid" className="relative bg-[var(--cream)] pb-[clamp(56px,8vh,96px)] pt-[clamp(84px,12vh,120px)]">
    <div className="step-edge" style={{ ["--step-c"]: "var(--cream)" }} />
    <div className="container-x">
      <div className="counter-head relative grid grid-cols-[1.1fr_1fr] items-end gap-8 pb-8 max-md:grid-cols-1 max-md:gap-3 max-md:pb-6">
        <div>
          <p className="label text-[color:var(--straw)]">Today&apos;s counter</p>
          <h2 className="font-display mt-3 text-[clamp(44px,5.4vw,92px)] max-md:text-[42px]">{counter.title}</h2>
        </div>
        <p className="max-w-[40ch] justify-self-end pb-2 text-[15px] leading-[1.55] text-muted max-md:justify-self-start">{counter.sub}</p>
        {/* F7 floating toppings (static positions; idle bob + scroll parallax in Round 2) */}
        <div className="counter-float pointer-events-none absolute left-[46%] right-0 top-[-30px] h-[60px] max-md:hidden" aria-hidden>
          {FLOAT.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f.i} src={toppings[f.i]} alt="" data-d={f.d} className="float-top absolute w-[clamp(40px,5vw,84px)]" style={{ left: `${f.x}%`, top: `${f.y}%`, transform: `translate(-50%,-50%) scale(${f.d})`, filter: f.d < 0.6 ? "blur(1.5px)" : "drop-shadow(0 10px 12px rgba(59,36,24,.18))" }} />))}
        </div>
      </div>

      <div className="counter-grid grid grid-cols-5 gap-3 [grid-template-rows:repeat(2,clamp(190px,25vh,250px))] max-md:grid-cols-2 max-md:[grid-template-rows:none] max-md:[grid-auto-rows:220px]">
        {/* the big "on the stand" ticket: the featured cake, large */}
        <article className={`ticket feat-tile tone-${cakes[open].tone} col-span-2 row-span-2 border-[1.5px] border-[var(--choc)] max-md:row-span-2`} data-cursor="Add">
          <div className="relative min-h-0 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={cakes[open].no} src={cakes[open].img} alt={cakes[open].name} className="feat-img absolute left-[50%] top-[4%] h-[94%] w-auto -translate-x-1/2 object-contain" />
            <span className="feat-text label absolute left-4 top-4">On the stand · Nº {cakes[open].no}</span>
          </div>
          <div className="ticket-stub flex items-end justify-between gap-4 px-5 py-4" style={{ ["--notch"]: "var(--cream)" }}>
            <div className="feat-text min-w-0">
              <h3 className="font-display text-[clamp(28px,2.6vw,44px)]">{cakes[open].name}</h3>
              <p className="mt-1 max-w-[46ch] text-[13px] leading-snug text-muted">{cakes[open].note}</p>
              <p className="mt-1 text-[15px] font-semibold tabular-nums">
                {inr(cakes[open].price)} <span className="text-[12px] font-medium text-muted">{cakes[open].kg}</span>
              </p>
            </div>
            <button type="button" className="ticket-add shrink-0" onClick={() => addFlying(open)}>
              Add
            </button>
          </div>
        </article>

        {/* the four cakes as small tickets: fixed places, always readable */}
        {cakes.map((c, i) => (<article key={c.no} className={`ticket cake-tile tone-${c.tone} relative border-[1.5px] border-[var(--choc)]`} onMouseEnter={() => open !== i && openTile(i)} data-cursor="Show">
          {open === i && <span aria-hidden data-flip-id="feat-frame" className="feat-frame pointer-events-none absolute -inset-[5px] z-[2] border-[3px] border-[var(--straw)]" />}
          <div className="relative min-h-0 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.img} alt={c.name} className={`cake-img absolute left-1/2 top-1/2 h-[90%] w-auto -translate-x-1/2 -translate-y-1/2 object-contain transition-opacity duration-300 ${open === i ? "opacity-40" : ""}`} />
            <span className="label absolute left-3 top-3">Nº {c.no}</span>
          </div>
          <div className="ticket-stub flex items-end justify-between gap-2 px-3 py-2.5" style={{ ["--notch"]: "var(--cream)" }}>
            <div className="min-w-0">
              <h3 className="font-display text-[19px] leading-[1.05] md:truncate max-md:text-[18px]">{c.name}</h3>
              <p className="mt-0.5 text-[13px] font-semibold tabular-nums">
                {inr(c.price)} <span className="text-[12px] font-medium text-muted">{c.kg}</span>
              </p>
            </div>
            <button type="button" className="ticket-add shrink-0 !px-2.5" onClick={() => addFlying(i)} data-add={c.no}>
              Add
            </button>
          </div>
        </article>))}

        <a href="#build" style={{ color: "var(--paper)" }} className="ticket build-teaser col-start-5 row-span-2 row-start-1 justify-between bg-[var(--choc)] p-4 text-[color:var(--paper)] max-md:col-span-2 max-md:col-start-auto max-md:row-span-1 max-md:row-start-auto" data-cursor="Build">
          <span className="label text-[color:var(--pink)]">Nº 05 · yours</span>
          <span className="font-display text-[clamp(26px,2.2vw,38px)] text-[color:var(--paper)]">Build your own cake →</span>
          <span className="text-[13px] leading-snug text-[color:rgba(255,250,243,0.75)]">Shape, sponge, finish, size. From ₹525.</span>
        </a>
      </div>

      <ul className="mt-3 grid grid-cols-4 gap-3 max-md:grid-cols-2">
        {counterSmall.map((s, i) => (<li key={s.name} className="ticket tone-cream flex-row items-center justify-between border-[1.5px] border-[var(--choc)] px-4 py-3 max-md:flex-col max-md:items-start max-md:gap-1 max-md:px-3">
          <span className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={toppings[[1, 3, 0, 5][i]]} alt="" className="h-8 w-8 object-contain" />
            <span className="text-[14px] font-semibold leading-tight">{s.name}</span>
          </span>
          <span className="text-[14px] tabular-nums max-md:pl-11">{s.price}</span>
        </li>))}
      </ul>
    </div>
  </section>);
}
