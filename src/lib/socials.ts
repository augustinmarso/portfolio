import contact from "@/data/pages/contact.json";

// Réseaux affichés sur la page contact et dans le CV (modifiables depuis l'éditeur en ligne).
export const SOCIALS: { label: string; href: string }[] = contact.reseaux;

// Salle Google Meet permanente : les visiteurs demandent à entrer, Augustin les admet.
export const MEET: string = contact.meet;
