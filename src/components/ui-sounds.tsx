"use client";

import { useEffect, useState } from "react";
import { setSoundOn, soundOn, sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

// Branche les sons sur tout le site par délégation d'événements :
// survol des cartes (souris seulement), clics, ouverture d'un projet.
export function UiSounds() {
  useEffect(() => {
    let lastHover: Element | null = null;
    let lastAt = 0;
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const card = (e.target as Element).closest?.("a[data-slug], a[href*='/projets/']");
      if (!card || card === lastHover) return;
      lastHover = card;
      const now = performance.now();
      if (now - lastAt < 70) return; // pas de crépitement en balayant vite
      lastAt = now;
      sounds.hover();
    };
    const click = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.("a, button");
      if (!el || el.getAttribute("role") === "switch") return; // l'interrupteur a son propre son
      const href = el.getAttribute("href") ?? "";
      if (href.includes("/projets/")) sounds.open();
      else sounds.click();
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
  // eslint-disable-next-line react-hooks/set-state-in-effect -- préférence lue après l'hydratation
  useEffect(() => setOn(soundOn()), []);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Couper les sons" : "Activer les sons"}
      onClick={() => {
        setSoundOn(!on);
        setOn(!on);
      }}
      className={cn("grid size-7 place-items-center", on ? "text-foreground" : "text-muted-foreground", className)}
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
