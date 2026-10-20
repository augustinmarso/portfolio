"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { cn } from "@/lib/utils";
import { THEMES, type Project } from "@/lib/projects";

type Node = SimulationNodeDatum & { id: string; label: string; kind: "theme" | "project"; slug?: string };
type Edge = SimulationLinkDatum<Node> & { source: Node; target: Node };

// Disposition calculée une fois (simulation figée), comme la vue graphe d'Obsidian.
function useGraph(projects: Project[]) {
  return useMemo(() => {
    const used = THEMES.filter((t) => projects.some((p) => p.text?.themes.includes(t)));
    const nodes: Node[] = [
      ...used.map((t) => ({ id: `t:${t}`, label: t, kind: "theme" as const })),
      ...projects.map((p) => ({ id: `p:${p.slug}`, label: p.title, kind: "project" as const, slug: p.slug })),
    ];
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links = projects.flatMap((p) =>
      (p.text?.themes ?? []).map((t) => ({ source: byId.get(`p:${p.slug}`)!, target: byId.get(`t:${t}`)! }))
    ) as Edge[];
    const sim = forceSimulation(nodes)
      .force("link", forceLink<Node, Edge>(links).distance(70).strength(0.6))
      .force("charge", forceManyBody<Node>().strength((n) => (n.kind === "theme" ? -420 : -160)))
      .force("collide", forceCollide<Node>((n) => (n.kind === "theme" ? 34 : 22)))
      .force("center", forceCenter(0, 0))
      .stop();
    for (let i = 0; i < 400; i++) sim.tick();
    const xs = nodes.map((n) => n.x!);
    const ys = nodes.map((n) => n.y!);
    const pad = 70;
    const box = {
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad,
      w: Math.max(...xs) - Math.min(...xs) + pad * 2,
      h: Math.max(...ys) - Math.min(...ys) + pad * 2,
    };
    return { nodes, links, themes: used, box };
  }, [projects]);
}

export function ProjectGraph({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { nodes, links, themes, box } = useGraph(projects);
  const [focus, setFocus] = useState<string | null>(params.get("theme") ? `t:${params.get("theme")}` : null);
  const [open, setOpen] = useState<Set<string>>(() => new Set(params.get("theme") ? [params.get("theme")!] : []));
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const pan = useRef<{ x: number; y: number } | null>(null);

  const neighbours = useMemo(() => {
    if (!focus) return null;
    const set = new Set([focus]);
    links.forEach((l) => {
      if (l.source.id === focus) set.add(l.target.id);
      if (l.target.id === focus) set.add(l.source.id);
    });
    return set;
  }, [focus, links]);

  const projectsOf = (t: string) => projects.filter((p) => p.text?.themes.includes(t));
  const toggleFolder = (t: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
      {/* Explorateur de fichiers */}
      <nav aria-label="Projets par thème" className="text-base font-semibold">
        <p className="mb-3 text-muted-foreground">projets / {projects.length}</p>
        <ul>
          {themes.map((t) => {
            const isOpen = open.has(t);
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => toggleFolder(t)}
                  onMouseEnter={() => setFocus(`t:${t}`)}
                  aria-expanded={isOpen}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-muted",
                    focus === `t:${t}` && "bg-muted"
                  )}
                >
                  <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                  {isOpen ? <FolderOpen className="size-4 shrink-0" /> : <Folder className="size-4 shrink-0" />}
                  <span className="flex-1">{t}</span>
                  <span className="text-sm text-muted-foreground">{projectsOf(t).length}</span>
                </button>
                {isOpen && (
                  <ul className="ml-[0.95rem] border-l pl-2">
                    {projectsOf(t).map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/projets/${p.slug}`}
                          onMouseEnter={() => setFocus(`p:${p.slug}`)}
                          className="flex items-center gap-1.5 rounded px-1.5 py-1 font-normal hover:bg-muted"
                        >
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate lowercase">{p.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Vue graphe */}
      <div className="relative h-[70vh] overflow-hidden rounded-sm border bg-muted/40 lg:h-[calc(100dvh-12rem)]">
        <svg
          viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
          className="size-full cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={(e) => {
            pan.current = { x: e.clientX, y: e.clientY };
            (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!pan.current) return;
            const scale = box.w / e.currentTarget.clientWidth / view.k;
            const dx = (e.clientX - pan.current.x) * scale;
            const dy = (e.clientY - pan.current.y) * scale;
            pan.current = { x: e.clientX, y: e.clientY };
            setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
          }}
          onPointerUp={() => (pan.current = null)}
          onWheel={(e) => setView((v) => ({ ...v, k: Math.min(3, Math.max(0.5, v.k * (e.deltaY > 0 ? 0.9 : 1.1))) }))}
          onPointerLeave={() => setFocus(null)}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {links.map((l, i) => {
              const lit = neighbours?.has(l.source.id) && neighbours?.has(l.target.id) && (l.source.id === focus || l.target.id === focus);
              return (
                <line
                  key={i}
                  x1={l.source.x}
                  y1={l.source.y}
                  x2={l.target.x}
                  y2={l.target.y}
                  className={cn("stroke-foreground", lit ? "opacity-80" : neighbours ? "opacity-10" : "opacity-25")}
                  strokeWidth={lit ? 1.6 : 1}
                />
              );
            })}
            {nodes.map((n) => {
              const dim = neighbours && !neighbours.has(n.id);
              const r = n.kind === "theme" ? 9 : 5;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  className={cn("cursor-pointer", dim && "opacity-20")}
                  onPointerEnter={() => setFocus(n.id)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => (n.slug ? router.push(`/projets/${n.slug}`) : toggleFolder(n.label))}
                >
                  <circle r={r} className={n.kind === "theme" ? "fill-foreground" : "fill-muted-foreground"} />
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    className={cn("fill-foreground lowercase", n.kind === "theme" ? "text-[13px] font-bold" : "text-[10px] font-semibold")}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <p className="pointer-events-none absolute bottom-3 left-3 text-sm font-semibold text-muted-foreground">
          survoler pour relier, cliquer pour ouvrir, molette pour zoomer
        </p>
      </div>
    </div>
  );
}
