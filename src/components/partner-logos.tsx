import Link from "next/link";
import { asset } from "@/lib/projects";

export type Partner = { nom: string; logo: string; projet: string; ratio: number };

// Hauteur d'un logo selon sa forme (largeur/hauteur) : surface à peu près égale pour tous,
// sinon les logotypes très larges écrasent les emblèmes carrés. `scale` agrandit le tout.
export const logoHeight = (ratio: number, scale = 1) => Math.round(Math.min(44, Math.sqrt(3000 / ratio)) * scale);

// Tous passés en niveaux de gris pour former une bande homogène (le noir uni effacerait les logos à fond plein, comme Silmo).
export function PartnerLogo({ p, scale }: { p: Partner; scale?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- petits logos fixes, aussi imprimés
    <img
      src={asset(p.logo)}
      alt={p.nom}
      title={p.nom}
      style={{ height: logoHeight(p.ratio, scale) }}
      className="w-auto object-contain grayscale dark:invert"
    />
  );
}

// Bande du CV : chaque logo mène au projet fait avec ce partenaire.
export function PartnerLogos({ partners }: { partners: Partner[] }) {
  return (
    <ul className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-8 print:mt-3 print:gap-x-6 print:gap-y-3">
      {partners.map((p) => (
        <li key={p.nom}>
          <Link href={`/projets/${p.projet}/`} className="block opacity-70 transition-opacity hover:opacity-100 print:opacity-90">
            <PartnerLogo p={p} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
