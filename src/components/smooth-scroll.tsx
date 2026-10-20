"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

// Défile jusqu'à un élément en glissant comme le reste du site (sous la barre du haut).
export function scrollToElement(el: HTMLElement, offset = -72) {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.6 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
}

// Défilement lent et fluide sur tout le site (inertie à la molette).
// Les zones qui gèrent leur propre molette portent l'attribut data-lenis-prevent.
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({
      lerp: 0.055, // plus la valeur est basse, plus le défilement glisse longtemps
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      prevent: (node) => !!node.closest?.("[data-lenis-prevent]"),
    });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // Nouvelle page : on repart du haut, sans glisser.
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
