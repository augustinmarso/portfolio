"use client";

import { useEffect, useRef, useState } from "react";
import { SOUND_EVENT, VOLUME_EVENT, getVolume, setSoundOn, setVolume, soundOn, sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

// Branche les sons sur tout le site par délégation d'événements :
// survol des cartes (souris seulement), clics, ouverture d'un projet.
export function UiSounds() {
  useEffect(() => {
    let lastHover: Element | null = null;
    let lastAt = 0;
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target as Element;
      // boutons et liens des barres de menu : son grave et feutré
      const barItem = target.closest?.("[data-sound='barre'] a, [data-sound='barre'] button");
      const card = barItem ? null : target.closest?.("a[data-slug], a[href*='/projets/']");
      const el = barItem ?? card;
      if (!el || el === lastHover) return;
      lastHover = el;
      const now = performance.now();
      if (now - lastAt < 110) return; // pas de crépitement en balayant vite
      lastAt = now;
      if (barItem) sounds.barHover(e.clientX);
      else sounds.hover(e.clientX, e.clientY);
    };
    const click = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.("a, button");
      if (!el || el.getAttribute("role") === "switch") return; // l'interrupteur a son propre son
      const href = el.getAttribute("href") ?? "";
      if (href.includes("/projets/")) sounds.open(e.clientX);
      else if (el.closest("[data-sound='barre']")) sounds.bar(e.clientX); // menus : son plus grave
      else sounds.click(e.clientX);
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("click", click, true);
    };
  }, []);
  return null;
}

// Haut-parleur et volume : les trois traits ondulent tant que le son joue et leur nombre suit
// le volume. Clic : coupe / rétablit. Maintenu et glissé : gauche baisse (jusqu'à zéro), droite monte.
export function SoundToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(true);
  const [vol, setVol] = useState(0.7);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- préférences lues après l'hydratation
    setOn(soundOn());
    setVol(getVolume());
    const syncOn = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    const syncVol = (e: Event) => setVol((e as CustomEvent<number>).detail);
    window.addEventListener(SOUND_EVENT, syncOn);
    window.addEventListener(VOLUME_EVENT, syncVol);
    return () => {
      window.removeEventListener(SOUND_EVENT, syncOn);
      window.removeEventListener(VOLUME_EVENT, syncVol);
    };
  }, []);

  const level = on ? vol : 0;
  const lit = level === 0 ? 0 : Math.max(1, Math.ceil(level * 3)); // traits allumés

  return (
    <button
      type="button"
      aria-label={on ? `Volume ${Math.round(vol * 100)} % — cliquer pour couper, glisser pour régler` : "Activer les sons"}
      aria-pressed={on}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, start: on ? vol : 0, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (!d.moved && Math.abs(dx) < 4) return;
        d.moved = true;
        setDragging(true);
        const v = Math.min(1, Math.max(0, d.start + dx / 90)); // 90 px = tout le réglage
        setVolume(v);
        if (v === 0 && on) setSoundOn(false);
        if (v > 0 && !on) setSoundOn(true);
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        setDragging(false);
        if (d && !d.moved) {
          // clic simple : coupe, ou rétablit (avec un volume audible si on était à zéro)
          if (on) setSoundOn(false);
          else {
            if (getVolume() < 0.05) setVolume(0.5);
            setSoundOn(true);
          }
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") setVolume(vol + 0.1);
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") setVolume(vol - 0.1);
      }}
      className={cn(
        "relative grid size-6 cursor-ew-resize touch-none select-none place-items-center sm:size-7",
        on ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4 overflow-visible" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5h3.5L11 5.5v13l-4.5-4H3Z" fill="currentColor" />
        {level === 0 ? (
          <path d="m15 9.5 5 5m0-5-5 5" />
        ) : (
          [
            "M14 10a2.8 2.8 0 0 1 0 4",
            "M16.6 7.8a6 6 0 0 1 0 8.4",
            "M19.2 5.6a9.2 9.2 0 0 1 0 12.8",
          ].map((d, i) => (
            <path
              key={d}
              d={d}
              className={cn("transition-opacity duration-300", i < lit && "sound-wave")}
              style={{ opacity: i < lit ? undefined : 0.15, animationDelay: `${i * 0.18}s` }}
            />
          ))
        )}
      </svg>
      {/* pourcentage pendant le réglage */}
      {dragging && (
        <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded-sm bg-foreground px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-background">
          {Math.round(level * 100)} %
        </span>
      )}
    </button>
  );
}
