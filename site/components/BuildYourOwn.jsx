"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, isRecording, loadPlugin, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { builder, inr, img } from "../content";
import { order } from "../cart";
// "Build your own" (PS07 three-step configurator → four steps · Motion map M53 SVG shape morph).
// Left: an illustrated cake on a pink stand. The cake is its TOP SHAPE (round / heart / square) drawn in an oblique
// view and stacked ~80 times from the plate up, each slice in its layer's colour (sponge · jam · cream), so the sides
// show real layers with soft left-to-right shading. One <path id="cake-shape"> feeds every slice through <use>, so a
// single MorphSVG tween morphs the whole cake round → heart → square. Finish: cream (piped rosettes) · ganache drip
// (dark glossy top, drips clipped to the cake's silhouette) · berry crown (the site's strawberry, raspberry and
// macaron cut-outs). Sponge colour cross-fades; size scales the cake on its stand.
// Right: four rows of option chips, a live ₹ total and Add to order. ?record=1 only: one chip per row is clicked in
// order (Heart → Chocolate → Berry crown → 1 kg), then Add to order flies the cake into the Order pill; normal
// visits change only when the visitor clicks.
// Phone: cake on top, steps as rows. ?static=1: the default cake (round, vanilla, cream, ½ kg = ₹525, the counter tile's "from" price).
export const SHAPES = {
  Round: "M100,20 C144,20 180,56 180,100 C180,144 144,180 100,180 C56,180 20,144 20,100 C20,56 56,20 100,20 Z",
  Heart: "M100,182 C70,160 18,128 18,78 C18,46 42,24 70,24 C86,24 96,34 100,46 C104,34 114,24 130,24 C158,24 182,46 182,78 C182,128 130,160 100,182 Z",
  Square: "M40,26 C80,26 120,26 160,26 C168,26 174,32 174,40 C174,80 174,120 174,160 C174,168 168,174 160,174 C120,174 80,174 40,174 C32,174 26,168 26,160 C26,120 26,80 26,40 C26,32 32,26 40,26 Z",
};
const SPONGE = { Vanilla: ["#f3cf86", "#d99f4e"], Chocolate: ["#8a5236", "#4e2a17"], Pistachio: ["#c4d996", "#8ea95c"] };
export const priceOf = (p) => {
  const [shape, sponge, finish, size] = builder.steps;
  const per = builder.base + shape.add[p.shape] + sponge.add[p.sponge] + finish.add[p.finish];
  return Math.round((per * size.mult[p.size]) / 10) * 10;
};
/* geometry (viewBox 420 × 400): the cake's oblique top is the 200×200 shape scaled (1.3, 0.48) around its centre */
const CX = 210;
const BASE = 262; // centre of the cake's bottom face (on the plate)
const HB = 116; // cake height
const SX = 1.3;
const SY = 0.48;
const slice = (y) => `translate(${CX} ${y}) scale(${SX} ${SY}) translate(-100 -100)`;
/** layer bands from the plate up: [from, to, fill] */
const BANDS = [
  [0, 30, "url(#g-sponge)"],
  [30, 35, "url(#g-jam)"],
  [35, 41, "url(#g-cream)"],
  [41, 70, "url(#g-sponge)"],
  [70, 75, "url(#g-jam)"],
  [75, 81, "url(#g-cream)"],
  [81, 110, "url(#g-sponge)"],
  [110, HB, "url(#g-cream)"],
];
const STEPS = Array.from({ length: Math.round(HB / 1.5) + 1 }, (_, i) => Math.min(HB, i * 1.5));
const fillAt = (h, ganache) => (ganache && h >= 104 ? "url(#g-ganache)" : BANDS.find(([a, b]) => h >= a && h < b + 0.01)[2]);
// ganache drips: x offset from the centre, length (fixed, so the illustration is the same on every render)
const DRIPS = [-112, -98, -84, -70, -56, -42, -28, -14, 0, 14, 28, 42, 56, 70, 84, 98, 112].map((x, i) => ({ x, len: 18 + ((i * 37) % 7) * 7 }));
const CROWN = [
  { src: "top-1.webp", x: -62, y: -16, w: 46 },
  { src: "top-3.webp", x: -22, y: -30, w: 50 },
  { src: "top-8.webp", x: 12, y: -22, w: 34 },
  { src: "top-4.webp", x: 40, y: -30, w: 52 },
  { src: "top-2.webp", x: 70, y: -12, w: 44 },
  { src: "top-8.webp", x: -36, y: -2, w: 30 },
  { src: "top-1.webp", x: 18, y: 2, w: 44 },
];
const ROSETTES = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return { x: Math.cos(a) * 84, y: Math.sin(a) * 30 };
}).sort((p, q) => p.y - q.y);
export function CakeDiagram({ pick }) {
  const [shapeStep, spongeStep, finishStep] = builder.steps;
  const shape = shapeStep.options[pick.shape];
  const [sLight, sDark] = SPONGE[spongeStep.options[pick.sponge]];
  const finish = finishStep.options[pick.finish];
  const ganache = finish === "Ganache drip";
  const crown = finish === "Berry crown";
  const scale = [0.86, 1, 1.12][pick.size];
  const root = useRef(null);
  const first = useRef(true);
  const TOP = BASE - HB;
  // M53: one MorphSVG tween on the shared path morphs every slice, the top and the clip at once
  useEffect(() => {
    const path = root.current?.querySelector("#cake-shape");
    if (!path)
      return;
    if (first.current || prefersReducedMotion()) {
      first.current = false;
      path.setAttribute("d", SHAPES[shape]);
      return;
    }
    let dead = false;
    loadPlugin("MorphSVGPlugin").then(() => {
      if (!dead)
        gsap.to(path, { morphSVG: { shape: SHAPES[shape], type: "rotational" }, duration: 0.75, ease: "power2.inOut" });
    });
    return () => {
      dead = true;
    };
  }, [shape]);
  // the cake floats gently on its stand while the builder is on screen (a held demo frame never stands still)
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const svg = root.current;
    const cake = svg.querySelector(".cake-float");
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(svg);
    const tick = (time) => {
      if (on && cake)
        cake.setAttribute("transform", `translate(0 ${(Math.sin(time * 2.1) * 6 - 3).toFixed(2)})`);
    };
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);
  // the finish arrives: drips run down from the rim, berries drop onto the top, rosettes pipe on in turn
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const el = root.current;
    if (ganache)
      gsap.fromTo(el.querySelectorAll(".drip"), { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: "power2.out", stagger: 0.025, transformOrigin: "50% 0%" });
    if (crown)
      gsap.fromTo(el.querySelectorAll(".crown-item"), { y: -46, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out", stagger: 0.05 });
    if (!ganache && !crown)
      gsap.fromTo(el.querySelectorAll(".rosette"), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.03, transformOrigin: "50% 50%" });
  }, [ganache, crown]);
  return (<svg ref={root} viewBox="0 0 420 400" className="h-full w-full overflow-visible" aria-label={`${shape} ${spongeStep.options[pick.sponge]} cake, ${finish}, ${builder.steps[3].options[pick.size]}`}>
    <defs>
      <path id="cake-shape" d={SHAPES.Round} />
      {/* soft daylight from the left: every slice is light on the left, deeper on the right */}
      <linearGradient id="g-sponge" x1="0" x2="1">
        <stop offset="0" style={{ stopColor: sLight, transition: "stop-color .5s" }} />
        <stop offset="0.6" style={{ stopColor: sLight, transition: "stop-color .5s" }} />
        <stop offset="1" style={{ stopColor: sDark, transition: "stop-color .5s" }} />
      </linearGradient>
      <linearGradient id="g-jam" x1="0" x2="1">
        <stop offset="0" stopColor="#e2475f" />
        <stop offset="1" stopColor="#9f1f39" />
      </linearGradient>
      <linearGradient id="g-cream" x1="0" x2="1">
        <stop offset="0" stopColor="#fffaf2" />
        <stop offset="0.65" stopColor="#f6ead9" />
        <stop offset="1" stopColor="#e2cdb4" />
      </linearGradient>
      <linearGradient id="g-ganache" x1="0" x2="1">
        <stop offset="0" stopColor="#6b3a22" />
        <stop offset="1" stopColor="#2a140a" />
      </linearGradient>
      <radialGradient id="g-top-cream" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#fffdf8" />
        <stop offset="1" stopColor="#efdfc9" />
      </radialGradient>
      <radialGradient id="g-top-ganache" cx="0.38" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#7a4429" />
        <stop offset="0.45" stopColor="#3d1f10" />
        <stop offset="1" stopColor="#24120a" />
      </radialGradient>
      <linearGradient id="g-stand" x1="0" x2="1">
        <stop offset="0" stopColor="#fbe1e5" />
        <stop offset="0.55" stopColor="#f2c3ca" />
        <stop offset="1" stopColor="#d99aa5" />
      </linearGradient>
      <radialGradient id="g-shadow">
        <stop offset="0" stopColor="rgba(59,36,24,.28)" />
        <stop offset="1" stopColor="rgba(59,36,24,0)" />
      </radialGradient>
      <clipPath id="cake-clip">
        {STEPS.filter((_, i) => i % 4 === 0).map((h) => (<use key={h} href="#cake-shape" transform={slice(BASE - h)} />))}
        <use href="#cake-shape" transform={slice(TOP)} />
      </clipPath>
    </defs>

    {/* stand */}
    <ellipse cx={CX} cy="368" rx="150" ry="16" fill="url(#g-shadow)" />
    <path d="M186 296 C190 330 170 350 150 356 L270 356 C250 350 230 330 234 296 Z" fill="url(#g-stand)" />
    <ellipse cx={CX} cy="356" rx="60" ry="9" fill="#e3a9b2" />
    <ellipse cx={CX} cy={BASE + 14} rx="166" ry="46" fill="#d99aa5" />
    <ellipse cx={CX} cy={BASE + 6} rx="166" ry="46" fill="url(#g-stand)" />
    <ellipse cx={CX - 40} cy={BASE - 8} rx="90" ry="18" fill="rgba(255,255,255,.35)" />

    <g className="cake-float">
      <g style={{ transform: `scale(${scale})`, transformOrigin: `${CX}px ${BASE + 20}px`, transition: "transform .6s cubic-bezier(.22,1,.36,1)" }}>
        {/* contact shadow on the plate */}
        <use href="#cake-shape" transform={slice(BASE + 6)} fill="rgba(59,36,24,.18)" />
        {/* the layers: one slice of the top shape every 1.5 units, coloured by band */}
        {STEPS.map((h) => (<use key={h} href="#cake-shape" transform={slice(BASE - h)} fill={fillAt(h, ganache)} />))}
        {ganache && (<g clipPath="url(#cake-clip)">
          {DRIPS.map((d) => (<rect key={d.x} className="drip" x={CX + d.x * (SX / 1.3) - 5} y={TOP - 4} width="10" height={52 + d.len * 1.3} rx="5" fill="url(#g-ganache)" />))}
        </g>)}
        {/* the top face */}
        <use href="#cake-shape" transform={slice(TOP)} fill={ganache ? "url(#g-top-ganache)" : "url(#g-top-cream)"} />
        {ganache && <ellipse cx={CX - 34} cy={TOP - 10} rx="44" ry="9" fill="rgba(255,255,255,.18)" />}
        {!ganache && !crown &&
          ROSETTES.map((r, i) => (<g key={i} className="rosette" transform={`translate(${CX + r.x} ${TOP + r.y})`}>
            <ellipse cx="0" cy="3" rx="11" ry="5" fill="rgba(59,36,24,.12)" />
            <circle r="9" fill="url(#g-top-cream)" stroke="#e8d6c0" strokeWidth="1" />
            <path d="M-5 -2 Q0 -9 5 -2 Q0 2 -5 -2 Z" fill="#fff" opacity=".8" />
          </g>))}
        {crown &&
          CROWN.map((c, i) => (<image key={i} className="crown-item" href={img(c.src)} x={CX + c.x - c.w / 2} y={TOP + c.y - c.w * 0.75} width={c.w} height={c.w} preserveAspectRatio="xMidYMax meet" />))}
      </g>
    </g>
  </svg>);
}
/** the record-mode demo: ONE choice per row, in order, like a customer (no looping, no going back) */
const DEMO = [
  ["shape", 1], // Heart
  ["sponge", 1], // Chocolate
  ["finish", 2], // Berry crown
  ["size", 1], // 1 kg
];
const STEP = 0.68;
export default function BuildYourOwn() {
  const [pick, setPick] = useState({ shape: 0, sponge: 0, finish: 0, size: 0 });
  const total = priceOf(pick);
  const root = useRef(null);
  const shown = useRef(total);
  // the total rolls to its new value (never a jump cut)
  useEffect(() => {
    const el = root.current?.querySelector(".build-total");
    if (!el)
      return;
    if (prefersReducedMotion()) {
      el.textContent = inr(total);
      return;
    }
    const o = { v: shown.current };
    const tw = gsap.to(o, { v: total, duration: 0.45, ease: "power2.out", onUpdate: () => (el.textContent = inr(Math.round(o.v / 10) * 10)) });
    shown.current = total;
    return () => {
      tw.kill();
    };
  }, [total]);
  // ?record=1 only (on camera nobody clicks): once the section is on screen, one chip per row is clicked in order.
  // Each click presses its chip first, then the cake morphs / recolours / gets its crown, then the price rolls.
  // Normal visits: nothing changes by itself; the cake only changes when the visitor clicks a chip.
  useEffect(() => {
    if (prefersReducedMotion() || !isRecording())
      return;
    const el = root.current;
    const timers = [];
    const play = () => DEMO.forEach(([step, opt], i) => {
      const at = (0.1 + i * STEP) * 1000;
      timers.push(window.setTimeout(() => {
        const chip = el.querySelector(`.chip[data-step="${step}"][data-opt="${opt}"]`);
        if (chip)
          gsap.fromTo(chip, { scale: 0.9 }, { scale: 1, duration: 0.35, ease: "power3.out" });
      }, at), window.setTimeout(() => setPick((p) => ({ ...p, [step]: opt })), at + 120));
    });
    // ...and like a customer, it then presses "Add to order": the finished cake flies into the Order pill (F8)
    const add = () => {
      const btn = el.querySelector(".build-add");
      const cake = el.querySelector(".build-diagram svg");
      const pill = document.querySelector(".order-pill");
      if (btn)
        gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.45, ease: "power3.out" });
      if (!cake || !pill)
        return order.add("Custom cake");
      const r = cake.getBoundingClientRect();
      const p = pill.getBoundingClientRect();
      const clone = cake.cloneNode(true);
      Object.assign(clone.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, zIndex: "80", pointerEvents: "none", transformOrigin: "50% 50%" });
      document.body.appendChild(clone);
      const dx = p.left + p.width / 2 - (r.left + r.width / 2);
      const dy = p.top + p.height / 2 - (r.top + r.height / 2);
      gsap
        .timeline({ onComplete: () => (clone.remove(), order.add("Custom cake")) })
        .to(clone, { y: -50, scale: 0.85, duration: 0.3, ease: "power2.out" })
        .to(clone, { x: dx, y: dy, scale: 0.08, duration: 0.75, ease: "power3.in" })
        .to(clone, { opacity: 0, duration: 0.12 }, "-=0.1");
    };
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 70%",
      once: true,
      onEnter: () => {
        play();
        // Add is pressed as the last choice finishes growing the cake (no still beat between them)
        timers.push(window.setTimeout(add, (0.1 + (DEMO.length - 1) * STEP + 0.5) * 1000));
      },
    });
    return () => {
      st.kill();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  return (<section ref={root} id="build" data-record-time="0.9" data-record-hold="3" data-record-label="build" data-hold-push=".build-diagram" className="relative bg-[var(--pink)] py-[clamp(72px,11vh,120px)]">
    <div className="step-edge" style={{ ["--step-c"]: "var(--pink)" }} />
    <div className="container-x grid grid-cols-[1fr_1.05fr] items-center gap-[clamp(32px,5vw,90px)] max-md:grid-cols-1 max-md:gap-6">
      <div className="build-diagram relative aspect-[420/400] w-full border-[1.5px] border-[var(--choc)] bg-[var(--paper)] p-[6%] max-md:p-[5%]">
        <CakeDiagram pick={pick} />
        <p className="label absolute bottom-3 left-4 text-muted">Your cake, to scale</p>
      </div>
      <div>
        <h2 className="font-display text-[clamp(44px,5vw,88px)] max-md:text-[42px]">{builder.title}</h2>
        <p className="mt-3 text-[15px] leading-[1.55] text-muted">{builder.sub}</p>
        <ol className="mt-7 grid gap-3 max-md:mt-5">
          {builder.steps.map((step, si) => (<li key={step.id} className="grid grid-cols-[110px_1fr] items-center gap-3 border-t-[1.5px] border-[var(--choc)] pt-3 max-md:grid-cols-1 max-md:gap-2">
            <span className="flex items-baseline gap-2">
              <span className="label text-muted">{si + 1}</span>
              <span className="font-display text-[24px]">{step.name}</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {step.options.map((o, oi) => (<button key={o} type="button" data-step={step.id} data-opt={oi} aria-pressed={pick[step.id] === oi} onClick={() => setPick((p) => ({ ...p, [step.id]: oi }))} className="chip border-[1.5px] border-[var(--choc)] px-3.5 py-2 text-[14px] font-medium aria-pressed:bg-[var(--choc)] aria-pressed:text-[var(--paper)]" data-cursor="Pick">
                {o}
              </button>))}
            </div>
          </li>))}
        </ol>
        <div className="mt-6 flex items-center justify-between gap-4 border-t-[1.5px] border-[var(--choc)] pt-5">
          <p>
            <span className="label block text-muted">Total</span>
            <span className="build-total font-display text-[clamp(36px,3.4vw,56px)] tabular-nums">{inr(priceOf({ shape: 0, sponge: 0, finish: 0, size: 0 }))}</span>
          </p>
          <button type="button" className="btn btn-solid build-add" onClick={() => order.add("Custom cake")} data-cursor="Add" data-mag>
            <span className="mag-label">Add to order</span>
          </button>
        </div>
      </div>
    </div>
  </section>);
}
