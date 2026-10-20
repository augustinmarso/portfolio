"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/projects";

const CARD_W = 150;
const CARD_H = 210;

// Anneau 3D de cartes (façon rolodex), un projet par carte, sur le côté droit ;
// la molette ou le glisser le fait tourner et la carte de face s'affiche en grand à gauche.
export function ScrollRing({ projects }: { projects: Project[] }) {
  const n = projects.length;
  const step = 360 / n;
  const ringRef = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const current = useRef(0);
  const drag = useRef<{ x: number; moved: number } | null>(null);
  const [front, setFront] = useState(0);
  const [radius, setRadius] = useState(340);

  useEffect(() => {
    const fit = () => setRadius(Math.min(360, Math.max(190, window.innerWidth * 0.22)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Rotation lissée : la cible suit la molette, l'anneau la rattrape à chaque image.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tick = () => {
      current.current += (target.current - current.current) * (reduce ? 1 : 0.05);
      if (ringRef.current) ringRef.current.style.transform = `translateZ(${-radius}px) rotateX(-12deg) rotateY(${current.current}deg)`;
      const idx = ((Math.round(-current.current / step) % n) + n) % n;
      setFront((f) => (f === idx ? f : idx));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current -= (e.deltaY + e.deltaX) * 0.05;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
    };
  }, [radius, step, n]);

  const shown = projects[front];

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
      {/* Aperçu en grand de la carte de face */}
      <Link
        key={shown.slug}
        href={`/projets/${shown.slug}`}
        className="absolute inset-x-4 top-32 z-10 block animate-in fade-in duration-500 sm:left-6 sm:top-36 lg:right-auto lg:w-[42vw]"
      >
        <span className="relative block h-[34vh] lg:h-[60vh]">
          <Image src={shown.cover.src} alt={shown.title} fill sizes="(min-width: 1024px) 42vw, 100vw" className="object-contain object-left-top" />
        </span>
        <span className="mt-3 flex items-baseline gap-3 text-2xl font-bold lowercase tracking-tight sm:text-3xl">
          {shown.title}
          {shown.text?.year && <span className="text-base font-semibold text-muted-foreground">{shown.text.year}</span>}
        </span>
        <span className="mt-1 block text-sm font-semibold text-muted-foreground">ouvrir le projet →</span>
      </Link>

      {/* Anneau sur le côté */}
      <div className="absolute inset-x-0 bottom-0 top-[58%] grid place-items-center [perspective:1200px] lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-[52%]">
        <div ref={ringRef} className="relative [transform-style:preserve-3d]" style={{ width: CARD_W, height: CARD_H }}>
          {projects.map((p, i) => (
            <Link
              key={p.slug}
              href={`/projets/${p.slug}`}
              draggable={false}
              onClick={(e) => drag.current && drag.current.moved > 6 && e.preventDefault()}
              className="absolute inset-0 overflow-hidden bg-muted shadow-[0_0_0_1px_rgb(0_0_0/0.06)] [backface-visibility:visible]"
              style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px) rotateY(62deg)` }}
            >
              <Image src={p.cover.src} alt="" fill sizes={`${CARD_W}px`} draggable={false} className="pointer-events-none object-cover" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
