"use client";
import { useEffect, useRef, useState } from "react";
import { getManifest, loadFrames } from "@/lib/frames";
import { loading } from "@/lib/loading";
/** Pinned scroll length per record second, so hand scrolling and ?record=1 feel alike. */
export const PIN_VH_PER_SEC = 55;
/** Phone nav height + a small gap: the top of every phone area. */
export const NAV_GAP = 66;
/** Position of an element inside the canvas, in CSS px (both move together, pinned or not). */
export const within = (canvas, sel) => {
  const el = canvas.parentElement?.querySelector(sel);
  const c = canvas.getBoundingClientRect();
  if (!el)
    return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - c.top, bottom: r.bottom - c.top, left: r.left - c.left, right: r.right - c.left };
};
/**
 * Where a picture of iw×ih is drawn in a canvas of cw×ch device px (dpr = device px per CSS px).
 * Shared by the player and by anything drawn over the video (the ice pane), so they always line up.
 */
export function layoutFilm(at, cw, ch, iw, ih, dpr, area) {
  const ir = iw / ih;
  if (at.fit && area) {
    const [x0, y0, x1, y1] = at.fit.box;
    const left = (area.left ?? 16) * dpr;
    const right = (area.right ?? cw / dpr - 16) * dpr;
    const top = area.top * dpr;
    const bottom = Math.max(area.top + 80, area.bottom) * dpr;
    const s = Math.min((right - left) / ((x1 - x0) * iw), (bottom - top) / ((y1 - y0) * ih));
    const w = iw * s;
    const h = ih * s;
    return { x: (left + right) / 2 - ((x0 + x1) / 2) * w, y: (top + bottom) / 2 - ((y0 + y1) / 2) * h, w, h };
  }
  let w;
  let h;
  if (at.w) {
    w = at.w * cw;
    h = w / ir;
  }
  else if (at.h) {
    h = at.h * ch;
    w = h * ir;
  }
  else if (cw / ch > ir) {
    w = cw;
    h = cw / ir;
  }
  else {
    h = ch;
    w = ch * ir;
  }
  return { x: (at.x ?? 0.5) * cw - w / 2, y: (at.y ?? 0.5) * ch - h / 2, w, h };
}
/** true below 768px, kept up to date: a frame set switch when the window crosses the breakpoint. */
export function usePhone() {
  // read at the first client render (not one render later), so the hero registers with the loader in time
  const [phone, setPhone] = useState(() => typeof window === "undefined" ? null : window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}
export const isPhone = () => typeof window !== "undefined" && window.innerWidth < 768;
export function useFilm(folder, canvasRef, { eager = false, blockLoader = false, initial = 0, place, loadWhen, } = {}) {
  const time = useRef(initial);
  const api = useRef({ seekTime: (t) => (time.current = t), time: () => time.current });
  const phoneNow = usePhone();
  useEffect(() => {
    if (phoneNow === null)
      return;
    const canvas = canvasRef.current;
    if (!canvas)
      return;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;
    const phone = phoneNow;
    const src = phone ? `${folder}-m` : folder;
    const at = place?.(phone) ?? {};
    const taskId = `frames:${src}`;
    if (blockLoader)
      loading.register(taskId);
    let m = null;
    let times = [];
    let player = null;
    let raf = 0;
    let dirty = true;
    let visible = true;
    let cancelled = false;
    let last = { pos: -1, a: undefined, b: undefined };
    let dpr = 1;
    let area = null;
    let lastRect = "";
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      area = at.fit ? at.fit.area(canvas) : null; // the free space, measured from the page layout
      dirty = true;
    };
    /** Fractional frame index of video second t. */
    const indexOf = (t) => {
      if (!times.length)
        return 0;
      if (t <= times[0])
        return 0;
      const n = times.length - 1;
      if (t >= times[n])
        return n;
      let lo = 0;
      let hi = n;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (times[mid] <= t)
          lo = mid;
        else
          hi = mid;
      }
      return lo + (t - times[lo]) / (times[hi] - times[lo]);
    };
    const render = () => {
      raf = requestAnimationFrame(render);
      if (!m || !player || !visible)
        return;
      const pos = indexOf(time.current);
      const i = Math.floor(pos);
      const frac = pos - i;
      const a = player.get(i);
      if (!a)
        return;
      const b = frac > 0.002 && i + 1 < m.count ? player.get(i + 1) : undefined;
      if (!dirty && Math.abs(pos - last.pos) < 0.0005 && a === last.a && b === last.b)
        return;
      const cw = canvas.width;
      const ch = canvas.height;
      const { x: dx, y: dy, w: dw, h: dh } = layoutFilm(at, cw, ch, a.naturalWidth, a.naturalHeight, dpr, area);
      if (at.onLayout) {
        const key = `${dx}|${dy}|${dw}|${dh}`;
        if (key !== lastRect) {
          lastRect = key;
          at.onLayout({ x: dx / dpr, y: dy / dpr, w: dw / dpr, h: dh / dpr });
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(a, dx, dy, dw, dh);
      if (b && b !== a) {
        ctx.globalAlpha = frac;
        ctx.drawImage(b, dx, dy, dw, dh);
        ctx.globalAlpha = 1;
      }
      // soft edges: erase the picture to transparent over each band (the page behind shows through)
      const f = at.fade ?? {};
      ctx.globalCompositeOperation = "destination-out";
      const band = (x0, y0, x1, y1) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.35, "rgba(0,0,0,0.72)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        return g;
      };
      if (f.l) {
        const w = f.l * dw;
        ctx.fillStyle = band(dx, 0, dx + w, 0);
        ctx.fillRect(dx, dy, w, dh);
      }
      if (f.r) {
        const w = f.r * dw;
        ctx.fillStyle = band(dx + dw, 0, dx + dw - w, 0);
        ctx.fillRect(dx + dw - w, dy, w, dh);
      }
      if (f.t) {
        const w = f.t * dh;
        ctx.fillStyle = band(0, dy, 0, dy + w);
        ctx.fillRect(dx, dy, dw, w);
      }
      if (f.b) {
        const w = f.b * dh;
        ctx.fillStyle = band(0, dy + dh, 0, dy + dh - w);
        ctx.fillRect(dx, dy + dh - w, dw, w);
      }
      ctx.globalCompositeOperation = "source-over";
      last = { pos, a, b };
      dirty = false;
    };
    api.current.seekTime = (t) => {
      time.current = t;
    };
    const start = () => {
      getManifest(src)
        .then((man) => {
          if (cancelled)
            return;
          m = man;
          times = m.times ?? Array.from({ length: m.count }, (_, i) => i / 24);
          const t0 = performance.now();
          player = loadFrames(src, m, (loaded, total) => {
            if (blockLoader)
              loading.update(taskId, loaded / total); // the loader waits for every hero frame
            // debug (console: __films): how far each folder has loaded
            const w = window;
            (w.__films ??= {})[src] = `${loaded}/${total} after ${((performance.now() - t0) / 1000).toFixed(1)} s (started ${(t0 / 1000).toFixed(1)} s)`;
            dirty = true;
          });
        })
        .catch((err) => {
          console.warn(err.message);
          if (blockLoader)
            loading.update(taskId, 1);
        });
    };
    // lazy: start loading when the section is near; draw only while on screen
    let near = null;
    if (eager)
      start();
    else {
      near = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          near?.disconnect();
          near = null;
          start();
        }
      }, { rootMargin: loadWhen ? "0px" : "100% 0px 100% 0px" });
      near.observe((loadWhen && document.querySelector(loadWhen)) || canvas);
    }
    const seen = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible)
        dirty = true;
    });
    seen.observe(canvas);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    // the measured areas depend on the text: measure again once the fonts are in, and after the first layout settles
    document.fonts?.ready.then(() => !cancelled && resize());
    const late = window.setTimeout(resize, 600);
    raf = requestAnimationFrame(render);
    return () => {
      cancelled = true;
      window.clearTimeout(late);
      cancelAnimationFrame(raf);
      ro.disconnect();
      near?.disconnect();
      seen.disconnect();
      player?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder, canvasRef, eager, blockLoader, phoneNow]);
  return api;
}
/** Record seconds of a film's pin (sum of its segments). */
export const filmSecs = (film) => film.segments.reduce((s, x) => s + x.secs, 0);
/** Pinned scroll length (vh) of a film. */
export const filmPinVh = (film) => Math.round(filmSecs(film) * PIN_VH_PER_SEC);
/** Scroll progress (0..1 of the pin) → video second, piecewise linear through the segments. */
export function filmTimeAt(film, p) {
  const total = filmSecs(film);
  let acc = 0;
  let from = film.start;
  const q = Math.min(1, Math.max(0, p)) * total;
  for (const s of film.segments) {
    if (q <= acc + s.secs)
      return from + ((q - acc) / s.secs) * (s.to - from);
    acc += s.secs;
    from = s.to;
  }
  return from;
}
/** Scroll progress (0..1) at the end of each segment (where the record-mode stops sit). */
export function filmStops(film) {
  const total = filmSecs(film);
  let acc = 0;
  return film.segments.map((s) => {
    acc += s.secs;
    return { p: acc / total, secs: s.secs, label: s.label };
  });
}
