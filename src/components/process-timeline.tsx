"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Frise du processus : un trait vertical se remplit au fil du défilement et chaque rond
// ([data-dot] dans les étapes) se valide quand le trait l'atteint.
// Mis à jour directement dans le DOM, sans rendu React, pour rester fluide.
export function ProcessTimeline({ children, className }: { children: ReactNode; className?: string }) {
  const list = useRef<HTMLOListElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const dots = [...el.querySelectorAll<HTMLElement>("[data-dot]")];

    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      // la pointe du trait suit une ligne placée un peu au-dessus du milieu de l'écran
      const tip = Math.min(r.height, Math.max(0, window.innerHeight * 0.55 - r.top));
      if (fill.current) fill.current.style.height = `${tip}px`;
      for (const d of dots) {
        const b = d.getBoundingClientRect();
        d.toggleAttribute("data-done", b.top + b.height / 2 - r.top <= tip);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <ol ref={list} className={cn("relative grid gap-28 pl-12 sm:gap-36 sm:pl-24", className)}>
      <span aria-hidden className="absolute bottom-0 left-[15px] top-4 w-0.5 bg-foreground/10 sm:left-[19px]">
        <span ref={fill} className="block w-full bg-foreground" style={{ height: 0 }} />
      </span>
      {children}
    </ol>
  );
}

// Rond d'une étape : vide tant que le trait ne l'a pas atteint, plein et coché ensuite.
export function TimelineDot() {
  return (
    <span
      data-dot
      aria-hidden
      className="group/dot absolute -left-12 top-2 grid size-8 place-items-center rounded-full border-2 border-foreground bg-background transition-colors duration-300 data-done:bg-foreground sm:-left-24 sm:size-10"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4 scale-50 fill-none stroke-background stroke-[3] opacity-0 transition-[opacity,scale] duration-300 group-data-done/dot:scale-100 group-data-done/dot:opacity-100 sm:size-5"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
