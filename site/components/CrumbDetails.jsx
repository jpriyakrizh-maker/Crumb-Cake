"use client";
import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { onReveal } from "./LayersLoader";
// Round 4 details (Motion map "Details"). Each one also plays once by itself on camera (nobody hovers in a reel):
//  - magnetic buttons ([data-mag]): lean toward the pointer, label leans further; smooth power3 (no elastic bounce,
//    house style). Hands-free: each one makes one slow lean-and-return when it first comes into view.
//  - the hero's "Order a cake" shine runs once as the hero arrives (the CSS shine on .btn-solid, triggered by a class)
//  - ticket tear: a cake ticket's perforated stub tips open on hover (CSS); the counter tears the featured stub once
//    per change by itself (CakeCounter)
//  - hover lift on cake tickets and builder chips, link underlines, Add buttons fill strawberry (CSS)
export default function CrumbDetails() {
  useEffect(() => {
    if (prefersReducedMotion())
      return;
    const mags = gsap.utils.toArray("[data-mag]");
    const offs = [];
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    mags.forEach((el) => {
      const label = el.querySelector(".mag-label") ?? el;
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      const lxTo = gsap.quickTo(label, "x", { duration: 0.5, ease: "power3.out" });
      const lyTo = gsap.quickTo(label, "y", { duration: 0.5, ease: "power3.out" });
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * 0.22);
        yTo(dy * 0.3);
        if (label !== el) {
          lxTo(dx * 0.12);
          lyTo(dy * 0.16);
        }
      };
      const leave = () => {
        xTo(0);
        yTo(0);
        if (label !== el) {
          lxTo(0);
          lyTo(0);
        }
      };
      if (fine) {
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
      }
      // hands-free: one lean to the right and back, the first time the button is well in view
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 78%",
        once: true,
        onEnter: () => gsap
          .timeline({ delay: 0.3 })
          .to(el, { x: 8, y: -4, duration: 0.45, ease: "power3.out" })
          .to(label === el ? {} : label, { x: 5, y: -2, duration: 0.45, ease: "power3.out" }, 0)
          .to([el, label], { x: 0, y: 0, duration: 0.6, ease: "power3.inOut" }, 0.6),
      });
      offs.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        st.kill();
      });
    });
    // the hero button's shine runs once as the hero arrives
    offs.push(onReveal(() => window.setTimeout(() => {
      const b = document.querySelector("#hero .btn-solid");
      if (!b)
        return;
      b.classList.add("shine-now");
      window.setTimeout(() => b.classList.remove("shine-now"), 1100);
    }, 1300)));
    return () => offs.forEach((f) => f());
  }, []);
  return null;
}
