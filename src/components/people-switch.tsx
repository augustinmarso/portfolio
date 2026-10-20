"use client";

import { cn } from "@/lib/utils";

// Interrupteur glissant : à gauche l'objet seul, à droite les personnes.
export function PeopleSwitch({ people, onChange }: { people: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={people}
      aria-label={people ? "Vignettes avec les personnes" : "Vignettes avec l'objet seul"}
      onClick={() => onChange(!people)}
      className="relative grid h-9 w-[5.25rem] shrink-0 grid-cols-2 items-center rounded-full bg-foreground/10 p-0.5"
    >
      {/* curseur qui glisse */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0.5 top-0.5 size-8 rounded-full bg-foreground shadow-sm",
          "transition-transform duration-500 ease-[cubic-bezier(0.32,1.4,0.5,1)]",
          people && "translate-x-[3rem]"
        )}
      />
      {/* objet : un cube */}
      <svg viewBox="0 0 24 24" aria-hidden className={cn("relative z-10 mx-auto size-[1.15rem] transition-colors duration-300", people ? "text-muted-foreground" : "text-background")} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
        <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z" />
        <path d="M4 7.5 12 12l8-4.5M12 12v9" />
      </svg>
      {/* personnes : un groupe */}
      <svg viewBox="0 0 24 24" aria-hidden className={cn("relative z-10 mx-auto size-[1.15rem] transition-colors duration-300", people ? "text-background" : "text-muted-foreground")} fill="currentColor">
        <circle cx="12" cy="7" r="3.2" />
        <path d="M5.5 20c.4-3.7 3-6 6.5-6s6.1 2.3 6.5 6Z" />
        <circle cx="4.8" cy="9.6" r="2.3" opacity=".75" />
        <circle cx="19.2" cy="9.6" r="2.3" opacity=".75" />
        <path d="M.6 19c.2-2.6 1.8-4.3 4.2-4.3 1 0 1.9.3 2.6.8-1.3 1-2.2 2.2-2.6 3.5ZM23.4 19c-.2-2.6-1.8-4.3-4.2-4.3-1 0-1.9.3-2.6.8 1.3 1 2.2 2.2 2.6 3.5Z" opacity=".75" />
      </svg>
    </button>
  );
}
