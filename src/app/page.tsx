import { HomeViews } from "@/components/home-views";
import { SiteHeader } from "@/components/site-header";
import { projects } from "@/lib/projects";

export default function Home() {
  return (
    <main className="relative h-dvh overflow-hidden">
      <HomeViews projects={projects} />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 bg-gradient-to-b from-background via-background/90 to-transparent px-4 pb-10 pt-4 sm:px-6">
        <div className="pointer-events-auto">
          <SiteHeader active="/" size="md" />
        </div>
      </div>
    </main>
  );
}
