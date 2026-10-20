import raw from "@/data/projects.json";
import { texts } from "@/data/texts";

export type ProjectImage = { src: string; width: number; height: number };
export type ProjectText = {
  year: string | null;
  context: string | null;
  team?: string; // projet d'équipe : les membres, affichés à part pour garder le contexte court
  ensaama?: string; // page du site de l'ENSAAMA sur ce projet (ou sa formation) : lien sur « ensaama »
  themes: string[];
  intro: string;
  captions: string[];
};
export type ProjectVideo = { src: string; poster: string };
export type Project = {
  slug: string;
  title: string;
  cover: ProjectImage;
  images: ProjectImage[];
  text?: ProjectText;
  video?: ProjectVideo;
};

// Les dossiers Behance n'ont pas d'accents : titres d'affichage corrigés ici.
const TITLES: Record<string, string> = {
  ephemeride: "Éphéméride",
  "la-societe-de-jeux": "La société de jeux",
  "porte-cle-jeton-de-caddie": "Porte-clé jeton de caddie",
  "recolteur-pomme-de-pin": "Récolteur pomme de pin",
  "fish-eye": "Fish-Eye",
  echappee: "Échappée · Range Rover",
  "open-mind": "Open Mind · Muuto",
  ratp: "Du bout des doigts · RATP",
  "de-passager-a-equipier": "De passager à équipier · Bénéteau",
  ludilove: "LudiLove",
  "cafetiere-au-beurre": "Cafetière au beurre",
};

// Projets présentés d'abord par une vidéo (public/videos/<slug>.mp4 + .jpg).
const VIDEOS = new Set(["ludilove", "de-passager-a-equipier"]);

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
const withBase = (img: ProjectImage) => ({ ...img, src: asset(img.src) });

export const projects: Project[] = (raw as Project[]).map((p) => ({
  ...p,
  title: TITLES[p.slug] ?? p.title,
  cover: withBase(p.cover),
  images: p.images.map(withBase),
  text: texts[p.slug],
  video: VIDEOS.has(p.slug)
    ? { src: asset(`/videos/${p.slug}.mp4`), poster: asset(`/videos/${p.slug}.jpg`) }
    : undefined,
}));

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
