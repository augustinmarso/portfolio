"use client";

import { useEffect, useState } from "react";
import { SOUND_EVENT, setSoundOn, soundOn, sounds } from "@/lib/sounds";
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

// Haut-parleur : coupe ou remet les sons (choix mémorisé dans ce navigateur).
export function SoundToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- préférence lue après l'hydratation
    setOn(soundOn());
    const sync = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener(SOUND_EVENT, sync);
    return () => window.removeEventListener(SOUND_EVENT, sync);
  }, []);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Couper les sons" : "Activer les sons"}
      onClick={() => setSoundOn(!on)}
      className={cn("grid size-6 place-items-center sm:size-7", on ? "text-foreground" : "text-muted-foreground", className)}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor" />
        {on ? (
          <>
            <path d="M15.5 9a4 4 0 0 1 0 6" />
            <path d="M18.3 6.5a7.5 7.5 0 0 1 0 11" />
          </>
        ) : (
          <path d="m16 9.5 5 5m0-5-5 5" />
        )}
      </svg>
    </button>
  );
}
