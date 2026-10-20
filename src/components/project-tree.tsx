"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { THEMES, type Project } from "@/lib/projects";

const ROW = 52; // hauteur d'une ligne de projet
const GROUP_GAP = 22; // respiration entre deux thèmes
const ROOT_W = 210; // largeur réservée à la racine
const THEME_W = 170; // largeur d'un nœud de thème

type Group = { theme: string; projects: Project[] };

// Arborescence classique : racine → thèmes → projets, liens en coude.
// Chaque projet est rangé sous son premier thème (un arbre, pas un graphe).
export function ProjectTree({ projects }: { projects: Project[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [hover, setHover] = useState<{ theme?: string; slug?: string } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const groups: Group[] = useMemo(
    () => THEMES.map((t) => ({ theme: t, projects: projects.filter((p) => p.text?.themes[0] === t) })).filter((g) => g.projects.length),
    [projects]
  );

  const layout = useMemo(() => {
    const rows: (Group & { ys: number[]; y: number })[] = [];
    let y = ROW / 2;
    for (const g of groups) {
      const ys: number[] = [];
      for (let i = 0; i < g.projects.length; i++) ys.push(y + i * ROW);
      y += g.projects.length * ROW + GROUP_GAP;
      rows.push({ ...g, ys, y: (ys[0] + ys[ys.length - 1]) / 2 });
    }
    const height = y - GROUP_GAP - ROW / 2;
    const rootY = (rows[0].y + rows[rows.length - 1].y) / 2;
    const themeX = Math.max(ROOT_W + 70, width * 0.28);
    const projX = Math.max(themeX + THEME_W + 70, width * 0.52);
    return { rows, height, rootY, themeX, projX };
  }, [groups, width]);

  const { rows, height, rootY, themeX, projX } = layout;
  const elbow = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = x1 + (x2 - x1) * 0.5;
    const r = Math.min(10, Math.abs(y2 - y1) / 2, (x2 - x1) / 4);
    if (Math.abs(y2 - y1) < 1) return `M${x1} ${y1} H${x2}`;
    const dir = y2 > y1 ? 1 : -1;
    return `M${x1} ${y1} H${mx - r} Q${mx} ${y1} ${mx} ${y1 + dir * r} V${y2 - dir * r} Q${mx} ${y2} ${mx + r} ${y2} H${x2}`;
  };

  const themeLit = (t: string) =>
    hover?.theme === t || (!!hover?.slug && !!rows.find((r) => r.theme === t)?.projects.some((p) => p.slug === hover.slug));
  const projLit = (t: string, slug: string) => hover?.slug === slug || hover?.theme === t;
  const dim = hover !== null;

  return (
    <>
      {/* Grand écran : arbre de gauche à droite */}
      <div ref={boxRef} className="relative hidden lg:block" style={{ height: height + ROW }} onMouseLeave={() => setHover(null)}>
        <svg className="pointer-events-none absolute inset-x-0 overflow-visible animate-in fade-in duration-700" style={{ top: ROW / 2, height }} width="100%">
          {rows.map((r) => (
            <path
              key={`r-${r.theme}`}
              d={elbow(ROOT_W, rootY, themeX, r.y)}
              fill="none"
              stroke="currentColor"
              strokeWidth={themeLit(r.theme) ? 2 : 1}
              className={cn("transition-opacity duration-300", dim && !themeLit(r.theme) && "opacity-20")}
            />
          ))}
          {rows.flatMap((r) =>
            r.projects.map((p, i) => (
              <path
                key={`p-${p.slug}`}
                d={elbow(themeX + THEME_W, r.y, projX, r.ys[i])}
                  fill="none"
                stroke="currentColor"
                strokeWidth={projLit(r.theme, p.slug) ? 2 : 1}
                className={cn("transition-opacity duration-300", dim && !projLit(r.theme, p.slug) && "opacity-20")}
              />
            ))
          )}
        </svg>

        <div className="absolute left-0 -translate-y-1/2" style={{ top: rootY + ROW / 2, width: ROOT_W }}>
          <p className="text-xl font-bold leading-tight">augustin marsollier</p>
          <p className="text-sm font-semibold text-muted-foreground">
            {projects.length} projets, {groups.length} thèmes
          </p>
        </div>

        {rows.map((r) => (
          <button
            key={r.theme}
            type="button"
            onMouseEnter={() => setHover({ theme: r.theme })}
            onFocus={() => setHover({ theme: r.theme })}
            className={cn(
              "absolute flex -translate-y-1/2 items-baseline justify-between gap-2 border-y border-foreground bg-background py-1.5 text-left transition-opacity",
              dim && !themeLit(r.theme) && "opacity-30"
            )}
            style={{ top: r.y + ROW / 2, left: themeX, width: THEME_W }}
          >
            <span className="text-lg font-bold">{r.theme}</span>
            <span className="text-sm font-semibold text-muted-foreground">{r.projects.length}</span>
          </button>
        ))}

        {rows.flatMap((r) =>
          r.projects.map((p, i) => (
            <Link
              key={p.slug}
              href={`/projets/${p.slug}`}
              onMouseEnter={() => setHover({ slug: p.slug })}
              onFocus={() => setHover({ slug: p.slug })}
              className={cn("group absolute flex -translate-y-1/2 items-center gap-3 pr-4 transition-opacity", dim && !projLit(r.theme, p.slug) && "opacity-30")}
              style={{ top: r.ys[i] + ROW / 2, left: projX, right: 0 }}
            >
              <span className="relative block size-10 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-foreground/15 transition-transform duration-300 group-hover:scale-110">
                <Image src={p.cover.src} alt="" fill sizes="40px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1 truncate text-lg font-semibold lowercase group-hover:underline">{p.title}</span>
              <span className="hidden shrink-0 text-sm font-semibold text-muted-foreground xl:inline">
                {[p.text?.year, p.text?.themes.slice(1).join(", ")].filter(Boolean).join(" · ")}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Mobile : liste indentée, comme un explorateur de fichiers */}
      <div className="lg:hidden">
        <p className="text-xl font-bold">augustin marsollier</p>
        <ul className="ml-2 mt-3 border-l border-foreground">
          {rows.map((r) => (
            <li key={r.theme} className="relative pl-6 pt-3 before:absolute before:left-0 before:top-[1.45rem] before:w-4 before:border-t before:border-foreground">
              <p className="flex items-baseline gap-2 text-lg font-bold">
                {r.theme} <span className="text-sm text-muted-foreground">{r.projects.length}</span>
              </p>
              <ul className="ml-1 border-l border-foreground/50">
                {r.projects.map((p) => (
                  <li key={p.slug} className="relative pl-6 pt-2 before:absolute before:left-0 before:top-[1.6rem] before:w-4 before:border-t before:border-foreground/50">
                    <Link href={`/projets/${p.slug}`} className="flex items-center gap-3">
                      <span className="relative block size-9 shrink-0 overflow-hidden rounded-full bg-muted">
                        <Image src={p.cover.src} alt="" fill sizes="36px" className="object-cover" />
                      </span>
                      <span className="font-semibold lowercase">{p.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
