import type { Metadata } from "next";
import { absolute } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import page from "@/data/pages/processus.json";

export const metadata: Metadata = {
  title: "Processus",
  description:
    "Processus de design d'Augustin Marsollier : observer, chercher, maquetter, prototyper et transmettre, de l'usage au prototype.",
  alternates: { canonical: absolute("/processus/") },
  openGraph: { url: absolute("/processus/"), title: "Processus — Augustin Marsollier" },
};

// Contenu dans pages/processus.json (modifiable depuis l'éditeur en ligne).
const ETAPES: { titre: string; texte: string; outils: string }[] = page.etapes;

export default function ProcessusPage() {
  return (
    <main className="px-4 pb-24 pt-4 sm:px-6">
      <SiteHeader active="/processus" />

      <header className="pt-10 sm:pt-16">
        <p className="text-lg font-semibold tracking-tight text-muted-foreground">{page.surtitre}</p>
        <h1 className="mt-4 max-w-[18ch] text-[clamp(40px,7.5vw,120px)] font-bold leading-[0.95] tracking-[-0.05em]">
          {page.titre}
        </h1>
      </header>

      <ol className="mt-16 grid gap-16 text-lg font-semibold leading-snug tracking-tight sm:mt-24 sm:text-xl">
        {ETAPES.map((e, i) => (
          <li key={e.titre} className="grid gap-x-10 gap-y-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <h2 className="flex items-baseline gap-4 text-2xl sm:text-3xl">
              <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              {e.titre}
            </h2>
            <div className="max-w-[62ch]">
              <p className="font-normal leading-relaxed">{e.texte}</p>
              <p className="mt-3 text-base font-normal text-muted-foreground sm:text-lg">{e.outils}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
