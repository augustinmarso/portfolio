import { HomeViews } from "@/components/home-views";
import { SiteHeader } from "@/components/site-header";
import { projects } from "@/lib/projects";

export default function Home() {
  return (
    <main className="relative h-dvh overflow-hidden">
      <HomeViews projects={projects} />

      <SiteHeader active="/" />
    </main>
  );
}
