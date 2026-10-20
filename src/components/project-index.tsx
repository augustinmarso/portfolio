"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/projects";

// Liste texte des projets : alternative au canvas (clavier, lecteurs d'écran).
export function ProjectIndex({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pointer-events-auto relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        Index
      </Button>
      {open && (
        <nav className="absolute right-0 top-full mt-2 w-64 border bg-background p-2 shadow-sm">
          <ol>
            {projects.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/projets/${p.slug}`}
                  className="block px-2 py-1.5 text-sm hover:bg-muted"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}
