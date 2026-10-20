"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects";

// Galerie de panneaux qui s'ouvrent au survol (dans l'esprit de skiper35) :
// bandes étroites côte à côte, celle survolée s'élargit et révèle l'image et le titre.
export function HoverExpand({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex h-full w-full flex-col gap-1.5 md:flex-row">
      {projects.map((p, i) => {
        const open = i === active;
        return (
          <Link
            key={p.slug}
            href={`/projets/${p.slug}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            className={cn(
              "group relative min-h-0 min-w-0 overflow-hidden bg-muted outline-none",
              "transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "grow-[12]" : "grow"
            )}
            style={{ flexBasis: 0 }}
          >
            <Image
              src={p.cover.src}
              alt={p.title}
              fill
              sizes="(min-width: 768px) 60vw, 100vw"
              className={cn(
                "object-cover transition-[filter,transform] duration-700",
                open ? "scale-100 grayscale-0" : "scale-110 grayscale"
              )}
            />
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/60 to-transparent p-4 pt-16 text-white transition-opacity duration-500",
                open ? "opacity-100 delay-200" : "opacity-0"
              )}
            >
              <span className="text-2xl font-bold lowercase leading-none tracking-tight sm:text-3xl">{p.title}</span>
              <span className="shrink-0 text-sm font-semibold">{p.text?.year}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
