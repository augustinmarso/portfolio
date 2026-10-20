"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Project } from "@/lib/projects";

gsap.registerPlugin(useGSAP);

const COLS = 5;
const LABEL = 22; // hauteur réservée au titre sous chaque carte

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
// Les images gardent leurs proportions exactes (aucun recadrage) : chaque projet va
// dans la colonne la plus courte, et le reste de hauteur est réparti dans les écarts.
function layoutTile(projects: Project[], vw: number) {
  const cardW = vw < 640 ? 150 : vw < 1024 ? 200 : 240;
  const gap = vw < 640 ? 40 : 96;
  const natural = (p: Project) => Math.round(cardW * (p.cover.height / p.cover.width));

  const columns: Project[][] = Array.from({ length: COLS }, () => []);
  const sums = Array(COLS).fill(0);
  // Du plus haut au plus petit : la répartition gloutonne équilibre bien mieux les colonnes.
  [...projects].sort((a, b) => natural(b) - natural(a)).forEach((p) => {
    const c = sums.indexOf(Math.min(...sums));
    columns[c].push(p);
    sums[c] += natural(p) + LABEL + gap;
  });
  const tileH = Math.ceil(Math.max(...sums));
  const tileW = COLS * (cardW + gap);

  const placed: Placed[] = [];
  columns.forEach((col, c) => {
    const used = col.reduce((s, p) => s + natural(p) + LABEL, 0);
    const colGap = (tileH - used) / col.length; // ≥ gap, la colonne remplit exactement la tuile
    let y = (c % 2 ? 0.42 : 0.1) * tileH;
    col.forEach((p) => {
      const h = natural(p) + LABEL;
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
      gsap.set(".canvas-card", { clearProps: "opacity,transform" });
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ease = reduce ? 1 : 0.055;
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
        gsap.from(".canvas-card", {
          opacity: 0,
          scale: 0.6,
          duration: 1.1,
          ease: "expo.out",
          stagger: { amount: 0.9, from: "center", grid: "auto" },
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
    gsap
      .timeline({ onComplete: () => router.push(`/projets/${slug}`) })
      .to([...others].filter((c) => c !== card), { opacity: 0, scale: 0.9, duration: 0.45, ease: "power2.in" }, 0)
      .to(card, { scale: 1.08, duration: 0.5, ease: "power3.inOut" }, 0);
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
              className="pointer-events-none absolute"
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
                  className="canvas-card group pointer-events-auto absolute block outline-none"
                  style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
                >
                  <div className="relative overflow-hidden" style={{ height: p.h - LABEL }}>
                    <Image
                      src={p.project.cover.src}
                      alt={p.project.title}
                      fill
                      sizes={`${p.w}px`}
                      draggable={false}
                      className="pointer-events-none object-cover"
                    />
                    {/* Image de survol, au même cadrage : seule la personne apparaît (changement d'image, sans animation) */}
                    {p.project.hover && (
                      <Image
                        src={p.project.hover.src}
                        alt=""
                        fill
                        sizes={`${p.w * 2}px`}
                        draggable={false}
                        className="pointer-events-none object-cover opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                      />
                    )}
                  </div>
                  <div className="pt-1.5 text-[12px] font-semibold leading-none">
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
