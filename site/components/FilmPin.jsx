"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { onSiteReady } from "@/lib/loading";
import { filmPinVh, filmStops, filmTimeAt, useFilm } from "./film";
/**
 * A pinned scroll video: the section is 100svh + the film's pin length; the stage sticks while the scroll plays the
 * video by its segments (video time, not frames). Record mode: the section top is a stop (`arrive` seconds), then one
 * invisible stop at the end of every segment, so each part of the video gets exactly its planned seconds.
 * ?static=1: no pin, the stage shows the film's poster second (its final picture).
 * Overlays are children; `onTime(videoSecond, progress)` runs on every scroll update (and once with the poster).
 */
export default function FilmPin({ id, film, arrive, eager = false, blockLoader = false, className = "", canvasClass = "absolute inset-0 h-full w-full", onTime, playerRef, children, before, place, loadWhen, intro, tail = 0, overlap = false, }) {
  const outer = useRef(null);
  const canvas = useRef(null);
  const player = useFilm(film.frames, canvas, { eager, blockLoader, initial: film.start, place, loadWhen });
  const cb = useRef(onTime);
  cb.current = onTime;
  const pinVh = filmPinVh(film);
  useEffect(() => {
    if (playerRef)
      playerRef.current = player.current;
    if (prefersReducedMotion()) {
      player.current.seekTime(film.poster);
      cb.current?.(film.poster, 1);
      return;
    }
    // the intro may start before film.start (it plays the first beat by itself; the scroll then maps from film.start)
    const auto = { t: intro?.from ?? film.start };
    let lastP = 0;
    const apply = (raw) => {
      lastP = raw;
      // the scroll range includes the pinned tail; the film plays over the pin part only
      const p = tail ? Math.min(1, (raw * (pinVh + tail)) / pinVh) : raw;
      // with intro.from: intro time + scroll progress beyond film.start (continuous, whichever is ahead); without it:
      // the later of the two (the kit's behaviour)
      const scrollT = filmTimeAt(film, p);
      const t = intro?.from !== undefined ? Math.min(film.poster, auto.t + (scrollT - film.start)) : Math.max(scrollT, auto.t);
      player.current.seekTime(t);
      cb.current?.(t, p);
    };
    apply(0);
    const st = ScrollTrigger.create({
      trigger: outer.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    const offIntro = intro
      ? onSiteReady(() => {
        gsap.to(auto, { t: intro.to, duration: intro.secs, ease: "sine.out", onUpdate: () => apply(lastP) });
      })
      : () => { };
    return () => {
      offIntro();
      st.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [film, player, playerRef, intro, tail]);
  const stops = filmStops(film);
  return (<section ref={outer} id={id} data-chapter={id} className={`pin-outer ${className}`} style={{ height: `calc(100svh + ${pinVh + tail}vh)`, marginTop: overlap ? "-100svh" : undefined }} data-record-time={arrive} data-record-label={id}>
    {stops.map((s) => (<div key={s.label} aria-hidden className="rec-stop pointer-events-none absolute left-0 h-px w-px" style={{ top: `${(pinVh * s.p).toFixed(2)}vh` }} data-record-time={s.secs} data-record-label={s.label} />))}
    <div className="pin-stage">
      {before}
      <canvas ref={canvas} className={canvasClass} aria-hidden />
      {children}
    </div>
  </section>);
}
