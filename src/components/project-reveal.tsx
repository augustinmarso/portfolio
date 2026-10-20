"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Chaque élément .reveal apparaît comme sur un écran à encre : affiché en négatif, puis rafraîchi.
export function ProjectReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 92%", once: true } })
          .set(el, { opacity: 0 })
          .set(el, { opacity: 1, filter: "invert(1) grayscale(1) contrast(1.4)" }, 0.06)
          .set(el, { filter: "grayscale(1)" }, 0.16)
          .set(el, { clearProps: "filter,opacity" }, 0.26);
      });
    },
    { scope: ref }
  );

  return <div ref={ref}>{children}</div>;
}
