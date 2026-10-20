"use client";

import { useEffect, useMemo, useState } from "react";
import { HoverExpand } from "@/components/hover-expand";
import { InfiniteCanvas } from "@/components/infinite-canvas";
import { MindMap } from "@/components/mind-map";
import { ScrollRing } from "@/components/scroll-ring";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects";

const VIEWS = ["canvas", "galerie", "scroll", "arborescence"] as const;
type View = (typeof VIEWS)[number];

// Quatre façons de parcourir l'index : le canvas infini, la galerie à panneaux,
// l'anneau qui défile ou l'arborescence des thèmes.
export function HomeViews({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<View>("canvas");
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

  return (
    <>
      {view === "canvas" ? (
        <InfiniteCanvas projects={projects} />
      ) : view === "scroll" ? (
        <ScrollRing projects={byDate} />
      ) : view === "arborescence" ? (
        <div className="fixed inset-x-4 bottom-14 top-16 sm:inset-x-6">
          <MindMap projects={projects} className="h-full" />
        </div>
      ) : (
        <div className="fixed inset-x-4 bottom-14 top-32 sm:inset-x-6 sm:top-36">
          <HoverExpand projects={byDate} />
        </div>
      )}

      <div className="fixed bottom-4 left-4 right-4 z-10 flex items-center justify-end sm:justify-between text-sm font-semibold sm:bottom-5 sm:left-6 sm:right-6">
        <p className="pointer-events-none hidden rounded-sm bg-background/90 px-2.5 py-1 text-muted-foreground backdrop-blur sm:block">
          {view === "canvas"
            ? "glisser pour explorer, cliquer pour ouvrir"
            : view === "scroll"
              ? "molette ou glisser pour tourner l'anneau"
              : view === "arborescence"
                ? "cliquer un thème pour l'ouvrir, un projet pour le voir"
                : "survoler pour ouvrir un panneau"}
        </p>
        <div className="flex gap-4 rounded-sm bg-background/90 px-2.5 py-1 text-base backdrop-blur">
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
    </>
  );
}
