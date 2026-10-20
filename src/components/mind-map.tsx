"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { THEMES, type Project } from "@/lib/projects";

// Rayon d'un point selon son nombre de connexions : plus il est relié, plus il est gros.
// Noir pour la racine et les thèmes, image ronde pour un projet (connexions = ses thèmes).
// Les rayons de la simulation, eux, réservent la place des noms.
const dotRadius = (kind: Kind, links: number) =>
  kind === "project" ? 12 + 7 * (links - 1) : 2.5 + 2 * Math.sqrt(links);

// Couleur de la catégorie choisie : son point, son nom, ses liens et le contour de ses projets.
const ACCENT = "#1d1bff";

type Kind = "root" | "theme" | "project";
type N = SimulationNodeDatum & { id: string; kind: Kind; label: string; r: number; theme?: string; project?: Project };
type L = SimulationLinkDatum<N> & { source: N; target: N; secondary?: boolean; cross?: "theme" | "project"; weight?: number };
type View = { id: string; kind: Kind; label: string; r: number; dot: number; x: number; y: number; theme?: string; project?: Project; side?: 1 | -1 };

export function MindMap({ projects, className }: { projects: Project[]; className?: string }) {
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1100, h: 760 });
  // Tout déployé au départ ; replié sur petit écran (on déplie au toucher).
  const [open, setOpen] = useState<Set<string>>(() =>
    typeof window !== "undefined" && window.innerWidth < 900 ? new Set() : new Set(THEMES)
  );
  // Catégorie choisie : seule ouverte, avec tous ses projets ; le reste passe en retrait.
  const [focus, setFocus] = useState<string | null>(null);
  const shown = useMemo(() => (focus ? new Set([focus]) : open), [focus, open]);
  const [hover, setHover] = useState<string | null>(null);
  const [frame, setFrame] = useState<{
    nodes: View[];
    links: { d: string; key: string; ends: readonly [string, string]; secondary: boolean; cross?: "theme" | "project"; weight: number }[];
  }>({ nodes: [], links: [] });
  const simRef = useRef<Simulation<N, L> | null>(null);
  // Positions affichées : elles rejoignent en douceur celles de la simulation (pas d'à-coups).
  const shownPos = useRef<Map<string, { x: number; y: number }>>(new Map());
  const nodesRef = useRef<Map<string, N>>(new Map());
  const drag = useRef<{ id: string; moved: number } | null>(null);

  const k = Math.max(0.62, Math.min(1, size.w / 1250, size.h / 820)); // échelle des bulles selon la place

  const groups = useMemo(
    // Tous les thèmes utilisés deviennent des points ; un projet pend à son premier thème
    // et se relie aux autres par des liens secondaires. La catégorie choisie regroupe,
    // elle, tous les projets qui la portent, même en thème secondaire.
    () =>
      THEMES.map((t) => ({
        theme: t,
        projects: projects.filter((p) => (t === focus ? p.text?.themes.includes(t) : p.text?.themes[0] === t)),
      })).filter((g) => projects.some((p) => p.text?.themes.includes(g.theme))),
    [projects, focus]
  );
  const counts = useMemo(
    () => new Map(groups.map((g) => [g.theme, projects.filter((p) => p.text?.themes.includes(g.theme)).length])),
    [groups, projects]
  );

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Simulation physique : racine + thèmes + projets des thèmes ouverts. Les nœuds sont
  // conservés d'un changement à l'autre (les projets jaillissent de leur thème) et le
  // rendu ne lit qu'un instantané des positions, mis à jour à chaque image.
  useEffect(() => {
    const map = nodesRef.current;
    const get = (id: string, init: Omit<N, "id">, from?: N) => {
      let n = map.get(id);
      if (!n) {
        n = { id, ...init, x: (from?.x ?? size.w / 2) + (Math.random() - 0.5) * 8, y: (from?.y ?? size.h / 2) + (Math.random() - 0.5) * 8 };
        map.set(id, n);
      }
      n.r = init.r;
      return n;
    };
    const root = get("root", { kind: "root", label: "augustin marsollier", r: 82 * k });
    root.fx = size.w / 2;
    root.fy = size.h / 2;
    const nodes: N[] = [root];
    const links: L[] = [];
    groups.forEach((g) => {
      const t = get(`t:${g.theme}`, { kind: "theme", label: g.theme, r: (shown.has(g.theme) ? 54 : 48) * k, theme: g.theme }, root);
      nodes.push(t);
      links.push({ source: root, target: t });
      if (shown.has(g.theme))
        g.projects.forEach((p) => {
          const pn = get(`p:${p.slug}`, { kind: "project", label: p.title.split(" · ")[0], r: 30 * k, project: p, theme: g.theme }, t);
          pn.theme = g.theme;
          nodes.push(pn);
          links.push({ source: t, target: pn });
        });
    });
    // Interconnexions, en pointillés et sans tirer la mise en page :
    // chaque projet affiché est relié à tous ses autres thèmes…
    const shownProjects = nodes.filter((n) => n.kind === "project");
    shownProjects.forEach((pn) =>
      pn.project!.text?.themes.filter((t2) => t2 !== pn.theme).forEach((t2) => {
        const tn = map.get(`t:${t2}`);
        if (tn && nodes.includes(tn)) links.push({ source: tn, target: pn, secondary: true });
      })
    );
    // …deux thèmes sont reliés dès qu'un projet les porte ensemble (trait d'autant plus épais)…
    const pairs = new Map<string, number>();
    projects.forEach((p) => {
      const t = [...(p.text?.themes ?? [])].sort();
      t.forEach((a, i) => t.slice(i + 1).forEach((b) => pairs.set(`${a}|${b}`, (pairs.get(`${a}|${b}`) ?? 0) + 1)));
    });
    pairs.forEach((weight, key) => {
      const [a, b] = key.split("|").map((t) => map.get(`t:${t}`));
      if (a && b && nodes.includes(a) && nodes.includes(b)) links.push({ source: a, target: b, secondary: true, cross: "theme", weight });
    });
    // …et deux projets affichés le sont s'ils partagent au moins deux thèmes.
    shownProjects.forEach((a, i) =>
      shownProjects.slice(i + 1).forEach((b) => {
        const common = a.project!.text?.themes.filter((t) => b.project!.text?.themes.includes(t)).length ?? 0;
        if (common >= 2) links.push({ source: a, target: b, secondary: true, cross: "project", weight: common });
      })
    );

    const clamp = () =>
      nodes.forEach((n) => {
        // Marge au bord : la place de l'image ronde d'un projet (et de son nom centré dessous sur mobile).
        const side = n.kind === "project" ? (size.w < 600 ? 58 : Math.max(n.r, 36)) : n.r;
        n.x = Math.max(side, Math.min(size.w - side, n.x!));
        const below = n.kind === "project" && size.w < 600 ? 34 : 0;
        const edge = n.kind === "project" ? Math.max(n.r, 36) : n.r;
        // En haut, on laisse aussi la place de la rangée des catégories.
        n.y = Math.max(edge + 60, Math.min(size.h - edge - below, n.y!));
      });
    const cx = size.w / 2;
    const cy = size.h / 2;
    let raf = 0;
    const loop = (time: number) => {
      const disp = shownPos.current;
      nodes.forEach((n, i) => {
        // flottement lent et propre à chaque point (respiration), au lieu de secousses
        const fx = n.kind === "root" ? 0 : Math.sin(time / 2600 + i * 1.7) * 2.2;
        const fy = n.kind === "root" ? 0 : Math.cos(time / 3100 + i * 2.3) * 2.2;
        const tx = n.x! + fx;
        const ty = n.y! + fy;
        const d = disp.get(n.id) ?? { x: tx, y: ty };
        d.x += (tx - d.x) * 0.12;
        d.y += (ty - d.y) * 0.12;
        disp.set(n.id, d);
      });
      const at = (n: N) => disp.get(n.id)!;
      setFrame({
        nodes: nodes.map((n) => {
          const { id, kind, label, r, theme, project } = n;
          const { x, y } = at(n);
          // Nom tourné vers l'extérieur (à l'opposé du centre), sauf s'il sortirait du cadre.
          let side: 1 | -1 = x < cx ? -1 : 1;
          if (kind === "root") side = 1;
          if (kind !== "root" && x + 150 > size.w) side = -1;
          if (x - 150 < 0) side = 1;
          const links =
            kind === "root"
              ? groups.length
              : kind === "theme"
                ? 1 + projects.filter((p) => p.text?.themes.includes(theme!)).length
                : Math.max(1, project!.text?.themes.length ?? 1);
          return { id, kind, label, r, dot: dotRadius(kind, links), x, y, theme, project, side };
        }),
        links: links.map((l) => {
          const a = at(l.source);
          const b = at(l.target);
          // courbe douce : le milieu est poussé vers l'extérieur (loin du centre)
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const ox = mx - cx;
          const oy = my - cy;
          const len = Math.hypot(ox, oy) || 1;
          const bend = Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
          return {
            key: `${l.source.id}-${l.target.id}`,
            ends: [l.source.id, l.target.id] as const,
            secondary: !!l.secondary,
            cross: l.cross,
            weight: l.weight ?? 1,
            d: `M${a.x} ${a.y} Q${mx + (ox / len) * bend} ${my + (oy / len) * bend} ${b.x} ${b.y}`,
          };
        }),
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const sim = simRef.current ?? forceSimulation<N, L>();
    simRef.current = sim;
    sim
      .nodes(nodes)
      // Un thème ouvert s'éloigne du centre pour laisser respirer ses projets.
      .force(
        "link",
        forceLink<N, L>(links)
          .distance(
            (l) =>
              l.source.r +
              l.target.r +
              (l.secondary ? 230 : l.target.kind === "theme" && shown.has(l.target.theme!) ? 130 : l.target.kind === "project" ? 50 : 70) * k
          )
          // Les liens entre thèmes sont seulement dessinés ; ceux entre projets rapprochent à peine.
          .strength((l) => (l.cross === "theme" ? 0 : l.cross === "project" ? 0.02 : l.secondary ? 0.05 : 0.7))
      )
      .force("charge", forceManyBody<N>().strength((n) => (n.kind === "root" ? -1200 : n.kind === "theme" ? -700 : -380) * k))
      // Anneaux concentriques : les thèmes autour du nom, les projets à l'extérieur.
      .force(
        "radial",
        forceRadial<N>(
          (n) => (n.kind === "root" ? 0 : n.kind === "theme" ? Math.min(size.w, size.h) * 0.24 : Math.min(size.w, size.h) * 0.43),
          size.w / 2,
          size.h / 2
        ).strength((n) => (n.kind === "theme" ? 0.35 : n.kind === "project" ? 0.25 : 0))
      )
      // Les projets réservent la place de leur nom (à côté sur ordinateur, dessous sur mobile).
      .force(
        "collide",
        // un projet réserve aussi la place de son nom (≈ 6,5 px par lettre sur ordinateur)
        forceCollide<N>((n) => (n.kind === "project" ? n.r + (size.w < 600 ? 34 : Math.min(110, 18 + n.label.length * 3.4)) * k : n.r + 26 * k)).strength(1)
      )
      .velocityDecay(0.55) // mouvements amortis, sans rebonds
      .on("tick", clamp)
      .alpha(0.8)
      .alphaDecay(0.015)
      .alphaTarget(0)
      .restart();
    return () => {
      sim.stop();
      cancelAnimationFrame(raf);
    };
  }, [projects, groups, shown, focus, k, size.w, size.h]);

  const toggle = (theme: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(theme)) n.delete(theme);
      else n.add(theme);
      return n;
    });

  const local = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const activate = (v: View) => {
    if (v.kind === "theme") {
      if (focus) setFocus(focus === v.theme ? null : v.theme!);
      else toggle(v.theme!);
    }
    if (v.kind === "project") router.push(`/projets/${v.project!.slug}`);
    if (v.kind === "root") {
      setFocus(null);
      setOpen((s) => (s.size ? new Set() : new Set(groups.map((g) => g.theme))));
    }
  };

  // En retrait quand une catégorie est choisie : tout ce qui n'est ni elle, ni ses projets,
  // ni les catégories qui la croisent.
  const lit = useMemo(() => {
    if (!focus) return null;
    const s = new Set(["root", `t:${focus}`]);
    projects
      .filter((p) => p.text?.themes.includes(focus))
      .forEach((p) => {
        s.add(`p:${p.slug}`);
        p.text?.themes.forEach((t) => s.add(`t:${t}`));
      });
    return s;
  }, [focus, projects]);
  const dim = (id: string) => (lit && !lit.has(id) ? 0.2 : 1);

  return (
    <div
      ref={boxRef}
      className={cn("relative h-[78vh] touch-none select-none overflow-hidden lg:h-[calc(100dvh-8rem)]", className)}
      onPointerMove={(e) => {
        const d = drag.current;
        const n = d && nodesRef.current.get(d.id);
        if (!d || !n) return;
        const p = local(e);
        d.moved += Math.abs(p.x - (n.fx ?? p.x)) + Math.abs(p.y - (n.fy ?? p.y));
        n.fx = p.x;
        n.fy = p.y;
        simRef.current?.alphaTarget(0.12).restart();
      }}
      onPointerUp={() => {
        const d = drag.current;
        const n = d && nodesRef.current.get(d.id);
        drag.current = null;
        if (!d || !n) return;
        if (n.kind !== "root") {
          n.fx = null;
          n.fy = null;
        }
        simRef.current?.alphaTarget(0);
        const v = frame.nodes.find((x) => x.id === d.id);
        if (d.moved < 6 && v) activate(v);
      }}
    >
      {/* Rien que des points et des traits fins : liens principaux pleins, liens secondaires pointillés. */}
      <svg className="absolute inset-0 size-full text-foreground" aria-hidden>
        <g stroke="currentColor" strokeWidth={1} fill="none">
          {frame.links.map((l) => {
            const accent = !!focus && l.ends.includes(`t:${focus}`);
            // au survol d'un point, toutes ses connexions se révèlent
            const near = !!hover && l.ends.includes(hover);
            return (
              <path
                key={l.key}
                d={l.d}
                stroke={accent ? ACCENT : undefined}
                className="transition-[opacity,stroke-width] duration-500"
                // Thèmes croisés : tirets, plus épais quand plusieurs projets les réunissent.
                strokeWidth={(l.cross ? 0.5 + 0.4 * l.weight : 1) * (accent || near ? 1.5 : 1)}
                opacity={
                  accent || near
                    ? 0.85
                    : (l.cross ? 0.07 : l.secondary ? 0.06 : 0.32) * Math.min(dim(l.ends[0]), dim(l.ends[1])) * (hover ? 0.6 : 1)
                }
                strokeDasharray={l.cross === "theme" ? "4 4" : l.secondary ? "1 5" : undefined}
                strokeLinecap="round"
              />
            );
          })}
        </g>
        <g fill="currentColor">
          {frame.nodes
            .filter((n) => n.kind !== "project")
            .map((n) => (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={n.dot * (hover === n.id || focus === n.theme ? 1.4 : 1)}
                fill={focus && n.id === `t:${focus}` ? ACCENT : undefined}
                opacity={dim(n.id)}
              />
            ))}
        </g>
      </svg>

      {frame.nodes.map((n) => {
        const right = n.side !== -1;
        const half = n.kind === "project" ? n.dot : 10;
        return (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            aria-label={n.kind === "project" ? `Ouvrir ${n.label}` : n.kind === "theme" ? `Déplier ${n.label}` : n.label}
            onKeyDown={(e) => e.key === "Enter" && activate(n)}
            onPointerDown={(e) => {
              e.preventDefault();
              drag.current = { id: n.id, moved: 0 };
              const node = nodesRef.current.get(n.id);
              const p = local(e);
              if (node) {
                node.fx = p.x;
                node.fy = p.y;
              }
            }}
            onPointerEnter={() => setHover(n.id)}
            onPointerLeave={() => setHover(null)}
            className={cn(
              "absolute flex cursor-grab items-center gap-2 whitespace-nowrap py-1 leading-none outline-none active:cursor-grabbing",
              right ? "flex-row" : "flex-row-reverse",
              n.kind === "root" ? "text-base font-bold" : n.kind === "theme" ? "text-sm font-semibold" : "text-sm font-medium text-muted-foreground",
              (hover === n.id || (focus && focus === n.theme && n.kind === "theme")) && "text-foreground underline underline-offset-4"
            )}
            // Le point (vide, ou l'image ronde d'un projet) est centré sur sa position : le nom part à droite ou à gauche.
            style={{
              left: n.x,
              top: n.y,
              opacity: dim(n.id),
              color: focus && n.id === `t:${focus}` ? ACCENT : undefined,
              transform: right ? `translate(-${half}px, -50%)` : `translate(calc(-100% + ${half}px), -50%)`,
            }}
          >
            {n.kind === "project" ? (
              <span
                className={cn("relative shrink-0 overflow-hidden rounded-full transition-transform duration-300", hover === n.id && "scale-125")}
                style={{
                  width: half * 2,
                  height: half * 2,
                  boxShadow: focus && n.theme === focus ? `0 0 0 2px var(--background), 0 0 0 4px ${ACCENT}` : undefined,
                }}
              >
                <Image src={n.project!.cover.src} alt="" fill sizes="64px" className="object-cover" />
              </span>
            ) : (
              <span className="size-5 shrink-0" />
            )}
            <span className="lowercase">{n.label}</span>
          </div>
        );
      })}

      {/* Recherche par catégorie : une catégorie à la fois, avec son nombre de projets. */}
      <div className="absolute left-0 top-0 z-10 flex max-w-full flex-wrap gap-x-3 gap-y-1 bg-background/90 py-1 pr-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setFocus(null)}
          aria-pressed={!focus}
          className={cn(!focus ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          tout
        </button>
        {groups.map((g) => (
          <button
            key={g.theme}
            type="button"
            onClick={() => setFocus(focus === g.theme ? null : g.theme)}
            aria-pressed={focus === g.theme}
            className={cn(focus === g.theme ? "underline underline-offset-4" : "text-muted-foreground hover:text-foreground")}
            style={focus === g.theme ? { color: ACCENT } : undefined}
          >
            {g.theme}
            <sup className="ml-0.5 font-medium">{counts.get(g.theme)}</sup>
          </button>
        ))}
      </div>
    </div>
  );
}
