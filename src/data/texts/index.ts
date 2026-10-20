// Textes des projets (un fichier JSON par projet, même slug que les images).
import type { ProjectText } from "@/lib/projects";
import banc_tapis_petite_voiture from "./banc-tapis-petite-voiture.json";
import collection_d_objets_liturgiques from "./collection-d-objets-liturgiques.json";
import cylinder_chair from "./cylinder-chair.json";
import de_passager_a_equipier from "./de-passager-a-equipier.json";
import echappee from "./echappee.json";
import ephemeride from "./ephemeride.json";
import fish_eye from "./fish-eye.json";
import gorillachoc from "./gorillachoc.json";
import kai from "./kai.json";
import la_societe_de_jeux from "./la-societe-de-jeux.json";
import le_choix_de_malo from "./le-choix-de-malo.json";
import le_jeu_de_la_grenouille from "./le-jeu-de-la-grenouille.json";
import ludilove from "./ludilove.json";
import open_mind from "./open-mind.json";
import porte_cle_jeton_de_caddie from "./porte-cle-jeton-de-caddie.json";
import ratp from "./ratp.json";
import recolteur_pomme_de_pin from "./recolteur-pomme-de-pin.json";

export const texts: Record<string, ProjectText> = {
  "banc-tapis-petite-voiture": banc_tapis_petite_voiture,
  "collection-d-objets-liturgiques": collection_d_objets_liturgiques,
  "cylinder-chair": cylinder_chair,
  "de-passager-a-equipier": de_passager_a_equipier,
  "echappee": echappee,
  "ephemeride": ephemeride,
  "fish-eye": fish_eye,
  "gorillachoc": gorillachoc,
  "kai": kai,
  "la-societe-de-jeux": la_societe_de_jeux,
  "le-choix-de-malo": le_choix_de_malo,
  "le-jeu-de-la-grenouille": le_jeu_de_la_grenouille,
  "ludilove": ludilove,
  "open-mind": open_mind,
  "porte-cle-jeton-de-caddie": porte_cle_jeton_de_caddie,
  "ratp": ratp,
  "recolteur-pomme-de-pin": recolteur_pomme_de_pin,
};
