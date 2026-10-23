import type { Metadata } from "next";
import Link from "next/link";
import { absolute } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { FadeImg } from "@/components/fade-img";
import { ProcessTimeline, TimelineDot } from "@/components/process-timeline";
import { getProject } from "@/lib/projects";
import page from "@/data/pages/processus.json";

export const metadata: Metadata = {
  title: "Processus",
  description:
    "Processus de design d'Augustin Marsollier : observer, chercher, maquetter, prototyper et transmettre, de l'usage au prototype, racontés étape par étape.",
  alternates: { canonical: absolute("/processus/") },
  openGraph: { url: absolute("/processus/"), title: "Processus — Augustin Marsollier" },
};

// Contenu dans pages/processus.json (modifiable depuis l'éditeur en ligne).
// `exemples` : une planche par ligne, « slug-du-projet indice-de-la-planche ».
type Etape = { titre: string; texte: string; outils: string; note?: string; exemples?: string[] };
const ETAPES: Etape[] = page.etapes;

// Les exemples introuvables (projet retiré, planche supprimée) sont simplement ignorés.
function exemples(e: Etape) {
  return (e.exemples ?? []).flatMap((line) => {
    const [slug, n] = line.trim().split(/\s+/);
    const project = getProject(slug);
    const img = project?.images[Number(n)];
    if (!project || !img) return [];
    return [{ project, img }];
  });
}

export default function ProcessusPage() {
  return (
    <main className="px-4 pb-24 pt-4 sm:px-6">
      <SiteHeader active="/processus" />

      <header className="pt-10 sm:pt-16">
        <p className="text-lg font-semibold tracking-tight text-muted-foreground">{page.surtitre}</p>
        <h1 className="mt-4 max-w-[18ch] text-[clamp(40px,7.5vw,120px)] font-bold leading-[0.95] tracking-[-0.05em]">
          {page.titre}
        </h1>
        {page.intro && (
          <p className="mt-8 max-w-[52ch] text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{page.intro}</p>
        )}
      </header>

      <ProcessTimeline className="mt-20 text-lg font-semibold leading-snug tracking-tight sm:mt-28 sm:text-xl">
        {ETAPES.map((e, i) => {
          const ex = exemples(e);
          return (
            <li key={e.titre} id={`etape-${i + 1}`} className="relative min-w-0 scroll-mt-24">
              <TimelineDot />
              <h2 className="text-[clamp(44px,6vw,112px)] font-bold leading-[0.9] tracking-[-0.05em]">
                <span className="block text-2xl tracking-tight text-muted-foreground sm:text-3xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {e.titre}
              </h2>
              <div className="mt-6 grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <p className="max-w-[62ch] font-normal leading-relaxed">{e.texte}</p>
                <div>
                  {e.note && <p className="text-2xl leading-tight sm:text-3xl">« {e.note} »</p>}
                  <p className="mt-4 text-base font-normal text-muted-foreground sm:text-lg">{e.outils}</p>
                </div>
              </div>

              {ex.length > 0 && (
                <ul className="-mr-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-4 sm:-mr-6 sm:pr-6">
                  {ex.map(({ project, img }) => (
                    <li key={img.src} className="shrink-0 snap-start">
                      <Link href={`/projets/${project.slug}/processus`} className="group block">
                        <FadeImg
                          src={img.src}
                          sm={img.sm}
                          alt={`${e.titre} : planche de recherche`}
                          width={img.width}
                          height={img.height}
                          sizes="(min-width: 640px) 480px, 80vw"
                          frameClassName="h-[52vw] max-h-[340px] w-auto overflow-hidden rounded-2xl bg-muted sm:h-[340px]"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ProcessTimeline>

      {page.inspirations && (
        <p className="mt-32 max-w-[62ch] text-lg font-normal leading-relaxed text-muted-foreground">{page.inspirations}</p>
      )}
    </main>
  );
}
