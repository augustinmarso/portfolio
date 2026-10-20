"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/projects";

const REPEAT = 3; // les projets sont répétés pour un anneau bien dense
const CARD_W = 120;
const CARD_H = 170;

// Anneau 3D de cartes (façon rolodex) que la molette ou le glisser fait tourner.
// La carte qui passe de face s'affiche en grand en haut à gauche.
export function ScrollRing({ projects }: { projects: Project[] }) {
  const cards = useMemo(() => Array.from({ length: REPEAT }, () => projects).flat(), [projects]);
  const n = cards.length;
  const step = 360 / n;
  const ringRef = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const current = useRef(0);
  const drag = useRef<{ x: number; moved: number } | null>(null);
  const [front, setFront] = useState(0);
  const [radius, setRadius] = useState(560);

  useEffect(() => {
    const fit = () => setRadius(Math.min(620, Math.max(260, window.innerWidth * 0.36)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Rotation lissée : la cible suit la molette, l'anneau la rattrape à chaque image.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tick = () => {
      current.current += (target.current - current.current) * (reduce ? 1 : 0.08);
      if (ringRef.current) ringRef.current.style.transform = `translateZ(${-radius}px) rotateX(-14deg) rotateY(${current.current}deg)`;
      const idx = ((Math.round(-current.current / step) % n) + n) % n;
      setFront((f) => (f === idx ? f : idx));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current -= (e.deltaY + e.deltaX) * 0.08;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
    };
  }, [radius, step, n]);

  const shown = cards[front];

  return (
    <div
      className="fixed inset-0 touch-none select-none overflow-hidden"
      onPointerDown={(e) => (drag.current = { x: e.clientX, moved: 0 })}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        drag.current.x = e.clientX;
        drag.current.moved += Math.abs(dx);
        target.current += dx * 0.25;
      }}
      onPointerUp={() => setTimeout(() => (drag.current = null))}
      onPointerLeave={() => (drag.current = null)}
    >
      {/* Aperçu de la carte de face */}
      <Link href={`/projets/${shown.slug}`} className="absolute left-4 top-32 z-10 block w-40 sm:left-6 sm:top-36 sm:w-52">
        <span className="relative block aspect-[4/3] overflow-hidden bg-muted">
          <Image src={shown.cover.src} alt={shown.title} fill sizes="208px" className="object-cover" />
        </span>
        <span className="mt-1.5 block text-sm font-semibold lowercase">{shown.title}</span>
      </Link>

      <div className="absolute inset-0 grid place-items-center [perspective:1400px]">
        <div ref={ringRef} className="relative [transform-style:preserve-3d]" style={{ width: CARD_W, height: CARD_H }}>
          {cards.map((p, i) => (
            <Link
              key={`${p.slug}-${i}`}
              href={`/projets/${p.slug}`}
              draggable={false}
              onClick={(e) => drag.current && drag.current.moved > 6 && e.preventDefault()}
              className="absolute inset-0 overflow-hidden bg-muted shadow-[0_0_0_1px_rgb(0_0_0/0.06)] [backface-visibility:visible]"
              style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px) rotateY(90deg)` }}
            >
              <Image src={p.cover.src} alt="" fill sizes={`${CARD_W}px`} draggable={false} className="pointer-events-none object-cover" />
            </Link>
          ))}
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-12 left-4 text-[clamp(4rem,12vw,10rem)] font-bold leading-none tracking-[-0.05em] sm:left-6">
        scroll
      </p>
    </div>
  );
}
