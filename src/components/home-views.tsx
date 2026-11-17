"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { InfiniteCanvas, type PeopleMode } from "@/components/infinite-canvas";
import { PeopleSwitch } from "@/components/people-switch";
import { YearRange } from "@/components/year-range";

// Vues secondaires chargées seulement quand on les ouvre (le canvas s'affiche seul au départ).
const HoverExpand = dynamic(() => import("@/components/hover-expand").then((m) => m.HoverExpand), { ssr: false });
const MindMap = dynamic(() => import("@/components/mind-map").then((m) => m.MindMap), { ssr: false });
const ScrollRing = dynamic(() => import("@/components/scroll-ring").then((m) => m.ScrollRing), { ssr: false });
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects";

const VIEWS = ["canvas", "galerie", "scroll", "arborescence"] as const;
type View = (typeof VIEWS)[number];

// Quatre façons de parcourir l'index : le canvas infini, la galerie à panneaux,
// l'anneau qui défile ou l'arborescence des thèmes.
export function HomeViews({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<View>("canvas");
  // Vignettes en paire : objet seul (par défaut) ou avec les personnes ; le survol montre l'autre.
  const [people, setPeople] = useState<PeopleMode>(false);
  // ?vue=arborescence (liens des thèmes) ouvre directement le bon mode. Lu après l'hydratation :
  // la page est exportée en statique, l'adresse n'est connue que dans le navigateur.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("vue");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (VIEWS.includes(v as View)) setView(v as View);
  }, []);
  // Galerie : du plus récent au plus ancien (projets sans année à la fin).
  const byDate = useMemo(
    () => [...projects].sort((a, b) => Number(b.text?.year ?? 0) - Number(a.text?.year ?? 0)),
    [projects]
  );

  // Période choisie sur la ligne des années (toutes au départ).
  const years = useMemo(
    () => [...new Set(projects.map((p) => Number(p.text?.year)).filter(Boolean))].sort((a, b) => a - b),
    [projects]
  );
  const [range, setRange] = useState<[number, number]>([years[0], years[years.length - 1]]);
  // projet sans année : toujours affiché
  const inRange = (p: Project) => !p.text?.year || (Number(p.text.year) >= range[0] && Number(p.text.year) <= range[1]);
  // Canvas et galerie gardent leur mise en page : les projets hors période s'effacent sur place (CSS).
  // L'anneau et l'arborescence se recomposent avec les seuls projets retenus.
  const hiddenYears = years.filter((y) => y < range[0] || y > range[1]);
  const hideCss = hiddenYears.length
    ? hiddenYears.map((y) => `.canvas-card[data-year="${y}"],.hx-panel[data-year="${y}"]`).join(",") +
      "{pointer-events:none}" +
      hiddenYears.map((y) => `.canvas-card[data-year="${y}"]>*`).join(",") +
      "{opacity:0;filter:blur(6px)}" +
      hiddenYears.map((y) => `.hx-panel[data-year="${y}"]`).join(",") +
      "{flex-grow:0!important;opacity:0}"
    : "";
  const ringProjects = useMemo(() => byDate.filter(inRange), [byDate, range]); // eslint-disable-line react-hooks/exhaustive-deps
  const mapProjects = useMemo(() => projects.filter(inRange), [projects, range]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {hideCss && <style>{hideCss}</style>}
      {view === "canvas" ? (
        <InfiniteCanvas projects={projects} people={people} />
      ) : view === "scroll" ? (
        <ScrollRing projects={ringProjects} />
      ) : view === "arborescence" ? (
        <div className="fixed bottom-24 left-4 right-16 top-16 sm:bottom-16 sm:left-6 sm:right-24">
          <MindMap projects={mapProjects} className="h-full" />
        </div>
      ) : (
        <div className="fixed bottom-24 left-4 right-16 top-16 sm:bottom-16 sm:left-6 sm:right-24 sm:top-36">
          <HoverExpand projects={byDate} />
        </div>
      )}

      {years.length > 1 && <YearRange years={years} value={range} onChange={setRange} />}

      {/* Barre du bas : bande blanche pleine largeur, calée en bas, rien ne passe dessous.
          Téléphone : boutons « personne / les gens » au-dessus, les quatre vues réparties sur la largeur. */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 bg-background px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 text-[clamp(12px,3.3vw,15px)] font-semibold sm:px-6 sm:pb-3 sm:text-base">
        <p className="pointer-events-none hidden text-sm text-muted-foreground sm:block">
          {view === "canvas"
            ? "glisser pour explorer, cliquer pour ouvrir"
            : view === "scroll"
              ? "molette ou glisser pour tourner l'anneau"
              : view === "arborescence"
                ? "cliquer un thème pour l'ouvrir, un projet pour le voir"
                : "survoler pour ouvrir un panneau"}
        </p>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:flex-none sm:justify-end sm:gap-8">
          <div className="order-last flex shrink-0 items-center gap-1 sm:order-none sm:gap-3">
            {view === "canvas" && <PeopleSwitch people={people} onChange={setPeople} />}
          </div>
          <div className="flex min-w-0 flex-1 justify-between gap-2 sm:flex-none sm:justify-end sm:gap-4">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(view === v ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
