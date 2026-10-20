"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  forceCollide,
  forceLink,
  forceManyBody,
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
type L = SimulationLinkDatum<N> & { source: N; target: N; secondary?: boolean };
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
    links: { d: string; key: string; ends: readonly [string, string]; secondary: boolean }[];
  }>({ nodes: [], links: [] });
  const simRef = useRef<Simulation<N, L> | null>(null);
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
    // Interconnexions : chaque projet est aussi relié à ses autres thèmes ouverts
    // (à tous ses autres thèmes quand une catégorie est choisie : on voit ce qui la croise).
    nodes
      .filter((n) => n.kind === "project")
      .forEach((pn) =>
        pn.project!.text?.themes.filter((t2) => t2 !== pn.theme).forEach((t2) => {
          const tn = map.get(`t:${t2}`);
          if (tn && (focus || shown.has(t2)) && nodes.includes(tn)) links.push({ source: tn, target: pn, secondary: true });
        })
      );

    const snapshot = () => {
      nodes.forEach((n) => {
        // Marge au bord : la place de l'image ronde d'un projet (et de son nom centré dessous sur mobile).
        const side = n.kind === "project" ? (size.w < 600 ? 58 : Math.max(n.r, 36)) : n.r;
        n.x = Math.max(side, Math.min(size.w - side, n.x!));
        // Sur mobile, le nom d'un projet est sous sa bulle : on lui garde la place en bas.
        const below = n.kind === "project" && size.w < 600 ? 34 : 0;
        const edge = n.kind === "project" ? Math.max(n.r, 36) : n.r;
        // En haut, on laisse aussi la place de la rangée des catégories.
        n.y = Math.max(edge + 60, Math.min(size.h - edge - below, n.y!));
      });
      setFrame({
        nodes: nodes.map(({ id, kind, label, r, x, y, theme, project }) => {
          // Nom d'un point : à droite, sauf projet tourné vers la gauche ou nom qui sortirait du cadre.
          let side: 1 | -1 = kind === "project" && x! < (map.get(`t:${theme}`)?.x ?? size.w / 2) ? -1 : 1;
          if (kind !== "root" && x! + 150 > size.w) side = -1;
          if (x! - 150 < 0) side = 1;
          const links =
            kind === "root"
              ? groups.length
              : kind === "theme"
                ? 1 + projects.filter((p) => p.text?.themes.includes(theme!)).length
                : Math.max(1, project!.text?.themes.length ?? 1);
          return { id, kind, label, r, dot: dotRadius(kind, links), x: x!, y: y!, theme, project, side };
        }),
        links: links.map((l) => ({
          key: `${l.source.id}-${l.target.id}`,
          ends: [l.source.id, l.target.id] as const,
          secondary: !!l.secondary,
          d: `M${l.source.x} ${l.source.y} L${l.target.x} ${l.target.y}`,
        })),
      });
    };
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
          .strength((l) => (l.secondary ? 0.05 : 0.7))
      )
      .force("charge", forceManyBody<N>().strength((n) => (n.kind === "root" ? -1800 : n.kind === "theme" ? -1150 : -560) * k))
      // Les projets réservent la place de leur nom (à côté sur ordinateur, dessous sur mobile).
      .force("collide", forceCollide<N>((n) => n.r + (n.kind === "project" ? (size.w < 600 ? 34 : 58) : 26) * k).strength(1))
      .velocityDecay(0.28)
      .on("tick", snapshot)
      .alpha(0.9)
      .alphaTarget(0.004) // légère respiration permanente
      .restart();
    return () => {
      sim.stop();
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
        simRef.current?.alphaTarget(0.3).restart();
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
        simRef.current?.alphaTarget(0.004);
        const v = frame.nodes.find((x) => x.id === d.id);
        if (d.moved < 6 && v) activate(v);
      }}
    >
      {/* Rien que des points et des traits fins : liens principaux pleins, liens secondaires pointillés. */}
      <svg className="absolute inset-0 size-full text-foreground" aria-hidden>
        <g stroke="currentColor" strokeWidth={1} fill="none">
          {frame.links.map((l) => {
            const accent = !!focus && l.ends.includes(`t:${focus}`);
            return (
              <path
                key={l.key}
                d={l.d}
                stroke={accent ? ACCENT : undefined}
                strokeWidth={accent ? 1.6 : undefined}
                opacity={accent ? 0.9 : (l.secondary ? 0.3 : 0.45) * Math.min(dim(l.ends[0]), dim(l.ends[1]))}
                strokeDasharray={l.secondary ? "1 5" : undefined}
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
                className={cn("relative shrink-0 overflow-hidden rounded-full bg-muted transition-transform duration-300", hover === n.id && "scale-125")}
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
