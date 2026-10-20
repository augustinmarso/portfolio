import type { Metadata } from "next";
import { PrintButton } from "@/components/print-button";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "CV — Augustin Marsollier" };

// Contenu repris du CV 2026, mis à jour (DSAA 2026–2027). Pas d'adresse postale publiée.
const SECTIONS: { title: string; items: { when: string; what: string; detail?: string }[] }[] = [
  {
    title: "formation",
    items: [
      { when: "2026 — 2027", what: "DSAA Design Produit", detail: "ENSAAMA, Paris" },
      { when: "2023 — 2026", what: "DN MADE, mention Objet / Service", detail: "ENSAAMA, Paris" },
      { when: "2021 — 2023", what: "Première et Terminale STD2A, bac mention très bien", detail: "ESAAT, Roubaix" },
    ],
  },
  {
    title: "expériences et engagements",
    items: [
      {
        when: "2025",
        what: "Stage chez Bec et Croc",
        detail: "Jeux en bois artisanaux. Trois mois consacrés à la refonte d'un calendrier d'activités pour les EHPAD.",
      },
      {
        when: "2024",
        what: "Maison Magis, Paris",
        detail: "Maraudes auprès de personnes en situation de précarité ; montage vidéo au lab de la radio RCF.",
      },
      {
        when: "2021 — 2022",
        what: "ATD Quart Monde",
        detail: "Bibliothèque de rue hebdomadaire, le jeu comme outil pédagogique et culturel.",
      },
      {
        when: "2020 — 2023",
        what: "Animation d'anniversaires",
        detail: "Une quinzaine d'événements pour des enfants de 6 à 11 ans, jeux et récits créés sur mesure.",
      },
    ],
  },
  {
    title: "compétences",
    items: [
      { when: "3d", what: "Rhino 3D et Grasshopper, Fusion 360, Blender" },
      { when: "rendu", what: "Blender (Cycles), KeyShot, mises en situation photoréalistes" },
      { when: "prototypage", what: "Impression 3D (TPU, PLA), gravure et découpe laser, maquettes" },
      { when: "matériaux", what: "Papier, carton, silicone, bois" },
      { when: "main", what: "Dessin en volume, croquis de recherche" },
      { when: "graphisme", what: "InDesign, Photoshop, Illustrator, Figma" },
      { when: "vidéo", what: "Premiere Pro, montages de présentation" },
      { when: "numérique", what: "Prototypes d'applications et de sites web avec l'IA (Claude Code), automatisation avec n8n" },
      { when: "ia", what: "Prompt engineering (ChatGPT, Nano Banana), images et vidéos génératives" },
    ],
  },
];

export default function CvPage() {
  return (
    <main className="cv-print px-4 pb-16 pt-4 sm:px-6">
      <SiteHeader active="/cv" className="print:hidden" />
      <p className="hidden text-5xl font-bold tracking-[-0.05em] print:block">augustin marsollier</p>

      <div className="grid gap-x-10 gap-y-16 pt-10 text-lg font-semibold leading-snug tracking-tight sm:text-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] print:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] print:gap-y-6 print:pt-6 print:text-[10.5pt]">
        <div className="grid content-start gap-8 print:gap-4">
          <p>
            <span className="print:hidden">
              augustin marsollier,
              <br />
            </span>
            designer produit,
            <br />
            dsaa design produit — ensaama, paris
          </p>
          <p className="font-normal">
            marsollier.augustin@gmail.com
            <br />
            07 49 32 47 31
            <br />
            augustinmarso.github.io/portfolio
          </p>
          <div>
            <PrintButton />
          </div>
        </div>

        <div className="grid gap-14 print:gap-5">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-2xl sm:text-3xl print:text-[15pt]">{s.title}</h2>
              <dl className="mt-6 grid gap-4 print:mt-2 print:gap-1.5">
                {s.items.map((it) => (
                  <div key={it.what} className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-6 print:grid-cols-[7.5rem_1fr] print:gap-4">
                    <dt className="text-muted-foreground">{it.when}</dt>
                    <dd>
                      {it.what}
                      {it.detail && <span className="mt-1 block font-normal text-muted-foreground">{it.detail}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
