"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { orders } from "../content";
// "Just ordered" (SP11 live order feed · Motion map M21 typewriter). Pistachio block.
// Left: headline, LIVE dot (CSS pulse), cakes today. Right: order rows as small white tickets (initial, name · cake,
// the customer's note, minutes ago). Round 3: new rows type themselves in at the top (caret) and push the older rows
// down. Fictional first names only. Phone: rows under the headline. ?static=1: all rows typed.
export default function JustOrdered() {
  const root = useRef(null);
  // M21: four older orders are already on screen; the newest opens at the TOP of the feed (its height grows from 0,
  // pushing the others down) and its name, cake and note type themselves in behind a blinking caret. X1: the section
  // is pulled up one screen and slides over the pinned box (BoxedFilm tail), so it starts once it has fully arrived.
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const el = root.current;
    const rows = gsap.utils.toArray(".order-row", el);
    const typed = rows.map((r) => [...r.querySelectorAll("[data-type]")].map((t) => ({ t, full: t.textContent ?? "" })));
    // the four older orders are already there; only the newest (top) row arrives and types itself in
    const fresh = rows[0];
    gsap.set(fresh, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, borderWidth: 0 });
    typed[0].forEach(({ t }) => (t.textContent = ""));
    const tl = gsap.timeline({ paused: true });
    tl.to(fresh, { height: "auto", opacity: 1, paddingTop: 12, paddingBottom: 12, borderWidth: 1.5, duration: 0.35, ease: "power3.out", clearProps: "paddingTop,paddingBottom,borderWidth,height" }, 0);
    tl.add(() => fresh.classList.add("typing"), 0.12);
    typed[0].forEach(({ t, full }, j) => {
      const o = { n: 0 };
      tl.to(o, { n: full.length, duration: Math.min(0.5, 0.02 * full.length + 0.1), ease: "none", onUpdate: () => (t.textContent = full.slice(0, Math.round(o.n))) }, 0.12 + j * 0.12);
    });
    tl.add(() => fresh.classList.remove("typing"), 0.85);
    // then the feed stays live: every 1.3 s the oldest order folds away at the bottom and comes back in at the top,
    // typed again ("now"), so the section never stands still while it is on screen
    const feed = el.querySelector(".order-feed");
    let live = 0;
    const next = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight)
        return;
      const last = feed.lastElementChild;
      const parts = [...last.querySelectorAll("[data-type]")];
      const full = parts.map((t) => t.dataset.full ?? t.textContent ?? "");
      parts.forEach((t, j) => (t.dataset.full = full[j]));
      gsap
        .timeline()
        .to(last, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, duration: 0.3, ease: "power2.in" })
        .add(() => {
          feed.prepend(last);
          parts.forEach((t) => (t.textContent = ""));
          last.classList.add("typing");
          [...feed.children].forEach((row, i) => gsap.to(row, { opacity: 1 - i * 0.12, duration: 0.3 }));
        })
        .to(last, { height: "auto", opacity: 1, paddingTop: 12, paddingBottom: 12, duration: 0.32, ease: "power3.out", clearProps: "paddingTop,paddingBottom,height" })
        .add(() => {
          parts.forEach((t, j) => {
            const o = { n: 0 };
            gsap.to(o, { n: full[j].length, duration: Math.min(0.45, 0.02 * full[j].length + 0.1), delay: j * 0.1, ease: "none", onUpdate: () => (t.textContent = full[j].slice(0, Math.round(o.n))) });
          });
        })
        .add(() => last.classList.remove("typing"), "+=0.7");
    };
    tl.eventCallback("onComplete", () => {
      next();
      live = window.setInterval(next, 1300);
    });
    const st = ScrollTrigger.create({ trigger: el, start: "top 45%", once: true, onEnter: () => tl.play() });
    return () => {
      st.kill();
      tl.kill();
      window.clearInterval(live);
    };
  }, []);
  return (<section ref={root} id="orders" style={{ marginTop: "-100svh" }} data-record-time="1.1" data-record-hold="1.6" data-record-label="orders" data-hold-push=".order-feed" className="relative z-10 bg-[var(--pist)] py-[clamp(72px,11vh,120px)]">
    <div className="step-edge flip" style={{ ["--step-c"]: "var(--pist)" }} />
    <div className="container-x grid grid-cols-[0.9fr_1.1fr] items-center gap-[clamp(32px,5vw,90px)] max-md:grid-cols-1 max-md:gap-6">
      <div>
        <p className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="label">Live from the studio</span>
        </p>
        <h2 className="font-display mt-4 text-[clamp(48px,5.6vw,96px)] max-md:text-[44px]">{orders.title}</h2>
        <p className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-[clamp(56px,5vw,84px)] tabular-nums leading-none">{orders.today}</span>
          <span className="text-[15px] text-muted">cakes ordered today</span>
        </p>
        <a href="#counter" className="btn btn-ink mt-6" data-cursor="Order" data-mag>
          <span className="mag-label">Order yours</span>
        </a>
      </div>
      <ul className="order-feed flex min-h-[392px] flex-col justify-start gap-2.5 max-md:min-h-[400px]">
        {orders.rows.map((r, i) => (<li key={r.name} className="order-row grid grid-cols-[44px_1fr_auto] items-center gap-4 overflow-hidden border-[1.5px] border-[var(--choc)] bg-[var(--paper)] px-4 py-3 max-md:gap-3 max-md:px-3" style={{ opacity: 1 - i * 0.12 }}>
          <span className={`font-display grid h-11 w-11 place-items-center text-[20px] ${["tone-pink", "tone-pistachio", "tone-blush", "tone-pink", "tone-pistachio"][i]} border-[1.5px] border-[var(--choc)]`}>{r.name[0]}</span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold">
              <span data-type>{r.name}</span> · <span data-type className="font-medium">{r.what}</span>
            </span>
            <span className="order-quote block truncate text-[14px] text-muted">
              &ldquo;<span data-type>{r.quote}</span>&rdquo;<span className="caret" aria-hidden />
            </span>
          </span>
          <span className="label text-muted">{r.when}</span>
        </li>))}
      </ul>
    </div>
  </section>);
}
