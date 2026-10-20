"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

const BLUE = "#1d1bff";

type Kind = "root" | "theme" | "project";
type N = SimulationNodeDatum & { id: string; kind: Kind; label: string; r: number; theme?: string; project?: Project };
type L = SimulationLinkDatum<N> & { source: N; target: N; secondary?: boolean };
type View = { id: string; kind: Kind; label: string; r: number; x: number; y: number; theme?: string; project?: Project };

// Branche effilée entre deux bulles : large aux extrémités, fine au milieu.
// Le filtre « goo » fond ensuite bulles et branches en une seule matière.
// Les liens secondaires (projet ↔ ses autres thèmes) sont plus fins.
function branch(a: N, b: N, secondary = false) {
  const dx = b.x! - a.x!;
  const dy = b.y! - a.y!;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const f = secondary ? 0.15 : 0.42;
  const wa = a.r * f;
  const wb = b.r * f;
  const wm = secondary ? 1.4 : Math.max(4, Math.min(a.r, b.r) * 0.1);
  const mx = (a.x! + b.x!) / 2;
  const my = (a.y! + b.y!) / 2;
  return `M${a.x! + nx * wa} ${a.y! + ny * wa} Q${mx + nx * wm} ${my + ny * wm} ${b.x! + nx * wb} ${b.y! + ny * wb} L${b.x! - nx * wb} ${b.y! - ny * wb} Q${mx - nx * wm} ${my - ny * wm} ${a.x! - nx * wa} ${a.y! - ny * wa} Z`;
}

export function MindMap({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1100, h: 760 });
  // Tout déployé au départ ; replié sur petit écran (on déplie au toucher).
  const [open, setOpen] = useState<Set<string>>(() =>
    typeof window !== "undefined" && window.innerWidth < 900 ? new Set() : new Set(THEMES)
  );
  const [hover, setHover] = useState<string | null>(null);
  const [frame, setFrame] = useState<{ nodes: View[]; links: { d: string; key: string }[] }>({ nodes: [], links: [] });
  const simRef = useRef<Simulation<N, L> | null>(null);
  const nodesRef = useRef<Map<string, N>>(new Map());
  const drag = useRef<{ id: string; moved: number } | null>(null);

  const k = Math.max(0.62, Math.min(1, size.w / 1250, size.h / 820)); // échelle des bulles selon la place

  const groups = useMemo(
    // Tous les thèmes utilisés deviennent des bulles ; un projet pend à son premier thème
    // et se relie aux autres par des liens secondaires.
    () =>
      THEMES.map((t) => ({ theme: t, projects: projects.filter((p) => p.text?.themes[0] === t) })).filter((g) =>
        projects.some((p) => p.text?.themes.includes(g.theme))
      ),
    [projects]
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
      const t = get(`t:${g.theme}`, { kind: "theme", label: g.theme, r: (open.has(g.theme) ? 54 : 48) * k, theme: g.theme }, root);
      nodes.push(t);
      links.push({ source: root, target: t });
      if (open.has(g.theme))
        g.projects.forEach((p) => {
          const pn = get(`p:${p.slug}`, { kind: "project", label: p.title.split(" · ")[0], r: 37 * k, project: p, theme: g.theme }, t);
          nodes.push(pn);
          links.push({ source: t, target: pn });
        });
    });
    // Interconnexions : chaque projet est aussi relié à ses autres thèmes ouverts.
    nodes
      .filter((n) => n.kind === "project")
      .forEach((pn) =>
        pn.project!.text?.themes.slice(1).forEach((t2) => {
          const tn = map.get(`t:${t2}`);
          if (tn && open.has(t2) && nodes.includes(tn)) links.push({ source: tn, target: pn, secondary: true });
        })
      );

    const snapshot = () => {
      nodes.forEach((n) => {
        n.x = Math.max(n.r, Math.min(size.w - n.r, n.x!));
        n.y = Math.max(n.r, Math.min(size.h - n.r, n.y!));
      });
      setFrame({
        nodes: nodes.map(({ id, kind, label, r, x, y, theme, project }) => ({ id, kind, label, r, x: x!, y: y!, theme, project })),
        links: links.map((l) => ({ key: `${l.source.id}-${l.target.id}`, d: branch(l.source, l.target, l.secondary) })),
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
              (l.secondary ? 190 : l.target.kind === "theme" && open.has(l.target.theme!) ? 130 : l.target.kind === "project" ? 50 : 70) * k
          )
          .strength((l) => (l.secondary ? 0.12 : 0.7))
      )
      .force("charge", forceManyBody<N>().strength((n) => (n.kind === "root" ? -1800 : n.kind === "theme" ? -1150 : -560) * k))
      .force("collide", forceCollide<N>((n) => n.r + 26 * k).strength(1))
      .velocityDecay(0.28)
      .on("tick", snapshot)
      .alpha(0.9)
      .alphaTarget(0.004) // légère respiration permanente
      .restart();
    return () => {
      sim.stop();
    };
  }, [groups, open, k, size.w, size.h]);

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
    if (v.kind === "theme") toggle(v.theme!);
    if (v.kind === "project") router.push(`/projets/${v.project!.slug}`);
    if (v.kind === "root") setOpen((s) => (s.size ? new Set() : new Set(groups.map((g) => g.theme))));
  };

  return (
    <div
      ref={boxRef}
      className="relative h-[78vh] touch-none select-none overflow-hidden lg:h-[calc(100dvh-8rem)]"
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
      <svg className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <filter id="goo" filterUnits="userSpaceOnUse" x={0} y={0} width={size.w} height={size.h}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={6 * k + 2} result="blur" />
            <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
        <g filter="url(#goo)" fill={BLUE}>
          {frame.links.map((l) => (
            <path key={l.key} d={l.d} />
          ))}
          {frame.nodes.map((n) => (
            <circle key={n.id} cx={n.x} cy={n.y} r={n.r} />
          ))}
        </g>
      </svg>

      {/* Contenus des bulles (hors filtre, nets) */}
      {frame.nodes.map((n) => (
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
          className="absolute grid cursor-grab place-items-center overflow-hidden rounded-full text-center text-white outline-none active:cursor-grabbing"
          style={{ left: n.x - n.r, top: n.y - n.r, width: n.r * 2, height: n.r * 2 }}
        >
          {n.kind === "project" && (
            <span className={`absolute inset-[6%] overflow-hidden rounded-full transition-opacity duration-500 ${hover === n.id ? "opacity-100" : "opacity-0"}`}>
              <Image src={n.project!.cover.src} alt="" fill sizes="90px" className="object-cover" />
            </span>
          )}
          <span
            className={`relative px-1 leading-tight transition-opacity duration-300 ${n.kind === "project" && hover === n.id ? "opacity-0" : "opacity-100"}`}
            style={{ fontSize: (n.kind === "root" ? 20 : n.kind === "theme" ? 15 : 12) * Math.max(k, 0.82) }}
          >
            {n.kind === "root" ? (
              <>
                augustin
                <br />
                marsollier
              </>
            ) : (
              <span className={n.kind === "theme" ? "font-semibold" : "lowercase"}>{n.label}</span>
            )}
          </span>
        </div>
      ))}

      <p className="pointer-events-none absolute bottom-2 left-0 text-sm font-semibold text-muted-foreground">
        cliquer un thème pour l&apos;ouvrir, un projet pour le voir — les bulles se déplacent
      </p>
    </div>
  );
}
