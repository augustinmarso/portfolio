import type { Metadata } from "next";
import { absolute } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { PlateCarousel } from "@/components/plate-carousel";
import { ProcessTimeline, TimelineDot } from "@/components/process-timeline";
import { getProject } from "@/lib/projects";
import data from "@/data/pages/processus.json";

export const metadata: Metadata = {
  title: "Processus",
  description:
    "Processus de design d'Augustin Marsollier : observer, chercher, maquetter, prototyper et transmettre, de l'usage au prototype, racontés étape par étape.",
  alternates: { canonical: absolute("/processus/") },
  openGraph: { url: absolute("/processus/"), title: "Processus — Augustin Marsollier" },
};

// Contenu dans pages/processus.json (modifiable depuis l'éditeur en ligne).
// `exemples` : une planche par ligne, « slug-du-projet indice-de-la-planche » ; `image` : même format,
// une grande planche qui prend la place de la note.
type Etape = {
  titre: string;
  sousEtapes?: string[];
  texte: string;
  outils: string;
  note?: string;
  image?: string;
  livrables?: string;
  exemples?: string[];
};
// Champs facultatifs : l'éditeur en ligne peut les retirer du JSON sans casser la construction.
const page: { surtitre: string; titre: string; allersRetours?: string; intro?: string; inspirations?: string; etapes: Etape[] } = data;
const ETAPES = page.etapes;

// Les planches introuvables (projet retiré, planche supprimée) sont simplement ignorées.
function plate(line: string) {
  const [slug, n] = line.trim().split(/\s+/);
  const project = getProject(slug);
  const img = project?.images[Number(n)];
  return project && img ? [{ project, img }] : [];
}
const exemples = (e: Etape) => (e.exemples ?? []).flatMap(plate);

export default function ProcessusPage() {
  return (
    <main className="px-4 pb-24 pt-4 sm:px-6">
      <SiteHeader active="/processus" />

      <header className="pt-10 sm:pt-16">
        <p className="text-lg font-semibold tracking-tight text-muted-foreground">{page.surtitre}</p>
        <h1 className="mt-4 max-w-[18ch] text-[clamp(40px,7.5vw,120px)] font-bold leading-[0.95] tracking-[-0.05em]">
          {page.titre}
        </h1>
        {page.allersRetours && (
          <p className="mt-6 flex max-w-[52ch] gap-3 text-lg font-semibold tracking-tight text-muted-foreground">
            <span aria-hidden>↺</span>
            {page.allersRetours}
          </p>
        )}
        {page.intro && (
          <p className="mt-8 max-w-[52ch] text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{page.intro}</p>
        )}
      </header>

      <ProcessTimeline className="mt-20 text-lg font-semibold leading-snug tracking-tight sm:mt-28 sm:text-xl">
        {ETAPES.map((e, i) => {
          const ex = exemples(e);
          // carrousel des planches : l'image d'étape (sinon le premier exemple) en tête, puis les autres
          const lead = (e.image ? plate(e.image)[0] : undefined) ?? ex[0];
          const plates = lead ? [lead, ...ex.filter((x) => x.img.src !== lead.img.src)] : [];
          const slides = plates.map(({ project, img }) => ({
            ...img,
            href: `/projets/${project.slug}/processus`,
            alt: `${e.titre} : planche`,
          }));
          return (
            <li key={e.titre} id={`etape-${i + 1}`} className="relative min-w-0 scroll-mt-24">
              <TimelineDot />
              <h2 className="text-[clamp(44px,6vw,112px)] font-bold leading-[0.9] tracking-[-0.05em]">
                <span className="block text-2xl tracking-tight text-muted-foreground sm:text-3xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {e.titre}
              </h2>
              {e.sousEtapes && (
                <ol className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm font-normal uppercase tracking-wide text-muted-foreground">
                  {e.sousEtapes.map((t, k) => (
                    <li key={t}>
                      {i + 1}.{k + 1} {t}
                    </li>
                  ))}
                </ol>
              )}
              <div className="mt-6 grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <p className="max-w-[62ch] font-normal leading-relaxed">{e.texte}</p>
                <div className="min-w-0">
                  {slides.length > 0 ? (
                    <PlateCarousel slides={slides} />
                  ) : (
                    e.note && <p className="text-2xl leading-tight sm:text-3xl">« {e.note} »</p>
                  )}
                  <p className="mt-4 text-base font-normal text-muted-foreground sm:text-lg">{e.outils}</p>
                  {e.livrables && (
                    <p className="mt-3 text-base sm:text-lg">
                      <span className="block font-mono text-sm font-normal uppercase tracking-wide text-muted-foreground">
                        jalon {i + 1} · à valider ensemble
                      </span>
                      {e.livrables}
                    </p>
                  )}
                </div>
              </div>
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
