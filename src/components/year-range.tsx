"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Ligne verticale fixée sur le côté, à deux poignées : celle du haut borne l'année la plus récente,
// celle du bas la plus ancienne. Les poignées glissent librement sous le doigt puis se calent
// en douceur sur l'année la plus proche ; le filtre suit en direct.
export function YearRange({
  years,
  value,
  onChange,
}: {
  years: number[]; // triées, de la plus ancienne à la plus récente
  value: [number, number]; // [début, fin]
  onChange: (v: [number, number]) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ which: 0 | 1; pos: number } | null>(null);
  const start = useRef<number | null>(null); // glisser commencé sur deux poignées superposées
  const min = years[0];
  const max = years[years.length - 1];
  const span = max - min || 1;
  const toPos = (y: number) => (max - y) / span; // 0 = haut (récent), 1 = bas (ancien)
  const toYear = (pos: number) => Math.round(max - pos * span);

  // Position d'une poignée, bornée par l'autre (début ≤ fin, une même année possible).
  const clampPos = (which: 0 | 1, pos: number) =>
    which === 1 ? Math.min(Math.max(pos, 0), toPos(value[0])) : Math.max(Math.min(pos, 1), toPos(value[1]));

  const move = (which: 0 | 1, clientY: number) => {
    const r = track.current!.getBoundingClientRect();
    const pos = clampPos(which, (clientY - r.top) / r.height);
    setDrag({ which, pos });
    const y = toYear(pos);
    if (y !== value[which]) onChange(which === 0 ? [y, value[1]] : [value[0], y]);
  };

  const step = (which: 0 | 1, d: number) => {
    const y = Math.min(max, Math.max(min, value[which] + d));
    if (which === 0 && y <= value[1]) onChange([y, value[1]]);
    if (which === 1 && y >= value[0]) onChange([value[0], y]);
  };

  const posOf = (which: 0 | 1) => (drag?.which === which ? drag.pos : toPos(value[which]));
  const top = posOf(1);
  const bottom = posOf(0);
  const ease = "transition-[top,height] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

  return (
    <div
      className="fixed right-3 top-1/2 z-20 h-[min(40vh,320px)] -translate-y-1/2 select-none sm:right-6"
      role="group"
      aria-label="Filtrer les projets par année"
    >
      {/* ligne et poignées ; la zone sensible est plus large que le trait */}
      <div
        ref={track}
        className="relative h-full w-6 cursor-pointer touch-none"
        onPointerDown={(e) => {
          // appui sur la ligne : la poignée la plus proche saute là et suit le glisser
          const r = track.current!.getBoundingClientRect();
          const pos = (e.clientY - r.top) / r.height;
          track.current!.setPointerCapture(e.pointerId);
          // poignées superposées et appui dessus : c'est le sens du glisser qui choisira laquelle bouge
          if (Math.abs(top - bottom) < 0.001 && Math.abs(pos - top) * r.height < 12) {
            start.current = e.clientY;
            return;
          }
          move(Math.abs(pos - top) <= Math.abs(pos - bottom) ? 1 : 0, e.clientY);
        }}
        onPointerMove={(e) => {
          if (start.current !== null) {
            if (Math.abs(e.clientY - start.current) < 3) return;
            const which = e.clientY > start.current ? 0 : 1; // vers le bas : l'année de début
            start.current = null;
            move(which, e.clientY);
          } else if (drag) move(drag.which, e.clientY);
        }}
        onPointerUp={() => { start.current = null; setDrag(null); }}
        onPointerCancel={() => { start.current = null; setDrag(null); }}
      >
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/15" />
        {/* un point discret par année */}
        {years.map((y) => (
          <span
            key={y}
            aria-hidden
            className="absolute left-1/2 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/30"
            style={{ top: `${toPos(y) * 100}%` }}
          />
        ))}
        <span
          aria-hidden
          className={cn("absolute left-1/2 w-px -translate-x-1/2 bg-foreground", !drag && ease)}
          style={{ top: `${top * 100}%`, height: `${(bottom - top) * 100}%` }}
        />
        {([1, 0] as const).map((which) => (
          <span
            key={which}
            role="slider"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label={which === 1 ? "année de fin" : "année de début"}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value[which]}
            onKeyDown={(e) => {
              const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
              if (!d) return;
              e.preventDefault();
              e.stopPropagation(); // le canvas se déplace aussi aux flèches
              step(which, d);
            }}
            className={cn(
              "absolute left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground outline-none ring-2 ring-background focus-visible:ring-foreground/20",
              !drag && "transition-[top] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            )}
            style={{ top: `${posOf(which) * 100}%` }}
          >
            {/* l'année retenue, à côté de sa poignée (une seule si début = fin) */}
            {(which === 1 || value[0] !== value[1]) && (
              <span
                aria-hidden
                className="pointer-events-none absolute right-full top-1/2 mr-2.5 -translate-y-1/2 text-[11px] font-semibold leading-none tabular-nums [text-shadow:0_0_4px_var(--background),0_0_8px_var(--background)]"
              >
                {value[which]}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
