import type { CSSProperties, ReactNode } from "react";
import { asset } from "@/lib/projects";

// Bento animé de la charte « Points de vue » : les trois habitants du logo qui clignent et
// se rapprochent, les encres qui se mélangent, les jetons de vote, le label qui tourne.
// CSS pur (globals.css, préfixe pdv-) ; cellules .llb-cell pour l'arrondi et la pause hors écran.
const PINK = "#F5A0C6";
const YELLOW = "#F7C33B";
const BLUE = "#1F6FE0";
const INK = "#141414";

const vars = (v: Record<string, string>) => v as CSSProperties;

// Un habitant : un cercle de couleur et deux yeux qui regardent autour puis clignent.
function Habitant({ cx, cy, r, fill, eyes, d }: { cx: number; cy: number; r: number; fill: string; eyes: [number, number, number, number, number]; d: string }) {
  const [x1, y1, x2, y2, er] = eyes;
  return (
    <g className="pdv-drift" style={{ mixBlendMode: "multiply", ...vars({ "--d": d }) }}>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <g className="pdv-look" style={vars({ "--d": d })}>
        <g className="pdv-blink" style={vars({ "--d": d })}>
          <circle cx={x1} cy={y1} r={er} fill={INK} />
          <circle cx={x2} cy={y2} r={er} fill={INK} />
        </g>
      </g>
    </g>
  );
}

// Coordonnées fixées du logo validé (viewBox 0 0 120 112).
function Mark({ className, label }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 120 112" className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={{ isolation: "isolate", overflow: "visible" }}>
      <Habitant cx={44} cy={46} r={40} fill={PINK} eyes={[22, 36, 34, 34, 3.4]} d="0s" />
      <Habitant cx={86} cy={38} r={28} fill={YELLOW} eyes={[93, 24, 103, 26, 2.7]} d="-2.2s" />
      <Habitant cx={74} cy={78} r={22} fill={BLUE} eyes={[73, 91, 81, 91, 2.2]} d="-4.1s" />
    </svg>
  );
}

// Pictogrammes de la charte (planche 4), un à la fois.
const PICTOS: { label: string; svg: ReactNode }[] = [
  {
    label: "Je ressens",
    svg: (
      <>
        <circle cx="34" cy="38" r="32" fill={PINK} />
        <circle cx="22" cy="32" r="3.4" fill={INK} />
        <circle cx="36" cy="30" r="3.4" fill={INK} />
        <path d="M19 44Q30 56 43 44" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Je comprends",
    svg: (
      <>
        <circle cx="34" cy="38" r="32" fill={BLUE} />
        <circle cx="24" cy="30" r="3.4" fill={INK} />
        <circle cx="38" cy="27" r="3.4" fill={INK} />
        <circle cx="32" cy="48" r="5" fill={INK} />
      </>
    ),
  },
  {
    label: "Je vois",
    svg: (
      <>
        <path d="M2 38a32 32 0 1 0 64 0a32 32 0 1 0 -64 0ZM14 32a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0ZM35 32a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0Z" fill={YELLOW} fillRule="evenodd" />
        <circle cx="25.7" cy="32" r="3.2" fill={INK} />
        <circle cx="46.7" cy="32" r="3.2" fill={INK} />
      </>
    ),
  },
  {
    label: "Oui, ça marche",
    svg: (
      <>
        <circle cx="34" cy="38" r="32" fill="#087A3D" />
        <circle cx="22" cy="30" r="3.6" fill="#FFFFFF" />
        <circle cx="36" cy="28" r="3.6" fill="#FFFFFF" />
        <path d="M18 44L28 53L46 37" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    label: "Non, à revoir",
    svg: (
      <>
        <circle cx="34" cy="38" r="32" fill="#ED7A2E" />
        <circle cx="22" cy="30" r="3.4" fill={INK} />
        <circle cx="36" cy="28" r="3.4" fill={INK} />
        <path d="M22 42L38 54M38 42L22 54" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Je ne sais pas",
    svg: (
      <>
        <circle cx="34" cy="38" r="29.5" fill="none" stroke={INK} strokeWidth="5" />
        <circle cx="26" cy="28" r="3.4" fill={INK} />
        <circle cx="40" cy="26" r="3.4" fill={INK} />
        <path d="M20 47Q26 42 32 47T44 47" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  },
];

// Trois habitants sur la ligne au sol : chacun part de son avis, tous finissent au même endroit.
const VOTERS = [
  { fill: PINK, from: "8%", mid: "62%", to: "34%" },
  { fill: YELLOW, from: "88%", mid: "20%", to: "40%" },
  { fill: BLUE, from: "50%", mid: "80%", to: "37%" },
];

export function PointsDeVueBento() {
  return (
    <div className="grid grid-cols-2 gap-3 text-[#141414] md:grid-cols-6" aria-label="Charte graphique Points de vue en mouvement">
      {/* Logo : trois habitants qui regardent autour d'eux, clignent et se rapprochent. */}
      <div className="llb-cell col-span-2 flex flex-col items-center justify-center gap-6 bg-white px-6 py-12 shadow-[inset_0_0_0_1px_#ecebe6] sm:flex-row sm:gap-10 md:col-span-4 md:row-span-2">
        <Mark className="w-[58%] max-w-72 sm:w-[44%]" label="Logo Points de vue : trois cercles avec des yeux" />
        <span className="text-5xl font-extrabold leading-[0.84] tracking-[-0.05em] sm:text-7xl">
          Points
          <br />
          de vue
        </span>
      </div>

      {/* Les trois publics des séances, un point de couleur chacun, qui s'allument l'un après l'autre. */}
      <div className="llb-cell col-span-2 flex flex-col justify-center gap-6 bg-[#141414] p-6 text-white md:col-span-2 md:row-span-2 md:p-8">
        <span className="text-3xl font-extrabold leading-[0.9] tracking-[-0.04em] sm:text-4xl">Un point par public.</span>
        {[
          [PINK, "Seniors"],
          [YELLOW, "Proches aidants"],
          [BLUE, "Tous les habitants"],
        ].map(([c, t], n) => (
          <p key={t} className="pdv-line flex items-center gap-3 text-xl font-bold leading-tight" style={vars({ "--d": `${n * 1.2}s` })}>
            <span className="size-7 shrink-0 rounded-full" style={{ background: c }} />
            {t}
          </p>
        ))}
      </div>

      {/* Couleurs : les trois encres glissent l'une sur l'autre et se mélangent, comme à l'impression. */}
      <div className="llb-cell col-span-2 flex flex-col justify-center gap-5 bg-white p-6 shadow-[inset_0_0_0_1px_#ecebe6] md:col-span-4">
        <div className="flex items-center justify-center py-2" style={{ isolation: "isolate" }}>
          {[
            [PINK, "pdv-ink-l"],
            [YELLOW, ""],
            [BLUE, "pdv-ink-r"],
          ].map(([c, cls]) => (
            <span key={c} className={`${cls} block size-24 rounded-full mix-blend-multiply sm:size-32`} style={{ background: c }} />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs font-semibold">
          {[
            ["#F5A0C6", "rose"],
            ["#F7C33B", "jaune"],
            ["#1F6FE0", "bleu"],
            ["#087A3D", "vert · oui"],
            ["#ED7A2E", "orange · non"],
          ].map(([hex, name]) => (
            <span key={hex} className="flex items-center gap-1.5">
              <span className="size-3 rounded-full" style={{ background: hex }} />
              {name} {hex}
            </span>
          ))}
        </div>
      </div>

      {/* Typographie : Scoutie Sans, graisse qui respire de 200 à 800. */}
      <div className="llb-cell col-span-1 flex flex-col justify-between bg-[#F7C33B] p-5 md:col-span-2 md:p-6">
        <span className="text-sm font-bold">Scoutie Sans</span>
        <span className="pdv-weight text-7xl leading-none tracking-[-0.05em] sm:text-8xl">Aa</span>
        <span className="text-xs font-semibold leading-relaxed">une seule famille, de 200 à 800</span>
      </div>

      {/* Pictogrammes : nés du logo, ils passent à tour de rôle. */}
      <div className="llb-cell relative col-span-1 aspect-square bg-white shadow-[inset_0_0_0_1px_#ecebe6] md:col-span-2 md:aspect-auto md:min-h-64">
        {PICTOS.map((p, n) => (
          <figure key={p.label} className="pdv-picto absolute inset-0 m-0 flex flex-col items-center justify-center gap-3" style={vars({ "--d": `${n * 2}s` })}>
            <svg viewBox="0 0 68 72" className="h-[52%] w-auto" role="img" aria-label={`Pictogramme ${p.label}`}>
              {p.svg}
            </svg>
            <figcaption className="text-base font-extrabold tracking-[-0.02em] sm:text-xl">{p.label}</figcaption>
          </figure>
        ))}
      </div>

      {/* Ligne au sol : chacun se place entre oui et non, puis tout le monde converge. */}
      <div className="llb-cell col-span-2 flex flex-col justify-center gap-6 bg-[#141414] px-5 py-10 text-white md:col-span-4 md:px-8">
        <span className="text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">Là où les avis se croisent.</span>
        <div className="flex items-center gap-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#087A3D] text-lg font-extrabold">Oui</span>
          <div className="relative h-14 flex-1">
            <span className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#087A3D,#F7C33B_50%,#ED7A2E)]" />
            {VOTERS.map((v, n) => (
              <span
                key={v.fill}
                className="pdv-vote absolute inset-y-0 left-0 right-10"
                style={vars({ "--from": v.from, "--mid": v.mid, "--to": v.to, "--d": `${n * -0.4}s` })}
              >
                <span className="absolute top-1/2 block size-10 -translate-y-1/2 rounded-full mix-blend-screen" style={{ background: v.fill }}>
                  <span className="absolute left-[30%] top-[34%] size-1.5 rounded-full bg-[#141414]" />
                  <span className="absolute left-[56%] top-[30%] size-1.5 rounded-full bg-[#141414]" />
                </span>
              </span>
            ))}
          </div>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#ED7A2E] text-lg font-extrabold text-[#141414]">Non</span>
        </div>
      </div>

      {/* Images : toutes les photos sortent tramées en gros points. */}
      <div className="llb-cell relative col-span-2 min-h-56 overflow-hidden bg-white md:col-span-4 md:min-h-72">
        {/* eslint-disable-next-line @next/next/no-img-element -- image décorative animée */}
        <img src={asset("/projects/points-de-vue/charte/trame.webp")} alt="Photo d'atelier tramée en gros points jaunes, roses, bleus et noirs" className="pdv-zoom absolute inset-0 size-full object-cover" loading="lazy" />
        <span className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-2 text-sm font-bold">toutes les photos sortent en gros points</span>
      </div>

      {/* Label : l'anneau « co-testé par des habitants » tourne autour du logo. */}
      <div className="llb-cell col-span-2 flex items-center justify-center bg-white p-6 shadow-[inset_0_0_0_1px_#ecebe6] md:col-span-2">
        <svg viewBox="0 0 200 200" className="w-full max-w-60" role="img" aria-label="Label co-testé par des habitants, Granville Terre et Mer">
          <defs>
            <path id="pdv-ring" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
          </defs>
          <circle cx="100" cy="100" r="96" fill={INK} />
          <g className="pdv-spin">
            <text fontWeight="800" fontSize="12.5" fill="#EDEBE3" style={{ fontFamily: "var(--font-sans)" }}>
              <textPath href="#pdv-ring" textLength="456" lengthAdjust="spacing">
                CO-TESTÉ PAR DES HABITANTS · GRANVILLE TERRE ET MER ·
              </textPath>
            </text>
          </g>
          <circle cx="100" cy="100" r="52" fill="#FFFFFF" />
          <svg x="44" y="46" width="112" height="105" viewBox="0 0 120 112">
            <Mark />
          </svg>
        </svg>
      </div>
    </div>
  );
}
