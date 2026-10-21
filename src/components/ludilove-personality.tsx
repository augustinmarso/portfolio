"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, KeyboardEvent } from "react";
import { asset } from "@/lib/projects";

// Test de personnalité de LudiLove, en vrais curseurs : ils bougent seuls tant qu'on n'y
// touche pas, se règlent au doigt ou au clavier, et l'archétype suit les valeurs.
// Valeur de chaque axe : -1 (côté gauche) à 1 (côté droit).
const AXES = [
  { left: "Coopératif", right: "Compétitif", fill: "#6AA68A", track: "#E3EFE8", ink: "#4E8A6E" },
  { left: "Spontané", right: "Réflexion", fill: "#CDC5FF", track: "#F2F0FF", ink: "#7A70C9" },
  { left: "Court", right: "Long", fill: "#F2946F", track: "#FCE7DE", ink: "#D9704A" },
  { left: "Classique", right: "Original", fill: "#F0C4DD", track: "#FBEEF5", ink: "#C2547F" },
  { left: "Hasard", right: "Tactique", fill: "#F1EA6D", track: "#FBF8D9", ink: "#B59A1E" },
];

// Archétype : le trait le plus marqué l'emporte.
const ARCHETYPES: Record<string, string> = {
  Coopératif: "Le Coopératif", Compétitif: "Le Compétiteur", Spontané: "Le Festif", Réflexion: "Le Stratège",
  Court: "L'Ambianceur", Long: "L'Explorateur", Classique: "Le Gardien", Original: "Le Curieux",
  Hasard: "Le Joueur", Tactique: "Le Tacticien",
};

const START = [-0.24, 0.72, 1, 0.24, 0.32];
const pct = (v: number) => Math.round(50 + Math.abs(v) * 50);
const side = (i: number, v: number) => (v < 0 ? AXES[i].left : AXES[i].right);
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export function LudilovePersonality() {
  const [vals, setVals] = useState(START);
  const touched = useRef(0); // horodatage du dernier geste du visiteur
  const target = useRef(START.map(() => Math.random() * 2 - 1));

  // Animation automatique : chaque curseur glisse vers une cible qui change de temps en temps.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (now - touched.current > 5000) {
        setVals((vs) => vs.map((v, i) => {
          if (Math.abs(target.current[i] - v) < 0.02) target.current[i] = Math.random() * 2 - 1;
          return v + (target.current[i] - v) * Math.min(1, dt * (0.9 + i * 0.15));
        }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const set = (i: number, v: number) => {
    touched.current = performance.now();
    setVals((vs) => vs.map((x, j) => (j === i ? clamp(v) : x)));
  };
  const fromPointer = (i: number, e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    set(i, ((e.clientX - r.left) / r.width) * 2 - 1);
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.2 : 0.05;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); set(i, vals[i] - step); }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); set(i, vals[i] + step); }
  };

  const strongest = vals.reduce((best, v, i) => (Math.abs(v) > Math.abs(vals[best]) ? i : best), 0);
  const ranked = vals.map((v, i) => ({ i, v })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const title = ARCHETYPES[side(strongest, vals[strongest])];

  return (
    <div className="llb-font w-full max-w-72 select-none text-[#353766]">
      <div className="mx-auto grid size-28 place-items-center rounded-full bg-[#ECEAF6]">
        <img src={asset("/projects/ludilove/charte/mascot-0.webp")} alt="" className="h-20 w-auto" />
      </div>
      <p className="mt-3 text-center text-lg font-bold">
        {title} <span className="text-sm text-[#7A70C9]">{Math.round(Math.abs(vals[strongest]) * 40)}%</span>
      </p>
      <div className="mt-2 flex justify-center gap-1.5">
        {ranked.slice(0, 3).map(({ i, v }) => (
          <span key={i} className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: AXES[i].track, color: AXES[i].ink }}>
            {side(i, v)}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {AXES.map((a, i) => {
          const v = vals[i];
          const x = 50 + v * 46; // position du curseur, en %
          return (
            <div key={a.left}>
              <div className="flex justify-between text-[10px] font-bold">
                <span style={{ color: v < 0 ? a.ink : "#a7a8c4" }}>{a.left}{v < 0 && ` ${pct(v)}%`}</span>
                <span style={{ color: v >= 0 ? a.ink : "#a7a8c4" }}>{v >= 0 && `${pct(v)}% `}{a.right}</span>
              </div>
              <div
                role="slider"
                tabIndex={0}
                aria-label={`${a.left} ou ${a.right}`}
                aria-valuemin={-100}
                aria-valuemax={100}
                aria-valuenow={Math.round(v * 100)}
                aria-valuetext={`${pct(v)} % ${side(i, v)}`}
                className="relative mt-1 h-5 cursor-pointer touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#8687BC] rounded-full"
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); fromPointer(i, e); }}
                onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(i, e); }}
                onKeyDown={(e) => onKey(i, e)}
              >
                <span className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full" style={{ background: a.track }} />
                <span className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-[#353766]/20" style={{ left: "50%" }} />
                <span
                  className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
                  style={{ background: a.fill, left: `${Math.min(50, x)}%`, width: `${Math.abs(x - 50)}%` }}
                />
                <span
                  className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] bg-white shadow-sm"
                  style={{ left: `${x}%`, borderColor: a.ink }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
