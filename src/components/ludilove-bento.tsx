import type { CSSProperties } from "react";
import { asset } from "@/lib/projects";

// Bento animé de la charte LudiLove : logo, mascotte, icônes de navigation, typographie,
// couleurs et pictogrammes. Animations en CSS pur (globals.css, préfixe llb-), coupées
// si l'utilisateur préfère réduire les animations.
const dir = (f: string) => asset(`/projects/ludilove/charte/${f}.webp`);

const NAV = ["home", "search", "library", "session", "profile"];
const MASCOTS = [0, 1, 2, 3, 4, 5];
const ICONS = Array.from({ length: 25 }, (_, n) => `icon-${String(n).padStart(2, "0")}`);
// Valeurs du kakémono ; le jaune y est étiqueté #CDC5FF par erreur, sa vraie teinte est #F1EA6D.
const PALETTE = [
  { hex: "#F7F2E8", ink: "#353766" },
  { hex: "#E2B13A", ink: "#353766" },
  { hex: "#F1EA6D", ink: "#353766" },
  { hex: "#F0C4DD", ink: "#353766" },
  { hex: "#CDC5FF", ink: "#353766" },
  { hex: "#6AA68A", ink: "#353766" },
  { hex: "#8687BC", ink: "#F7F2E8" },
  { hex: "#F2946F", ink: "#353766" },
  { hex: "#353766", ink: "#F7F2E8" },
];

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

export function LudiloveBento() {
  return (
    <div className="llb grid grid-cols-2 gap-3 md:grid-cols-6" aria-label="Charte graphique LudiLove en mouvement">
      {/* Logo : les deux cartes en cœur flottent au-dessus du nom. */}
      <div className="llb-cell col-span-2 flex flex-col items-center justify-center gap-4 bg-[#F7F2E8] py-12 md:col-span-4 md:row-span-2">
        <img src={dir("logo-mark")} alt="" className="llb-float w-[38%] max-w-56" width={608} height={508} />
        <span className="llb-font text-4xl font-bold text-[#353766] sm:text-6xl">Ludilove</span>
      </div>

      {/* Mascotte : née de la silhouette du pion, elle change de pose. */}
      <div className="llb-cell relative col-span-1 aspect-square bg-[#CDC5FF] md:col-span-2 md:row-span-2 md:aspect-auto">
        {MASCOTS.map((n) => (
          <img
            key={n}
            src={dir(`mascot-${n}`)}
            alt={n === 0 ? "Mascotte LudiLove" : ""}
            className="llb-mascot absolute inset-x-0 bottom-[8%] mx-auto h-[72%] w-auto"
            style={delay(n * 2)}
          />
        ))}
      </div>

      {/* Typographie : Quicksand, graisse qui respire de 300 à 700. */}
      <div className="llb-cell llb-font col-span-1 flex flex-col justify-between bg-[#8687BC] p-5 text-[#F7F2E8] md:col-span-2 md:row-span-2 md:p-6">
        <span className="text-sm font-bold">Quicksand</span>
        <span className="llb-weight text-7xl leading-none sm:text-8xl">Aa</span>
        <span className="text-xs leading-relaxed opacity-90">
          Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
        </span>
      </div>

      {/* Navigation : chaque onglet passe du contour à l'aplat, comme dans l'app. */}
      <div className="llb-cell col-span-2 flex items-center justify-around bg-[#F7F2E8] px-4 py-8 md:col-span-4">
        {NAV.map((k, n) => (
          <span key={k} className="relative block size-10 sm:size-14">
            <img src={dir(`nav-${k}-off`)} alt="" className="absolute inset-0 size-full object-contain" />
            <img src={dir(`nav-${k}-on`)} alt="" className="llb-on absolute inset-0 size-full object-contain" style={delay(n * 1.6)} />
          </span>
        ))}
      </div>

      {/* Couleurs : les neuf teintes de la charte, en vague. */}
      <div className="llb-cell col-span-2 flex h-36 gap-1.5 bg-white p-1.5 md:col-span-4">
        {PALETTE.map((c, n) => (
          <span
            key={c.hex}
            className="llb-swatch llb-font flex items-center justify-center overflow-hidden rounded-2xl text-[10px] font-bold"
            style={{ background: c.hex, color: c.ink, boxShadow: c.hex === "#F7F2E8" ? "inset 0 0 0 1px #e6dfd0" : undefined, ...delay(n * 0.35) }}
          >
            <span className="hidden -rotate-90 whitespace-nowrap sm:inline">{c.hex}</span>
          </span>
        ))}
      </div>

      <div className="llb-cell col-span-2 flex items-center justify-center bg-[#353766] p-6 md:col-span-2">
        <p className="llb-font text-center text-lg font-bold leading-snug text-[#F7F2E8]">
          Deux cartes qui forment un cœur, un pion qui devient personnage.
        </p>
      </div>

      {/* Pictogrammes : défilement continu, deux lignes en sens contraire. */}
      <div className="llb-cell col-span-2 flex flex-col justify-center gap-6 overflow-hidden bg-[#F7F2E8] py-8 md:col-span-4">
        {[0, 1].map((row) => (
          <div key={row} className={row ? "llb-marquee llb-marquee-rev" : "llb-marquee"}>
            {[...ICONS.slice(row * 12, row * 12 + 13), ...ICONS.slice(row * 12, row * 12 + 13)].map((f, n) => (
              <img key={n} src={dir(f)} alt="" className="h-12 w-auto shrink-0 sm:h-16" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
