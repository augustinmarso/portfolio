"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import { THEMES, type Project } from "@/lib/projects";

// ——— Génération de l'arbre ————————————————————————————————————————————

type Params = {
  scale: number;
  width: number;
  widthReduction: number;
  segLength: number;
  variance: number;
  spawn: number;
  leafLength: number;
};

const DEFAULTS: Params = {
  scale: 1,
  width: 13,
  widthReduction: 0.84,
  segLength: 58,
  variance: 18,
  spawn: 0.45,
  leafLength: 34,
};

type Seg = { id: number; x1: number; y1: number; x2: number; y2: number; w: number; parent: number | null; depth: number };
type Leaf =
  | { kind: "project"; x: number; y: number; seg: number; project: Project; theme: string; side: 1 | -1 }
  | { kind: "theme"; x: number; y: number; seg: number; theme: string; count: number }
  | { kind: "twig"; x: number; y: number; seg: number };

// Générateur pseudo-aléatoire à graine : le même arbre pour la même graine.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const UP = -Math.PI / 2;
const rad = (d: number) => (d * Math.PI) / 180;

function buildTree(groups: { theme: string; projects: Project[] }[], p: Params, seed: number) {
  const rand = rng(seed);
  const segs: Seg[] = [];
  const leaves: Leaf[] = [];
  const jitter = () => (rand() * 2 - 1) * rad(p.variance);

  const add = (x1: number, y1: number, angle: number, len: number, w: number, parent: number | null, depth: number) => {
    // Arrondi : les fonctions trigonométriques diffèrent au dernier chiffre entre Node et le navigateur.
    const x2 = Math.round((x1 + Math.cos(angle) * len) * 100) / 100;
    const y2 = Math.round((y1 + Math.sin(angle) * len) * 100) / 100;
    segs.push({ id: segs.length, x1, y1, x2, y2, w: Math.round(w * 100) / 100, parent, depth });
    return segs[segs.length - 1];
  };

  // Petit rameau sans feuille, pour la densité (« chance de pousse »).
  const twig = (from: Seg, angle: number, w: number) => {
    let s = from;
    let a = angle;
    const n = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      a += jitter() * 0.6 + (UP - a) * 0.1;
      s = add(s.x2, s.y2, a, p.segLength * 0.42 * (0.7 + rand() * 0.6), Math.max(0.6, w * Math.pow(p.widthReduction, i + 1)), s.id, s.depth + 1);
    }
    leaves.push({ kind: "twig", x: s.x2, y: s.y2, seg: s.id });
  };

  // Tronc : monte par segments, une branche de thème part à chaque nœud, à gauche puis à droite.
  let trunk = add(0, 0, UP, p.segLength * 0.9, p.width, null, 0);
  let trunkAngle = UP;
  let w = p.width;
  groups.forEach((g, gi) => {
    trunkAngle += jitter() * 0.35 + (UP - trunkAngle) * 0.4;
    w *= p.widthReduction;
    trunk = add(trunk.x2, trunk.y2, trunkAngle, p.segLength * (0.8 + rand() * 0.3), w, trunk.id, 0);

    const side = gi % 2 ? 1 : -1;
    let a = UP + side * rad(38 + rand() * 26);
    let bw = w * 0.62;
    let branch = trunk;
    const steps = Math.max(2, g.projects.length + 1);
    for (let i = 0; i < steps; i++) {
      a += jitter() + (UP - a) * 0.12; // les branches se redressent vers la lumière
      bw = Math.max(0.8, bw * p.widthReduction);
      branch = add(branch.x2, branch.y2, a, p.segLength * 0.78 * (0.75 + rand() * 0.5), bw, branch.id, 1);

      const project = g.projects[i];
      if (project) {
        const ls = (i % 2 ? 1 : -1) as 1 | -1;
        const la = a + ls * rad(55 + rand() * 25);
        const stem = add(branch.x2, branch.y2, la, p.leafLength * (0.8 + rand() * 0.4), Math.max(0.6, bw * 0.55), branch.id, 2);
        leaves.push({ kind: "project", x: stem.x2, y: stem.y2, seg: stem.id, project, theme: g.theme, side: Math.cos(la) >= 0 ? 1 : -1 });
      }
      if (rand() < p.spawn) twig(branch, a - (i % 2 ? 1 : -1) * rad(40 + rand() * 30), bw * 0.6);
    }
    leaves.push({ kind: "theme", x: branch.x2, y: branch.y2, seg: branch.id, theme: g.theme, count: g.projects.length });
    if (rand() < p.spawn) twig(trunk, trunkAngle - side * rad(50), w * 0.4);
  });
  // Cime
  let top = trunk;
  for (let i = 0; i < 2; i++) top = add(top.x2, top.y2, UP + jitter(), p.segLength * 0.6, Math.max(0.8, w * Math.pow(p.widthReduction, i + 1)), top.id, 0);
  leaves.push({ kind: "twig", x: top.x2, y: top.y2, seg: top.id });

  // Mise à l'échelle et cadrage
  const xs = segs.flatMap((s) => [s.x1, s.x2]);
  const ys = segs.flatMap((s) => [s.y1, s.y2]);
  const pad = 120;
  const box = {
    x: (Math.min(...xs) - pad) * p.scale,
    y: (Math.min(...ys) - pad * 0.6) * p.scale,
    w: (Math.max(...xs) - Math.min(...xs) + pad * 2) * p.scale,
    h: (Math.max(...ys) - Math.min(...ys) + pad * 1.2) * p.scale,
  };
  return { segs, leaves, box };
}

// ——— Interface ————————————————————————————————————————————————————————

const SLIDERS: { key: keyof Params; label: string; min: number; max: number; step: number }[] = [
  { key: "scale", label: "échelle", min: 0.6, max: 1.6, step: 0.01 },
  { key: "width", label: "largeur", min: 4, max: 26, step: 0.1 },
  { key: "widthReduction", label: "réduction de largeur", min: 0.6, max: 0.98, step: 0.01 },
  { key: "segLength", label: "longueur des segments", min: 30, max: 100, step: 1 },
  { key: "variance", label: "angle de variance", min: 0, max: 45, step: 0.5 },
  { key: "spawn", label: "chance de pousse", min: 0, max: 1, step: 0.01 },
  { key: "leafLength", label: "longueur des feuilles", min: 14, max: 70, step: 1 },
];

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    onChange(Math.round((min + t * (max - min)) / step) * step);
  };
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          set(e.clientX);
        }}
        onPointerMove={(e) => e.buttons && set(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") onChange(Math.min(max, value + step));
          if (e.key === "ArrowLeft") onChange(Math.max(min, value - step));
        }}
        className="relative h-5 w-36 shrink-0 cursor-ew-resize touch-none bg-muted outline-none focus-visible:ring-1 focus-visible:ring-foreground"
      >
        <div className="absolute inset-y-0 left-0 bg-foreground/70" style={{ width: `${pct}%` }} />
        <span className="absolute inset-y-0 left-1.5 flex items-center tabular-nums mix-blend-difference text-white">
          {value.toFixed(step < 1 ? 2 : 0)}
        </span>
      </div>
      <span className="uppercase">{label}</span>
    </div>
  );
}

function useQr(text: string | null) {
  const [svg, setSvg] = useState<string>("");
  useEffect(() => {
    if (!text) return;
    let alive = true;
    QRCode.toString(text, { type: "svg", margin: 0, color: { dark: "#000000", light: "#00000000" } }).then((s) => alive && setSvg(s));
    return () => {
      alive = false;
    };
  }, [text]);
  return text ? svg : "";
}

export function ProjectTree({ projects }: { projects: Project[] }) {
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [seed, setSeed] = useState(247);
  const [hover, setHover] = useState<number | null>(null); // segment de la feuille survolée
  const [selected, setSelected] = useState<string | null>(null);
  const [grown, setGrown] = useState(0); // incrémenté pour rejouer la pousse

  // Chaque projet est rangé sous son premier thème : un arbre, pas un graphe.
  const groups = useMemo(
    () =>
      THEMES.map((t) => ({ theme: t, projects: projects.filter((p) => p.text?.themes[0] === t) })).filter((g) => g.projects.length),
    [projects]
  );
  const { segs, leaves, box } = useMemo(() => buildTree(groups, params, seed), [groups, params, seed]);

  const path = useMemo(() => {
    const on = new Set<number>();
    let id = hover;
    while (id !== null && id !== undefined) {
      on.add(id);
      id = segs[id]?.parent ?? null;
    }
    return on;
  }, [hover, segs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "r" || (e.target as HTMLElement).closest("input,textarea")) return;
      setSeed(Math.floor(Math.random() * 9999));
      setGrown((g) => g + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sel = selected ? projects.find((p) => p.slug === selected) : null;
  const selIndex = sel ? projects.indexOf(sel) : -1;
  const url = sel && typeof window !== "undefined" ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/projets/${sel.slug}/` : null;
  const qr = useQr(url);
  const maxDepth = Math.max(...segs.map((s) => s.depth)) + 1;
  const s = params.scale;

  return (
    <div className="relative grid gap-6 font-mono text-[11px] leading-tight lg:block">
      {/* Réglages */}
      <div className="z-10 grid content-start gap-1.5 lg:absolute lg:left-0 lg:top-0">
        {SLIDERS.map(({ key, ...sl }) => (
          <Slider key={key} {...sl} value={params[key]} onChange={(v) => setParams((p) => ({ ...p, [key]: v }))} />
        ))}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSeed(Math.floor(Math.random() * 9999));
              setGrown((g) => g + 1);
            }}
            className="h-5 w-36 bg-foreground text-left text-background uppercase"
          >
            <span className="px-1.5">(r) régénérer</span>
          </button>
          <span className="uppercase text-muted-foreground">graine {seed}</span>
        </div>
        <button type="button" onClick={() => setParams(DEFAULTS)} className="w-36 text-left uppercase text-muted-foreground hover:text-foreground">
          réinitialiser
        </button>
      </div>

      {/* Arbre */}
      <div className="relative h-[72vh] lg:h-[calc(100dvh-9rem)]">
        <p className="absolute left-0 top-0 hidden uppercase lg:left-[34%] lg:block">mode : tree layout</p>
        <svg
          key={grown}
          viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
          className="size-full"
          onPointerLeave={() => setHover(null)}
        >
          <g transform={`scale(${s})`}>
            {segs.map((sg) => (
              <line
                key={sg.id}
                x1={sg.x1}
                y1={sg.y1}
                x2={sg.x2}
                y2={sg.y2}
                pathLength={1}
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth={path.has(sg.id) ? Math.max(sg.w, 2.6) : Math.max(0.7, sg.w * (hover !== null ? 0.6 : 1))}
                className="tree-grow transition-[stroke-width] duration-200"
                style={{ animationDelay: `${sg.depth * 260 + (sg.id % 40) * 12}ms` }}
              />
            ))}
            {/* nœuds aux jonctions */}
            {segs
              .filter((sg) => sg.depth > 0 && sg.parent !== null && segs[sg.parent].depth !== sg.depth)
              .map((sg) => (
                <circle key={`n${sg.id}`} cx={sg.x1} cy={sg.y1} r={2.6} className="fill-background stroke-foreground" strokeWidth={0.9} />
              ))}
            <circle cx={0} cy={0} r={6} className="fill-background stroke-foreground" strokeWidth={1.6} />

            {leaves.map((lf, i) => {
              if (lf.kind === "twig") return <circle key={i} cx={lf.x} cy={lf.y} r={2.2} className="fill-background stroke-foreground" strokeWidth={0.9} />;
              if (lf.kind === "theme")
                return (
                  <g key={i} transform={`translate(${lf.x} ${lf.y})`}>
                    <circle r={3.4} className="fill-foreground" />
                    <text x={6} y={-6} className="fill-foreground font-mono text-[10px] font-semibold uppercase">
                      {lf.theme} ({lf.count})
                    </text>
                  </g>
                );
              const active = selected === lf.project.slug;
              const lit = path.has(lf.seg);
              return (
                <g
                  key={i}
                  transform={`translate(${lf.x} ${lf.y})`}
                  className="cursor-pointer"
                  onPointerEnter={() => setHover(lf.seg)}
                  onClick={() => setSelected(lf.project.slug)}
                >
                  <rect x={-9} y={-9} width={18} height={18} className={cn("fill-background stroke-foreground", (active || lit) && "stroke-[2]")} strokeWidth={0.9} />
                  <image href={lf.project.cover.src} x={-8} y={-8} width={16} height={16} preserveAspectRatio="xMidYMid slice" />
                  <g transform={`translate(${lf.side > 0 ? 12 : -12} 3)`}>
                    <text
                      textAnchor={lf.side > 0 ? "start" : "end"}
                      className={cn("fill-foreground font-mono text-[8.5px] lowercase", (active || lit) ? "font-semibold" : "opacity-70")}
                    >
                      {lf.project.title}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        <div className="absolute bottom-0 left-0 hidden gap-0.5 uppercase lg:grid">
          <p>(r)égénérer : touche r</p>
          <p>nombre de feuilles : {projects.length}</p>
          <p>branches : {groups.length}</p>
          <p>niveau max : {maxDepth}</p>
          <p className="mt-2 text-muted-foreground">\arborescence\tree_{seed}.svg</p>
        </div>
      </div>

      {/* Fiche */}
      <aside className="z-10 lg:absolute lg:right-0 lg:top-[18%] lg:w-[23rem]">
        <div className="grid gap-3 bg-background p-3 shadow-[0_0_0_1px_var(--border)]">
          {sel ? (
            <>
              <div className="flex gap-3">
                <div className="relative size-24 shrink-0 overflow-hidden bg-muted">
                  <Image src={sel.cover.src} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <dl className="grid flex-1 grid-cols-[6rem_1fr] content-start gap-y-0.5 uppercase">
                  <dt>type</dt>
                  <dd>: projet</dd>
                  <dt>thème</dt>
                  <dd>: {sel.text?.themes.join(", ")}</dd>
                  <dt>index</dt>
                  <dd>: {String(selIndex + 1).padStart(3, "0")}</dd>
                  <dt>année</dt>
                  <dd>: {sel.text?.year ?? "—"}</dd>
                  <dt>planches</dt>
                  <dd>: {sel.images.length}</dd>
                </dl>
              </div>
              <p className="text-[12px] font-semibold lowercase">{sel.title}</p>
              {sel.text?.intro && <p className="line-clamp-5 uppercase text-muted-foreground">{sel.text.intro}</p>}
              <div className="flex items-end gap-3 border-t pt-3">
                <div className="size-16 shrink-0 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
                <div className="grid gap-0.5 uppercase">
                  <p>qrcode : {String(selIndex + 1).padStart(2, "0")}</p>
                  <p className="text-muted-foreground">lien : /projets/{sel.slug}</p>
                  <Link href={`/projets/${sel.slug}`} className="mt-1 font-semibold hover:underline">
                    ouvrir le projet →
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <dl className="grid grid-cols-[7rem_1fr] gap-y-0.5 uppercase">
              <dt>type</dt>
              <dd>: racine</dd>
              <dt>nom</dt>
              <dd>: augustin marsollier</dd>
              <dt>projets</dt>
              <dd>: {projects.length}</dd>
              <dt>thèmes</dt>
              <dd>: {groups.length}</dd>
              <dt>contenu</dt>
              <dd className="text-muted-foreground">: survoler une feuille pour suivre sa branche, cliquer pour lire la fiche.</dd>
            </dl>
          )}
        </div>
      </aside>
    </div>
  );
}
