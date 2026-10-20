import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { InfiniteCanvas } from "@/components/infinite-canvas";
import { ProjectIndex } from "@/components/project-index";
import { projects } from "@/lib/projects";

export default function Home() {
  return (
    <main className="relative h-dvh overflow-hidden">
      <InfiniteCanvas projects={projects} />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-10 flex items-start justify-between p-4 sm:p-6">
        <div className="pointer-events-auto bg-background/85 px-3 py-2 backdrop-blur">
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">Augustin Marsollier</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Design d&apos;objet &amp; de service</p>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <ProjectIndex projects={projects} />
          <Link href="/contact" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Contact
          </Link>
        </div>
      </header>

      <p className="pointer-events-none fixed bottom-4 left-1/2 z-10 -translate-x-1/2 bg-background/85 px-3 py-1.5 text-xs text-blue backdrop-blur sm:bottom-6">
        Glisser pour explorer — cliquer pour ouvrir
      </p>
    </main>
  );
}
