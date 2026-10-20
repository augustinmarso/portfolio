import { InfiniteCanvas } from "@/components/infinite-canvas";
import { SiteHeader } from "@/components/site-header";
import { projects } from "@/lib/projects";

export default function Home() {
  return (
    <main className="relative h-dvh overflow-hidden">
      <InfiniteCanvas projects={projects} />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 bg-gradient-to-b from-background via-background/90 to-transparent px-4 pb-10 pt-4 sm:px-6">
        <div className="pointer-events-auto">
          <SiteHeader active="/" size="md" />
        </div>
      </div>

      <p className="pointer-events-none fixed bottom-4 left-4 z-10 text-sm font-semibold text-muted-foreground sm:bottom-6 sm:left-6">
        glisser pour explorer, cliquer pour ouvrir
      </p>
    </main>
  );
}
