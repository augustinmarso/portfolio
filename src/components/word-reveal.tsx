"use client";

import { useEffect, useRef } from "react";

// Révélation horizontale au défilement : la section reste fixée à l'écran pendant que
// chaque mot arrive de la droite jusqu'à sa place, un peu penché, en apparaissant.
// Les mots sont animés directement (sans rendu React) pour rester fluides.
export function WordReveal({ text, caption, screens = 2.4 }: { text: string; caption?: string; screens?: number }) {
  const section = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const spans = [...el.querySelectorAll<HTMLElement>("[data-word]")];
    const cap = el.querySelector<HTMLElement>("[data-caption]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
      const n = spans.length;
      const spread = 6; // nombre de mots en mouvement en même temps
      spans.forEach((s, i) => {
        const t = Math.min(1, Math.max(0, (p * 1.15 * (n + spread) - i) / spread));
        const e = 1 - Math.pow(1 - t, 3);
        s.style.opacity = String(e);
        s.style.transform = `translateX(${(1 - e) * 60}vw) skewX(${(1 - e) * -14}deg)`;
      });
      if (cap) cap.style.opacity = String(Math.min(1, Math.max(0, (p - 0.82) / 0.12)));
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
    <section ref={section} className="relative" style={{ height: `${screens * 100}svh` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
        <p className="max-w-[22ch] text-[clamp(30px,5.4vw,84px)] font-semibold leading-[1.02] tracking-[-0.04em] sm:max-w-[24ch]">
          {words.map((w, i) => (
            <span key={i} data-word className="inline-block whitespace-pre will-change-transform">
              {w + (i < words.length - 1 ? " " : "")}
            </span>
          ))}
        </p>
        {caption && (
          <p data-caption className="mt-8 text-lg font-semibold tracking-tight text-muted-foreground">
            {caption}
          </p>
        )}
      </div>
    </section>
  );
}
