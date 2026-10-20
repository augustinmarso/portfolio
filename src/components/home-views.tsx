"use client";

import { useState } from "react";
import { HoverExpand } from "@/components/hover-expand";
import { InfiniteCanvas } from "@/components/infinite-canvas";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects";

type View = "canvas" | "galerie";

// Deux façons de parcourir l'index : le canvas infini ou la galerie à panneaux.
export function HomeViews({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<View>("canvas");

  return (
    <>
      {view === "canvas" ? (
        <InfiniteCanvas projects={projects} />
      ) : (
        <div className="fixed inset-x-4 bottom-14 top-32 sm:inset-x-6 sm:top-36">
          <HoverExpand projects={projects} />
        </div>
      )}

      <div className="fixed bottom-4 left-4 right-4 z-10 flex items-center justify-end sm:justify-between text-sm font-semibold sm:bottom-5 sm:left-6 sm:right-6">
        <p className="pointer-events-none hidden text-muted-foreground sm:block">
          {view === "canvas" ? "glisser pour explorer, cliquer pour ouvrir" : "survoler pour ouvrir un panneau"}
        </p>
        <div className="flex gap-4 text-base">
          {(["canvas", "galerie"] as const).map((v) => (
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
