import raw from "@/data/projects.json";

export type ProjectImage = { src: string; width: number; height: number };
export type Project = {
  slug: string;
  title: string;
  cover: ProjectImage;
  images: ProjectImage[];
};

// Les dossiers Behance n'ont pas d'accents : titres d'affichage corrigés ici.
const TITLES: Record<string, string> = {
  ephemeride: "Éphéméride",
  "la-societe-de-jeux": "La société de jeux",
  "porte-cle-jeton-de-caddie": "Porte-clé jeton de caddie",
  "recolteur-pomme-de-pin": "Récolteur pomme de pin",
  "fish-eye": "Fish-Eye",
};

// next/image n'ajoute pas le basePath aux images non optimisées : on le préfixe ici.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const withBase = (img: ProjectImage) => ({ ...img, src: base + img.src });

export const projects: Project[] = (raw as Project[]).map((p) => ({
  ...p,
  title: TITLES[p.slug] ?? p.title,
  cover: withBase(p.cover),
  images: p.images.map(withBase),
}));

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
