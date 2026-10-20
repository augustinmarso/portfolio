import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectGraph } from "@/components/project-graph";
import { SiteHeader } from "@/components/site-header";
import { projects } from "@/lib/projects";

export const metadata: Metadata = { title: "Arborescence — Augustin Marsollier" };

export default function ArborescencePage() {
  return (
    <main className="min-h-dvh bg-[#f4f3ee] px-4 pb-6 pt-4 sm:px-6">
      <SiteHeader active="/arborescence" size="md" />
      <div className="pt-6">
        <Suspense>
          <ProjectGraph projects={projects} />
        </Suspense>
      </div>
    </main>
  );
}
