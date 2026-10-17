"use client";
import SprinkleWord from "./SprinkleWord";
import { visit } from "../content";
// Footer "Visit" (FO07 info footer: address, hours, counter, map · Motion map M45 particle text). Chocolate block.
// A band of sprinkles gathers into CRUMB & CO as soon as the footer enters and keeps a light wave running, so the last screen of the reel
// is never still (lesson 35). Columns: studio (area only), hours, counter; a flat block map with a strawberry pin.
// "Concept website" note. Phone: columns stack, map below. ?static=1: the wordmark formed.
const MAP = [
  "pist", "cream", "pink", "cream", "pist", "cream",
  "cream", "pink", "cream", "pist", "cream", "pink",
  "pink", "cream", "pist", "cream", "pink", "cream",
];
export default function VisitFooter() {
  return (<footer id="visit" data-record-time="1.2" data-record-hold="2" data-record-label="footer" data-hold-push=".particle-word" className="relative bg-[var(--choc)] pb-8 pt-[clamp(40px,6vh,72px)] text-[color:var(--paper)]">
    <div className="step-edge" style={{ ["--step-c"]: "var(--choc)" }} />
    {/* a slow ticker under the stepped edge (CSS, runs from the first paint): the last screen always moves */}
    <div className="foot-ticker overflow-hidden border-y border-[rgba(255,250,243,0.18)] py-2.5" aria-hidden>
      <div className="foot-ticker-track flex w-max gap-10 whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.08em] text-[color:var(--pink)]">
        {Array.from({ length: 2 }, (_, k) => (<span key={k} className="flex gap-10">
          {["Order by noon", "At your door by four", "Eggless on request", "Slices at the counter", "Anna Nagar, Madurai", "Baked at six every morning"].map((t) => (<span key={t} className="flex items-center gap-10">
            {t}
            <span className="inline-block h-2 w-2 bg-[var(--straw)]" />
          </span>))}
        </span>))}
      </div>
    </div>
    <div className="container-x mt-[clamp(24px,4vh,48px)]">
      <div className="relative">
        <SprinkleWord text="Crumb & Co" className="particle-word h-[clamp(120px,22vh,230px)] w-full" />
        {/* ?static=1: the formed wordmark as type (the particle canvas only draws with motion on) */}
        <p className="particle-static font-display absolute inset-0 hidden place-items-center text-[clamp(80px,13vw,200px)] text-[color:var(--pink)]">Crumb &amp; Co</p>
      </div>
      <div className="mt-8 grid grid-cols-[1fr_1fr_1fr_1.3fr] gap-8 border-t border-[rgba(255,250,243,0.25)] pt-8 max-md:grid-cols-1 max-md:gap-6">
        {[
          { h: "Studio", lines: visit.studio },
          { h: "Open", lines: visit.hours },
          { h: "Counter", lines: visit.counter },
        ].map((c) => (<div key={c.h}>
          <p className="label text-[color:var(--pink)]">{c.h}</p>
          {c.lines.map((l) => (<p key={l} className="mt-2 text-[15px] leading-snug">
            {l}
          </p>))}
        </div>))}
        <div className="relative grid aspect-[2/1] grid-cols-6 gap-[3px] border-[1.5px] border-[var(--paper)] bg-[var(--paper)] p-[3px]" aria-label="Map: Anna Nagar, Madurai" role="img">
          {MAP.map((t, i) => (<span key={i} className={{ pist: "bg-[var(--pist)]", cream: "bg-[var(--cream)]", pink: "bg-[var(--pink)]" }[t]} />))}
          <span className="absolute left-[56%] top-[38%] grid h-9 w-9 -translate-x-1/2 -translate-y-full place-items-center bg-[var(--straw)] text-[13px] font-bold text-[var(--paper)] [clip-path:polygon(0_0,100%_0,100%_75%,50%_100%,0_75%)]">
            C&amp;
          </span>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-[13px] text-[color:rgba(255,250,243,0.75)]">
        <p>© 2026 Crumb &amp; Co · {visit.note}</p>
        <p className="flex gap-5">
          <a href="#top" className="link-underline">Instagram</a>
          <a href="#top" className="link-underline">WhatsApp orders</a>
          <a href="#top" className="link-underline">Back to top</a>
        </p>
      </div>
    </div>
  </footer>);
}
