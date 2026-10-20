"use client";

import { useRef, useState } from "react";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const W = 56; // largeur du rail
const H = 28; // hauteur du rail
const PAD = 3; // marge intérieure
const KNOB = H - PAD * 2; // curseur rond
const TRAVEL = W - PAD * 2 - KNOB; // course du curseur

// Interrupteur objet / personnes : un clic bascule ; maintenu, le curseur suit la souris
// puis se cale du côté le plus proche au relâchement.
export function PeopleSwitch({ people, onChange: set }: { people: boolean; onChange: (v: boolean) => void }) {
  const onChange = (v: boolean) => {
    if (v !== people) sounds.toggle(v);
    set(v);
  };
  const ref = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ startX: number; moved: boolean } | null>(null);
  const [pos, setPos] = useState<number | null>(null); // 0 → 1 pendant le glisser

  const ratioAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left - PAD - KNOB / 2) / TRAVEL));
  };
  const x = (pos ?? (people ? 1 : 0)) * TRAVEL;
  const dragging = pos !== null;

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={people}
      aria-label={people ? "Vignettes avec les personnes" : "Vignettes avec l'objet seul"}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { startX: e.clientX, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        if (Math.abs(e.clientX - d.startX) > 3) d.moved = true;
        if (d.moved) setPos(ratioAt(e.clientX));
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        if (d?.moved) onChange(ratioAt(e.clientX) > 0.5);
        else onChange(!people);
        setPos(null);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setPos(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onChange(true);
        if (e.key === "ArrowLeft") onChange(false);
      }}
      className="relative shrink-0 cursor-pointer touch-none select-none rounded-full bg-foreground/10"
      style={{ width: W, height: H }}
    >
      {/* curseur */}
      <span
        aria-hidden
        className={cn(
          "absolute rounded-full bg-foreground shadow-sm",
          !dragging && "transition-transform duration-500 ease-[cubic-bezier(0.32,1.4,0.5,1)]"
        )}
        style={{ left: PAD, top: PAD, width: KNOB, height: KNOB, transform: `translateX(${x}px)` }}
      />
      {/* icônes, chacune centrée sur une position du curseur */}
      {[false, true].map((side) => {
        const on = dragging ? (pos! > 0.5) === side : people === side;
        return (
          <span
            key={String(side)}
            aria-hidden
            className={cn("absolute grid place-items-center transition-colors duration-300", on ? "text-background" : "text-muted-foreground")}
            style={{ left: PAD + (side ? TRAVEL : 0), top: PAD, width: KNOB, height: KNOB }}
          >
            {side ? (
              // personnes : un groupe
              <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                <circle cx="12" cy="7.5" r="3.4" />
                <path d="M5.2 20.5c.5-4 3.2-6.3 6.8-6.3s6.3 2.3 6.8 6.3Z" />
                <circle cx="4.6" cy="10" r="2.4" opacity=".7" />
                <circle cx="19.4" cy="10" r="2.4" opacity=".7" />
              </svg>
            ) : (
              // objet : un cube
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
                <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z" />
                <path d="M4 7.5 12 12l8-4.5M12 12v9" />
              </svg>
            )}
          </span>
        );
      })}
    </button>
  );
}
