"use client";
import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { loading, onSiteReady } from "@/lib/loading";
/** Buttery smooth scrolling (Lenis) kept in sync with GSAP ScrollTrigger. */
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.documentElement.classList.add("is-static"); // ?static=1: CSS loops stop too (html.is-static rules)
      return;
    }
    const lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Keep the page still while the loader is on screen
    if (!loading.finished)
      lenis.stop();
    const off = onSiteReady(() => {
      lenis.start();
      ScrollTrigger.refresh();
    });
    // Smooth anchor links (#section)
    const onClick = (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a)
        return;
      const target = document.querySelector(a.getAttribute("href") || "");
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.6 });
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      off();
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);
  return null;
}
