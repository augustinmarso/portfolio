// Manifeste d'Augustin Marsollier (DSAA ENSAAMA, 2026), repris du PDF « Manifeste Augustin Marsollier ».
// Portraits des trois designers favoris recadrés depuis le PDF (public/manifeste).
// Dans les textes, [n] renvoie à la note n ; [[texte|/projets/slug]] fait un lien vers un projet.
// Le contenu est dans pages/pourquoi.json, modifiable depuis l'éditeur en ligne (dépôt portfolio-editeur).
import data from "./pages/pourquoi.json";

export type Section = { id: string; titre: string; paragraphes?: string[]; liste?: { nom: string; detail: string; texte?: string; photo?: string }[] };
export type Ouvrage = { auteur: string; titre: string; detail: string; couleur: string; encre: string; h: number; l: number };

export const TITRE: string = data.titre;
export const EXERGUE: { texte: string; source: string } = data.exergue;
export const SECTIONS: Section[] = data.sections;
export const NOTES: { terme: string; texte: string }[] = data.notes;
export const OUVRAGES: Ouvrage[] = data.ouvrages;
