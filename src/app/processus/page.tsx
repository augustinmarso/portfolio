import type { Metadata } from "next";
import { absolute } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Processus",
  description:
    "Processus de design d'Augustin Marsollier : observer, chercher, maquetter, prototyper et transmettre, de l'usage au prototype.",
  alternates: { canonical: absolute("/processus/") },
  openGraph: { url: absolute("/processus/"), title: "Processus — Augustin Marsollier" },
};

// Première version : les étapes et leurs textes sont à ajuster.
const ETAPES: { titre: string; texte: string; outils: string }[] = [
  {
    titre: "observer",
    texte:
      "Partir des personnes et de leurs gestes plutôt que de l'objet. Aller sur le terrain, regarder comment on fait aujourd'hui, noter ce qui coince.",
    outils: "entretiens, photos, croquis d'usage",
  },
  {
    titre: "chercher",
    texte:
      "Ouvrir large avant de choisir : références, matériaux, histoire des objets voisins. Beaucoup d'idées dessinées vite, peu gardées.",
    outils: "carnet, planches de recherche, bibliothèques",
  },
  {
    titre: "maquetter",
    texte:
      "Passer au volume le plus tôt possible. Carton, bois, impression rapide : la maquette dit tout de suite ce que le dessin cache.",
    outils: "carton, découpe laser, impression 3D",
  },
  {
    titre: "prototyper",
    texte:
      "Modéliser au millimètre, fabriquer, tester avec les personnes concernées, recommencer. Le projet se règle par allers-retours.",
    outils: "Rhino, Fusion 360, atelier",
  },
  {
    titre: "transmettre",
    texte:
      "Rendre le projet lisible pour celui qui le fabrique comme pour celui qui l'utilise : rendus, plans, notices, mise en page.",
    outils: "Blender, plans de fabrication, édition",
  },
];

export default function ProcessusPage() {
  return (
    <main className="px-4 pb-24 pt-4 sm:px-6">
      <SiteHeader active="/processus" />

      <header className="pt-10 sm:pt-16">
        <p className="text-lg font-semibold tracking-tight text-muted-foreground">méthode · design produit</p>
        <h1 className="mt-4 max-w-[18ch] text-[clamp(40px,7.5vw,120px)] font-bold leading-[0.95] tracking-[-0.05em]">
          de l’usage au prototype
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
