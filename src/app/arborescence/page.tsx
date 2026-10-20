import type { Metadata } from "next";
import { MindMap } from "@/components/mind-map";
import { SiteHeader } from "@/components/site-header";
import { projects } from "@/lib/projects";

export const metadata: Metadata = { title: "Arborescence — Augustin Marsollier" };

export default function ArborescencePage() {
  return (
    <main className="min-h-dvh px-4 pb-6 pt-4 sm:px-6">
      <SiteHeader active="/arborescence" />
      <div className="pt-2">
        <MindMap projects={projects} />
      </div>
    </main>
  );
}
