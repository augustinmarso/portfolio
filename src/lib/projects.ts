import raw from "@/data/projects.json";
import site from "@/data/site.json";
import { texts } from "@/data/texts";

export type ProjectImage = { src: string; sm?: string; width: number; height: number };
export type ProjectText = {
  year: string | null;
  context: string | null;
  team?: string; // projet d'équipe : les membres, affichés à part pour garder le contexte court
  ensaama?: string; // page du site de l'ENSAAMA sur ce projet (ou sa formation) : lien sur « ensaama »
  themes: string[];
  intro: string;
  captions: string[];
  processus?: number[]; // indices des planches de l'onglet « processus » (les autres vont dans « produit »)
};
export type ProjectVideo = { src: string; poster: string };
export type Project = {
  slug: string;
  title: string;
  cover: ProjectImage;
  images: ProjectImage[];
  text?: ProjectText;
  hover?: ProjectImage; // image montrée au survol dans l'index (quelqu'un qui utilise l'objet…)
  video?: ProjectVideo;
};

// Titres d'affichage (les dossiers n'ont pas d'accents) et projets à vidéo : réglés dans site.json,
// modifiable depuis l'éditeur en ligne. Vidéo : public/videos/<slug>.mp4 + .jpg.
const TITLES: Record<string, string> = site.titles;
const VIDEOS = new Set<string>(site.videos);


export const THEMES = [
  "objet",
  "service",
  "jeu",
  "mobilier",
  "numérique",
  "packaging",
  "espace public",
  "enfance",
  "nature",
  "rituel",
] as const;

// next/image n'ajoute pas le basePath aux images non optimisées : on le préfixe ici.
export const asset = (src: string) => (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + src;
const withBase = (img: ProjectImage) => ({ ...img, src: asset(img.src), sm: img.sm && asset(img.sm) });

export const projects: Project[] = (raw as Project[]).map((p) => ({
  ...p,
  title: TITLES[p.slug] ?? p.title,
  cover: withBase(p.cover),
  images: p.images.map(withBase),
  text: texts[p.slug],
  hover: p.hover && withBase(p.hover),
  video: VIDEOS.has(p.slug)
    ? { src: asset(`/videos/${p.slug}.mp4`), poster: asset(`/videos/${p.slug}.jpg`) }
    : undefined,
}));

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

// Onglets d'un projet : « produit » (l'objet fini) et « processus » (recherche, croquis, maquettes,
// fabrication). Le classement de chaque planche se règle dans l'éditeur en ligne.
export type ProjectView = "produit" | "processus";

export function viewIndices(project: Project, view: ProjectView): number[] {
  const proc = project.text?.processus ?? [];
  return project.images.map((_, n) => n).filter((n) => proc.includes(n) === (view === "processus"));
}
