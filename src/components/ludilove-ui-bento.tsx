import type { CSSProperties } from "react";
import { asset } from "@/lib/projects";

// Bento animé des composants d'interface de LudiLove, capturés dans l'app : accueil, swipe,
// stories, match, feuille de score, scan, salle d'attente, achat, test de personnalité.
// Animations en CSS pur (globals.css, préfixe llu-), coupées si l'utilisateur préfère réduire les animations.
const ui = (f: string) => asset(`/projects/ludilove/ui/${f}.webp`);
const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

function Img({ f, w, h, className, style }: { f: string; w: number; h: number; className?: string; style?: CSSProperties }) {
  return <img src={ui(f)} alt="" width={w} height={h} loading="lazy" className={className} style={style} />;
}

function Label({ children, light }: { children: string; light?: boolean }) {
  return <span className={`llb-font absolute left-4 top-3 text-xs font-bold ${light ? "text-[#F7F2E8]/80" : "text-[#353766]/60"}`}>{children}</span>;
}

export function LudiloveUiBento() {
  return (
    <div className="grid grid-flow-dense grid-cols-2 gap-3 md:grid-cols-6" aria-label="Composants d'interface de LudiLove en mouvement">
      {/* Accueil : la carte qui lance une partie. */}
      <div className="llb-cell relative col-span-2 flex items-center justify-center bg-[#F7F2E8] px-8 pb-6 pt-10 md:col-span-3">
        <Label>accueil</Label>
        <Img f="launch" w={900} h={863} className="llb-float w-full max-w-72" />
      </div>

      {/* Swipe : la carte oscille entre « passer » et « j'aime ». */}
      <div className="llb-cell relative col-span-2 flex flex-col items-center justify-center gap-4 bg-white px-8 pb-6 pt-10 ring-1 ring-black/5 md:col-span-3 md:row-span-2">
        <Label>swipe</Label>
        <Img f="swipe-card" w={873} h={1100} className="llu-sway w-[62%] max-w-64" />
        <Img f="swipe-actions" w={564} h={186} className="llu-pulse w-[46%] max-w-48" />
      </div>

      {/* Stories : la rangée défile à l'infini (deux copies bout à bout). */}
      <div className="llb-cell relative col-span-2 flex items-center overflow-hidden bg-white pt-8 ring-1 ring-black/5 md:col-span-3">
        <Label>stories</Label>
        <div className="llu-loop flex w-max">
          <Img f="stories-loop" w={1260} h={543} className="h-36 w-auto max-w-none sm:h-44" />
          <Img f="stories-loop" w={1260} h={543} className="h-36 w-auto max-w-none sm:h-44" />
        </div>
      </div>

      {/* Match : la carte apparaît en rebond, sous une pluie de confettis. */}
      <div className="llb-cell relative col-span-2 flex flex-col items-center justify-center gap-3 overflow-hidden bg-[#6A62B5] px-6 pb-6 pt-8 md:col-span-2 md:row-span-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
          <span key={n} className="llu-confetti" style={{ left: `${8 + n * 12}%`, background: ["#F1EA6D", "#F2946F", "#6AA68A", "#F7F2E8"][n % 4], ...delay(n * 0.45) }} />
        ))}
        <span className="llb-font text-4xl font-bold text-[#F7F2E8]">MATCH !</span>
        <Img f="match-card" w={811} h={1100} className="llu-pop w-[60%] max-w-44" />
        <Img f="match-btn" w={900} h={139} className="w-full max-w-60" />
      </div>

      {/* Partie : feuille de score, outils qui sautillent à tour de rôle. */}
      <div className="llb-cell relative col-span-2 flex flex-col items-center justify-center gap-3 bg-[#EFE7D3] px-6 pb-6 pt-10 md:col-span-4 md:row-span-2">
        <Label>partie</Label>
        <Img f="score-sheet" w={900} h={617} className="w-full max-w-md" />
        <div className="relative w-full max-w-md">
          <Img f="score-tools" w={900} h={223} className="w-full" />
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} className="llu-hop" style={{ left: `${10 + n * 20}%`, ...delay(n * 0.5) }} />
          ))}
        </div>
        <Img f="score-end" w={900} h={159} className="w-full max-w-md" />
      </div>

      {/* Test de personnalité. */}
      <div className="llb-cell relative col-span-2 flex items-center justify-center bg-white px-6 pb-4 pt-10 ring-1 ring-black/5 md:col-span-2 md:row-span-2">
        <Label>profil</Label>
        <Img f="personality" w={790} h={1100} className="llb-float w-full max-w-64" style={delay(0)} />
      </div>

      {/* Scan : la boîte reconnue et le compteur. */}
      <div className="llb-cell relative col-span-1 flex items-center justify-center gap-3 bg-[#353766] px-4 pb-5 pt-10 md:col-span-2">
        <Label light>scan</Label>
        <Img f="scan-tile" w={330} h={429} className="llu-pop w-[38%] max-w-28" />
        <Img f="scan-count" w={219} h={270} className="llu-pulse w-[24%] max-w-16" />
      </div>

      {/* Achat. */}
      <div className="llb-cell relative col-span-1 flex items-center justify-center bg-white px-4 pb-4 pt-10 ring-1 ring-black/5 md:col-span-2">
        <Label>acheter</Label>
        <Img f="buy" w={900} h={459} className="w-full max-w-72" />
      </div>

      {/* Salle d'attente : les joueurs arrivent. */}
      <div className="llb-cell relative col-span-1 flex items-center justify-center overflow-hidden bg-white px-4 pb-4 pt-10 ring-1 ring-black/5 md:col-span-2">
        <Label>salle d&apos;attente</Label>
        <Img f="lobby" w={900} h={385} className="llu-join w-full max-w-72" />
      </div>

      {/* Ludothèque : une tuile de jeu. */}
      <div className="llb-cell relative col-span-1 flex items-center justify-center bg-white px-4 pb-4 pt-10 ring-1 ring-black/5 md:col-span-2">
        <Label>ludothèque</Label>
        <Img f="tile" w={504} h={585} className="llb-float w-[44%] max-w-32" />
      </div>
    </div>
  );
}
