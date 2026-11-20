"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { InfiniteCanvas, type PeopleMode } from "@/components/infinite-canvas";
import { PeopleSwitch } from "@/components/people-switch";
import { YearRange } from "@/components/year-range";

// Arborescence chargée seulement quand on l'ouvre (le canvas s'affiche seul au départ).
const MindMap = dynamic(() => import("@/components/mind-map").then((m) => m.MindMap), { ssr: false });
import type { Project } from "@/lib/projects";

type View = "canvas" | "arborescence";

// L'index est le canvas infini. L'arborescence des thèmes ne s'ouvre que par les liens
// des thèmes (/?vue=arborescence) ; un bouton y ramène au canvas.
export function HomeViews({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<View>("canvas");
  // Vignettes en paire : objet seul (par défaut) ou avec les personnes ; le survol montre l'autre.
  const [people, setPeople] = useState<PeopleMode>(false);
  // ?vue=arborescence (liens des thèmes) ouvre directement l'arborescence. Lu après l'hydratation :
  // la page est exportée en statique, l'adresse n'est connue que dans le navigateur.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("vue");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v === "arborescence") setView(v);
  }, []);

  // Période choisie sur la ligne des années (toutes au départ).
  const years = useMemo(
    () => [...new Set(projects.map((p) => Number(p.text?.year)).filter(Boolean))].sort((a, b) => a - b),
    [projects]
  );
  const [range, setRange] = useState<[number, number]>([years[0], years[years.length - 1]]);
  // projet sans année : toujours affiché
  const inRange = (p: Project) => !p.text?.year || (Number(p.text.year) >= range[0] && Number(p.text.year) <= range[1]);
  // Le canvas garde sa mise en page : les projets hors période s'effacent sur place (CSS).
  // L'arborescence se recompose avec les seuls projets retenus.
  const hiddenYears = years.filter((y) => y < range[0] || y > range[1]);
  const hideCss = hiddenYears.length
    ? hiddenYears.map((y) => `.canvas-card[data-year="${y}"]`).join(",") +
      "{pointer-events:none}" +
      hiddenYears.map((y) => `.canvas-card[data-year="${y}"]>*`).join(",") +
      "{opacity:0;filter:blur(6px)}"
    : "";
  const mapProjects = useMemo(() => projects.filter(inRange), [projects, range]); // eslint-disable-line react-hooks/exhaustive-deps

  // Retour au canvas : on retire aussi ?vue=arborescence de l'adresse.
  const backToCanvas = () => {
    setView("canvas");
    window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <>
      {hideCss && <style>{hideCss}</style>}
      {view === "canvas" ? (
        <InfiniteCanvas projects={projects} people={people} />
      ) : (
        <div className="fixed bottom-24 left-4 right-16 top-16 sm:bottom-16 sm:left-6 sm:right-24">
          <MindMap projects={mapProjects} className="h-full" />
        </div>
      )}

      {years.length > 1 && <YearRange years={years} value={range} onChange={setRange} />}

      {/* Barre du bas : bande blanche pleine largeur, calée en bas, rien ne passe dessous.
          Téléphone : boutons « personne / les gens » à droite. */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 bg-background px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 text-[clamp(12px,3.3vw,15px)] font-semibold sm:px-6 sm:pb-3 sm:text-base">
        <p className="pointer-events-none hidden text-sm text-muted-foreground sm:block">
          {view === "canvas"
            ? "glisser pour explorer, cliquer pour ouvrir"
            : "cliquer un thème pour l'ouvrir, un projet pour le voir"}
        </p>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none sm:gap-8">
          {view === "canvas" ? (
            <PeopleSwitch people={people} onChange={setPeople} />
          ) : (
            <button type="button" onClick={backToCanvas} className="text-muted-foreground hover:text-foreground">
              ← retour à l&apos;index
            </button>
          )}
        </div>
      </div>
    </>
  );
}
