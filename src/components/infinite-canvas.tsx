"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Project } from "@/lib/projects";

gsap.registerPlugin(useGSAP);

const COLS = 4;
const LABEL = 28; // hauteur réservée au numéro + titre sous chaque carte

type Placed = { project: Project; x: number; y: number; w: number; h: number };

function useViewport() {
  const [size, setSize] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

// Une « tuile » contient tous les projets en colonnes décalées ; on la répète
// dans les deux sens et on replie le décalage modulo sa taille pour boucler.
function layoutTile(projects: Project[], vw: number) {
  const cardW = vw < 640 ? 160 : vw < 1024 ? 220 : 270;
  const gap = vw < 640 ? 18 : 32;
  const columns: Project[][] = Array.from({ length: COLS }, () => []);
  projects.forEach((p, i) => columns[i % COLS].push(p));

  const heightOf = (p: Project) => {
    const ratio = Math.min(1.35, Math.max(0.72, p.cover.height / p.cover.width));
    return Math.round(cardW * ratio) + LABEL;
  };
  const tileH = Math.max(...columns.map((c) => c.reduce((s, p) => s + heightOf(p) + gap, 0)));
  const tileW = COLS * (cardW + gap);

  const placed: Placed[] = [];
  columns.forEach((col, c) => {
    const used = col.reduce((s, p) => s + heightOf(p), 0);
    const colGap = (tileH - used) / col.length; // chaque colonne remplit exactement la tuile
    let y = c % 2 ? tileH * 0.38 : tileH * 0.08;
    col.forEach((p) => {
      const h = heightOf(p);
      placed.push({ project: p, x: c * (cardW + gap), y, w: cardW, h });
      y += h + colGap;
    });
  });
  return { placed, tileW, tileH };
}

const wrap = (v: number, m: number) => ((v % m) + m) % m;

export function InfiniteCanvas({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const viewport = useViewport();
  const rootRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const drag = useRef({ active: false, moved: 0, lastX: 0, lastY: 0, vx: 0, vy: 0 });
  const leaving = useRef(false);

  const { placed, tileW, tileH } = useMemo(() => layoutTile(projects, viewport.w), [projects, viewport.w]);
  const copiesX = Math.ceil(viewport.w / tileW) + 2;
  const copiesY = Math.ceil(viewport.h / tileH) + 3;

  // Centre la vue sur la tuile au premier rendu.
  useEffect(() => {
    target.current = { x: (viewport.w - tileW) / 2, y: (viewport.h - tileH) / 2 };
    current.current = { ...target.current };
  }, [tileW, tileH, viewport.w, viewport.h]);

  // Next garde la page d'accueil en cache (<Activity>) : à chaque retour, le contexte
  // GSAP est rejoué : on efface d'abord ce qu'a laissé l'animation de sortie.
  useGSAP(
    () => {
      leaving.current = false;
      gsap.set(".canvas-card", { clearProps: "opacity,transform,filter" });
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ease = reduce ? 1 : 0.085;
      const tick = () => {
        const c = current.current;
        c.x += (target.current.x - c.x) * ease;
        c.y += (target.current.y - c.y) * ease;
        gsap.set(planeRef.current, {
          x: wrap(c.x, tileW) - tileW,
          y: wrap(c.y, tileH) - 2 * tileH,
        });
      };
      gsap.ticker.add(tick);

      if (!reduce) {
        // Apparition par paquets, en négatif puis rafraîchie, comme un écran à encre.
        const cards = gsap.utils.toArray<HTMLElement>(".canvas-card");
        gsap.set(cards, { opacity: 0 });
        cards.forEach((card) => {
          const at = Math.round(Math.random() * 4) * 0.12;
          gsap
            .timeline({ delay: at })
            .set(card, { opacity: 1, filter: "invert(1) grayscale(1)" })
            .set(card, { filter: "grayscale(1)" }, 0.1)
            .set(card, { clearProps: "filter" }, 0.2);
        });
      }
      return () => gsap.ticker.remove(tick);
    },
    { scope: rootRef, dependencies: [tileW, tileH], revertOnUpdate: true }
  );

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { active: true, moved: 0, lastX: e.clientX, lastY: e.clientY, vx: 0, vy: 0 };
    gsap.to(zoomRef.current, { scale: 0.96, duration: 0.4, ease: "power3.out" });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    if (d.moved > 6) rootRef.current?.setPointerCapture(e.pointerId);
    d.vx = dx;
    d.vy = dy;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    target.current.x += dx;
    target.current.y += dy;
  };
  const endDrag = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    target.current.x += d.vx * 12; // inertie
    target.current.y += d.vy * 12;
    gsap.to(zoomRef.current, { scale: 1, duration: 0.6, ease: "power3.out" });
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current.x -= e.deltaX;
      target.current.y -= e.deltaY;
    };
    const onKey = (e: KeyboardEvent) => {
      const step = 160;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      };
      const m = moves[e.key];
      if (!m) return;
      target.current.x += m[0];
      target.current.y += m[1];
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Délégation : un seul handler pour toutes les cartes (et pas de clic après un glisser).
  const onClick = (e: React.MouseEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-slug]");
    if (!card || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    if (drag.current.moved > 6 || leaving.current) return;
    leaving.current = true;
    const slug = card.dataset.slug;
    const others = rootRef.current?.querySelectorAll(".canvas-card") ?? [];
    // Rafraîchissement façon écran à encre : la carte passe en négatif, les autres s'effacent d'un coup.
    gsap
      .timeline({ onComplete: () => router.push(`/projets/${slug}`) })
      .set(card, { filter: "invert(1) grayscale(1)" }, 0)
      .set([...others].filter((c) => c !== card), { opacity: 0 }, 0.12)
      .set(card, { filter: "grayscale(1)" }, 0.22)
      .set(card, { filter: "none" }, 0.3);
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 cursor-grab touch-none select-none overflow-hidden bg-background active:cursor-grabbing"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div ref={zoomRef} className="absolute inset-0 origin-center">
      <div ref={planeRef} className="absolute left-0 top-0 will-change-transform">
        {Array.from({ length: copiesY }).flatMap((_, ty) =>
          Array.from({ length: copiesX }).map((_, tx) => (
            <div
              key={`${tx}-${ty}`}
              className="absolute"
              style={{ left: tx * tileW, top: ty * tileH, width: tileW, height: tileH }}
              aria-hidden={tx !== 1 || ty !== 2 ? true : undefined}
            >
              {placed.map((p) => (
                <Link
                  key={p.project.slug}
                  href={`/projets/${p.project.slug}`}
                  data-slug={p.project.slug}
                  tabIndex={tx === 1 && ty === 2 ? 0 : -1}
                  draggable={false}
                  className="canvas-card group absolute block outline-none"
                  style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
                >
                  <div className="relative overflow-hidden bg-muted" style={{ height: p.h - LABEL }}>
                    <Image
                      src={p.project.cover.src}
                      alt={p.project.title}
                      fill
                      sizes={`${p.w}px`}
                      draggable={false}
                      className="pointer-events-none object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
                    />
                  </div>
                  <div className="pt-2 text-[13px] leading-none">
                    <span className="block truncate text-foreground/80 transition-colors group-hover:text-foreground">
                      {p.project.title}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}
