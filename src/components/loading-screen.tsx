"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Écran de chargement, seulement à l'arrivée sur le site (il fait partie du HTML de départ,
// donc il s'affiche avant même le JavaScript). Logo : une petite grille de rectangles en
// colonnes décalées, comme les vignettes de l'index, qui glisse en diagonale par élans
// successifs, à la manière du canevas qu'on fait glisser. Disparaît en fondu dès que la
// page est chargée (au moins 0,6 s, au plus 3 s) ; sans JavaScript, un fondu CSS le retire.

// Une tuile : 3 colonnes de rectangles (largeur 7, écart 3), hauteurs variées comme les vignettes.
const COLS = [
  [9, 6, 11],
  [6, 10, 7],
  [11, 7, 6],
];
const W = 7;
const GAP = 3;
const TILE_W = COLS.length * (W + GAP);
const TILE_H = Math.max(...COLS.map((c) => c.reduce((a, h) => a + h + GAP, 0)));

function Tile({ x, y }: { x: number; y: number }) {
  return (
    <>
      {COLS.map((col, i) => {
        let top = i % 2 ? 5 : 0; // colonnes décalées, comme dans l'index
        return col.map((h, j) => {
          const r = (
            <span
              key={`${i}-${j}`}
              className="absolute rounded-[1.5px] bg-muted-foreground/45"
              style={{ left: x + i * (W + GAP), top: y + top, width: W, height: h }}
            />
          );
          top += h + GAP;
          return r;
        });
      })}
    </>
  );
}

export function LoadingScreen() {
  const [hidden, setHidden] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t0 = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, 600 - (performance.now() - t0));
      window.setTimeout(() => {
        setHidden(true);
        window.setTimeout(() => setGone(true), 700);
      }, wait);
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    const cap = window.setTimeout(finish, 3000); // jamais plus de 3 s, même si une image traîne
    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(cap);
    };
  }, []);

  if (gone) return null;
  return (
    <div
      aria-hidden
      className={cn(
        "loading-screen fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-700 ease-out",
        hidden && "pointer-events-none opacity-0"
      )}
    >
      <div className="relative overflow-hidden rounded-[3px]" style={{ width: TILE_W * 1.5, height: TILE_W * 1.5 }}>
        <div
          className="loading-logo absolute left-0 top-0"
          style={{ ["--tw" as string]: `${TILE_W}px`, ["--th" as string]: `${TILE_H}px` }}
        >
          {[0, 1, 2].map((tx) => [0, 1, 2].map((ty) => <Tile key={`${tx}-${ty}`} x={tx * TILE_W} y={ty * TILE_H} />))}
        </div>
      </div>
    </div>
  );
}
