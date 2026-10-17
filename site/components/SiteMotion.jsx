"use client";
import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
// Page-wide transitions (Motion map "Transitions"):
//  - X3 edge shape morph: every stepped edge (S10) arrives taller with its steps further left, and settles into the
//    resting cake-tier shape as its section scrolls in (steps slide right, height shrinks)
//  - X16 cut-and-stamp: the chocolate footer lands with a small jolt (3 px → 0, expo) as it crosses into view
export default function SiteMotion() {
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const tweens = gsap.utils.toArray(".step-edge").map((edge) => {
      const sec = edge.parentElement;
      return gsap.fromTo(edge, { "--s1": "16%", "--s2": "46%", "--step-h": "128px" }, { "--s1": "34%", "--s2": "67%", "--step-h": "72px", ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "top 35%", scrub: 0.3 } });
    });
    const foot = document.getElementById("visit");
    const stamp = foot
      ? ScrollTrigger.create({
        trigger: foot,
        start: "top 80%",
        onEnter: () => gsap.fromTo(foot, { y: 4 }, { y: 0, duration: 0.45, ease: "expo.inOut" }),
      })
      : null;
    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      stamp?.kill();
    };
  }, []);
  return null;
}
