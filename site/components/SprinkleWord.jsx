"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
// Footer wordmark (Motion map M45 particle text), a site copy of components/fx/text.tsx ParticleText:
//  - the dots are sprinkles: short rounded dashes in pink, pistachio, cream and gold, each at its own angle
//  - they gather as soon as the footer enters: progress 0 when its top meets the bottom of the screen, 1 after the
//    first 30% of a screen of scrolling (the word is formed long before the page comes to rest, never a dusty band)
//  - at rest a light wave keeps running through the word (sprinkles brighten and lift as it passes), so the
//    last screen of the reel always moves (lesson 35)
// ?static=1: the formed word as type (VisitFooter shows .particle-static).
const dprOf = () => Math.min(devicePixelRatio || 1, 2);
const COLORS = ["#f7cdd3", "#f7cdd3", "#cfe0b4", "#fffaf3", "#e9b949"];
export default function SprinkleWord({ text, className = "" }) {
  const root = useRef(null);
  const canvas = useRef(null);
  useEffect(() => {
    const c = canvas.current;
    const el = root.current;
    let dots = [];
    let prog = prefersReducedMotion() ? 1 : 0;
    const build = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      const o = document.createElement("canvas");
      o.width = c.width;
      o.height = c.height;
      const ox = o.getContext("2d");
      const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-display-family") || "sans-serif";
      let size = c.height * 0.78;
      ox.font = `800 ${size}px ${fam}`;
      const tw = ox.measureText(text).width;
      if (tw > c.width * 0.94)
        size *= (c.width * 0.94) / tw;
      ox.font = `800 ${size}px ${fam}`;
      ox.textAlign = "center";
      ox.textBaseline = "middle";
      ox.fillText(text, c.width / 2, c.height / 2);
      const data = ox.getImageData(0, 0, o.width, o.height).data;
      const small = r.width < 600;
      const step = Math.max(3, Math.round((small ? 3.4 : 3.6) * dpr));
      const out = [];
      for (let y = 0; y < o.height; y += step)
        for (let x = 0; x < o.width; x += step)
          if (data[(y * o.width + x) * 4 + 3] > 128)
            out.push({
              x: x + (Math.random() - 0.5) * step * 0.6,
              y: y + (Math.random() - 0.5) * step * 0.6,
              sx: Math.random() * c.width,
              sy: c.height * (0.2 + Math.random() * 1.6),
              ph: Math.random() * 6.28,
              a: Math.random() * Math.PI,
              c: COLORS[Math.floor(Math.random() * COLORS.length)],
            });
      dots = out;
      draw(performance.now() / 1000);
    };
    const draw = (t) => {
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      const e = gsap.parseEase("power3.out")(prog);
      const dpr = dprOf();
      const len = Math.max(c.width / 300, (c.width / dpr < 600 ? 7 : 3) * dpr);
      const wid = Math.max(1.6 * dpr, len * 0.42);
      ctx.lineCap = "round";
      ctx.lineWidth = wid;
      // the light wave: a band travelling left → right through the word every 1.8 s; sprinkles lift and turn white in it
      const wave = ((t / 1.3) % 1) * 1.4 - 0.2; // always somewhere inside the word
      for (const d of dots) {
        const w = Math.max(0, 1 - Math.abs(d.x / c.width - wave) / 0.2);
        const jx = Math.sin(t * 2 + d.ph) * 2;
        const jy = Math.cos(t * 1.7 + d.ph) * 2 - w * 14 * dprOf();
        const x = d.sx + (d.x - d.sx) * e + jx;
        const y = d.sy + (d.y - d.sy) * e + jy;
        const ang = d.a + (1 - e) * 4 + t * 0.4 * (1 - e);
        ctx.globalAlpha = Math.min(1, (0.3 + 0.5 * e) * (0.8 + 0.2 * Math.sin(t * 3 + d.ph)) + w * 0.6);
        ctx.strokeStyle = w > 0.35 ? "#ffffff" : d.c;
        // in the wave the sprinkles swell (longer, thicker): a band of light reads even on a small, far-away screen
        const sw = c.width / dpr < 600 ? 0.3 : 1; // small screens: a gentler swell (the bigger phone sprinkles would blob)
        const L = len * (1 + w * 0.9 * sw) * 0.5;
        ctx.lineWidth = wid * (1 + w * 0.8 * sw);
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(ang) * L, y - Math.sin(ang) * L);
        ctx.lineTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    build();
    document.fonts?.ready.then(build);
    const ro = new ResizeObserver(build);
    ro.observe(c);
    if (prefersReducedMotion())
      return () => ro.disconnect();
    const footer = el.closest("footer") ?? el;
    const st = ScrollTrigger.create({
      trigger: footer,
      start: "top bottom",
      end: () => `top ${Math.round(innerHeight * 0.7)}px`,
      onUpdate: (s) => (prog = s.progress),
      onRefresh: (s) => (prog = s.progress),
    });
    let on = false;
    const io = new IntersectionObserver(([en]) => (on = en.isIntersecting), { rootMargin: "120px" });
    io.observe(c);
    const tick = (t) => {
      if (on)
        draw(t);
    };
    gsap.ticker.add(tick);
    return () => {
      ro.disconnect();
      st.kill();
      io.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [text]);
  return (<div ref={root} className={className} aria-label={text} role="img">
    <canvas ref={canvas} className="h-full w-full" />
  </div>);
}
