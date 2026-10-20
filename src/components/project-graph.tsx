"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowLeftRight, LayoutList, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES, type Project } from "@/lib/projects";

type Focus = { kind: "root" } | { kind: "theme"; theme: string };
type Pos = { x: number; y: number; o: number; s: number };

const DURATION = 750;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// Symbole géométrique propre à chaque thème (comme les puces de la référence).
function ThemeGlyph({ theme, count, active }: { theme: string; count: number; active: boolean }) {
  const i = THEMES.indexOf(theme as (typeof THEMES)[number]);
  const stroke = active ? "currentColor" : "currentColor";
  const common = { fill: active ? "var(--background)" : "none", stroke, strokeWidth: 1.4 };
  const shapes = [
    <circle key="c" cx="14" cy="14" r="10" {...common} />,
    <rect key="s" x="4" y="4" width="20" height="20" {...common} />,
    <path key="t" d="M14 3 L25 24 H3 Z" {...common} />,
    <path key="h" d="M14 3 L24 8.5 V19.5 L14 25 L4 19.5 V8.5 Z" {...common} />,
    <path key="d" d="M14 3 L25 14 L14 25 L3 14 Z" {...common} />,
  ];
  const withDot = i >= 5;
  return (
    <svg viewBox="0 0 28 28" className="size-7 overflow-visible">
      {shapes[i % shapes.length]}
      {withDot ? (
        <circle cx="14" cy="15" r="2" fill="currentColor" />
      ) : (
        <text x="14" y="18.5" textAnchor="middle" className="fill-current text-[9px] font-semibold">
          {count}
        </text>
      )}
    </svg>
  );
}

function Asterisk() {
  return (
    <svg viewBox="0 0 28 28" className="size-7">
      {[0, 30, 60, 90, 120, 150].map((a) => (
        <rect key={a} x="12.5" y="3" width="3" height="22" rx="1.5" fill="currentColor" transform={`rotate(${a} 14 14)`} />
      ))}
    </svg>
  );
}

export function ProjectGraph({ projects }: { projects: Project[] }) {
  const params = useSearchParams();
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 640 });
  const initialTheme = params.get("theme");
  const [focus, setFocus] = useState<Focus>(initialTheme ? { kind: "theme", theme: initialTheme } : { kind: "root" });
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const themes = useMemo(() => THEMES.filter((t) => projects.some((p) => p.text?.themes.includes(t))), [projects]);
  const projectsOf = (t: string) => projects.filter((p) => p.text?.themes.includes(t));

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Disposition cible selon le nœud au centre.
  const target = useMemo(() => {
    const out = new Map<string, Pos>();
    const cx = size.w / 2;
    const cy = size.h / 2;
    const R = Math.min(size.w, size.h) * 0.36;
    const ring = (n: number, k: number, r: number, offset = -Math.PI / 2) => {
      const a = offset + (k / n) * Math.PI * 2;
      const wobble = k % 2 ? 0.86 : 1; // rayons alternés, plus organique
      return { x: cx + Math.cos(a) * r * wobble, y: cy + Math.sin(a) * r * wobble };
    };
    if (focus.kind === "root") {
      out.set("root", { x: cx, y: cy, o: 1, s: 1 });
      themes.forEach((t, k) => out.set(`t:${t}`, { ...ring(themes.length, k, R), o: 1, s: 1 }));
      projects.forEach((p) => {
        const home = out.get(`t:${p.text?.themes[0]}`) ?? { x: cx, y: cy };
        out.set(`p:${p.slug}`, { x: home.x, y: home.y, o: 0, s: 0.3 });
      });
    } else {
      const inside = projectsOf(focus.theme);
      out.set(`t:${focus.theme}`, { x: cx, y: cy, o: 1, s: 1 });
      const others = themes.filter((t) => t !== focus.theme);
      others.forEach((t, k) => out.set(`t:${t}`, { ...ring(others.length, k, R * 1.22, -Math.PI / 2 + 0.3), o: 0.35, s: 0.8 }));
      out.set("root", { x: cx - R * 0.62, y: cy + R * 0.98, o: 1, s: 1 });
      inside.forEach((p, k) => out.set(`p:${p.slug}`, { ...ring(inside.length, k, R * 0.82, -Math.PI / 2 + 0.4), o: 1, s: 1 }));
      projects.forEach((p) => {
        if (!out.has(`p:${p.slug}`)) out.set(`p:${p.slug}`, { x: cx, y: cy, o: 0, s: 0.3 });
      });
    }
    // Garde tout dans le cadre (marge pour les étiquettes).
    out.forEach((v) => {
      v.x = Math.min(size.w - 70, Math.max(70, v.x));
      v.y = Math.min(size.h - 50, Math.max(30, v.y));
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, size, themes, projects]);

  // Interpolation fluide de l'ancienne disposition vers la nouvelle.
  const current = useRef<Map<string, Pos>>(new Map());
  const [frame, setFrame] = useState<Map<string, Pos>>(target);
  useEffect(() => {
    const from = new Map(current.current.size ? current.current : target);
    const start = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const step = (now: number) => {
      const t = reduce ? 1 : easeOut(Math.min(1, (now - start) / DURATION));
      const next = new Map<string, Pos>();
      target.forEach((to, id) => {
        const a = from.get(id) ?? to;
        next.set(id, {
          x: a.x + (to.x - a.x) * t,
          y: a.y + (to.y - a.y) * t,
          o: a.o + (to.o - a.o) * t,
          s: a.s + (to.s - a.s) * t,
        });
      });
      current.current = next;
      setFrame(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const at = (id: string) => frame.get(id) ?? { x: 0, y: 0, o: 0, s: 0 };

  // Liens : centre → thèmes (pointillés), thème → projets (tirets), thème → racine (trait plein).
  const edges: { a: string; b: string; kind: "dot" | "dash" | "solid" }[] = [];
  if (focus.kind === "root") themes.forEach((t) => edges.push({ a: "root", b: `t:${t}`, kind: "dot" }));
  else {
    edges.push({ a: `t:${focus.theme}`, b: "root", kind: "solid" });
    themes.filter((t) => t !== focus.theme).forEach((t) => edges.push({ a: `t:${focus.theme}`, b: `t:${t}`, kind: "dot" }));
    projectsOf(focus.theme).forEach((p) => edges.push({ a: `t:${focus.theme}`, b: `p:${p.slug}`, kind: "dash" }));
  }

  const goTheme = (t: string) => {
    setSelected(null);
    setFocus({ kind: "theme", theme: t });
  };
  const goRoot = () => {
    setSelected(null);
    setFocus({ kind: "root" });
  };

  const sel = selected ? projects.find((p) => p.slug === selected) : null;

  return (
    <div className="relative grid gap-6 lg:block">
      <div ref={boxRef} className="relative h-[68vh] overflow-hidden lg:h-[calc(100dvh-9rem)] lg:w-[60%]">
        <svg className="pointer-events-none absolute inset-0 size-full">
          {edges.map((e) => {
            const a = at(e.a);
            const b = at(e.b);
            const lit = hover && (hover === e.a || hover === e.b);
            return (
              <line
                key={`${e.a}-${e.b}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="currentColor"
                strokeWidth={e.kind === "solid" ? 1.2 : 1.3}
                strokeDasharray={e.kind === "dot" ? "1.5 6" : e.kind === "dash" ? "5 4" : undefined}
                strokeLinecap="round"
                opacity={Math.min(a.o, b.o) * (lit ? 0.9 : 0.5)}
              />
            );
          })}
        </svg>

        {/* Racine */}
        <button
          type="button"
          onClick={goRoot}
          onMouseEnter={() => setHover("root")}
          onMouseLeave={() => setHover(null)}
          className="absolute flex flex-col items-center text-center"
          style={{ left: at("root").x, top: at("root").y, opacity: at("root").o, transform: "translate(-50%,-14px)" }}
        >
          <Asterisk />
          <span className="mt-1 whitespace-nowrap text-base font-semibold">augustin marsollier</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">designer produit</span>
        </button>

        {/* Thèmes */}
        {themes.map((t) => {
          const p = at(`t:${t}`);
          const active = focus.kind === "theme" && focus.theme === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => goTheme(t)}
              onMouseEnter={() => setHover(`t:${t}`)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                "absolute flex flex-col items-center text-center transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              style={{ left: p.x, top: p.y, opacity: Math.max(p.o, 0.15), transform: `translate(-50%,-14px) scale(${p.s})`, transformOrigin: "50% 14px" }}
            >
              <ThemeGlyph theme={t} count={projectsOf(t).length} active={active} />
              <span className={cn("mt-1 whitespace-nowrap text-base", active ? "font-bold" : "font-semibold")}>{t}</span>
            </button>
          );
        })}

        {/* Projets : la puce est une image */}
        {projects.map((proj) => {
          const p = at(`p:${proj.slug}`);
          if (p.o < 0.02) return null;
          const isSel = selected === proj.slug;
          return (
            <button
              key={proj.slug}
              type="button"
              onClick={() => setSelected(proj.slug)}
              onMouseEnter={() => setHover(`p:${proj.slug}`)}
              onMouseLeave={() => setHover(null)}
              className="group absolute flex flex-col items-center text-center"
              style={{ left: p.x, top: p.y, opacity: p.o, transform: `translate(-50%,-24px) scale(${p.s})`, transformOrigin: "50% 24px" }}
            >
              <span
                className={cn(
                  "relative block size-12 overflow-hidden rounded-full bg-muted ring-1 ring-foreground/20 transition-[box-shadow,transform] duration-300 group-hover:scale-110",
                  isSel && "ring-2 ring-foreground"
                )}
              >
                <Image src={proj.cover.src} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className={cn("mt-1.5 max-w-[10rem] text-sm leading-tight lowercase", isSel ? "font-bold" : "font-semibold text-muted-foreground group-hover:text-foreground")}>
                {proj.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fiche, façon référence : carte + images flottantes */}
      <aside className="relative lg:absolute lg:right-0 lg:top-0 lg:w-[38%]">
        {sel && (
          <div className="relative mb-4 hidden aspect-[4/5] w-1/2 overflow-hidden bg-muted lg:block">
            <Image src={sel.cover.src} alt="" fill sizes="20vw" className="object-cover" />
            <Link
              href={`/projets/${sel.slug}`}
              className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-sm bg-background/90 px-2 py-1 text-xs font-semibold"
            >
              voir <ArrowUpRight className="size-3" />
            </Link>
          </div>
        )}

        <div className={cn("relative z-10 grid gap-2 text-sm", sel && "lg:-mt-40 lg:ml-[18%]")}>
          <div className="flex items-center justify-between rounded-md bg-background px-4 py-3 shadow-sm ring-1 ring-foreground/10">
            <span className="flex items-center gap-2 font-semibold uppercase tracking-wider">
              <Asterisk />
              index
            </span>
            <button type="button" onClick={goRoot} aria-label="Revenir au centre">
              <ArrowLeft className="size-4" />
            </button>
          </div>

          <div className="rounded-md bg-background px-4 py-4 shadow-sm ring-1 ring-foreground/10">
            {sel ? (
              <>
                <div className="flex items-center justify-between font-semibold uppercase tracking-wider">
                  <span>▲ projet</span>
                  <button type="button" onClick={() => setSelected(null)} aria-label="Fermer la fiche">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-4 pl-5">
                  <p className="text-lg font-semibold lowercase leading-tight">{sel.title}</p>
                  {sel.text?.context && <p className="mt-1 text-muted-foreground">{sel.text.context}</p>}
                  {sel.text?.year && <p className="mt-1 uppercase tracking-wider text-muted-foreground">{sel.text.year}</p>}
                  {sel.text?.intro && <p className="mt-4 text-base leading-relaxed indent-6">{sel.text.intro}</p>}
                </div>
                <div className="mt-5 divide-y divide-dashed divide-foreground/30 border-t border-dashed border-foreground/30 font-semibold uppercase tracking-wider">
                  <p className="flex items-center gap-2 py-2.5">
                    <LayoutList className="size-4" /> planches <span className="ml-auto">{sel.images.length}</span>
                  </p>
                  <Link href={`/projets/${sel.slug}`} className="flex items-center gap-2 py-2.5 hover:underline">
                    <ArrowUpRight className="size-4" /> ouvrir le projet
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <ArrowLeftRight className="size-4" /> connexions
                    {sel.text?.themes.map((t) => (
                      <button key={t} type="button" onClick={() => goTheme(t)} className="normal-case tracking-normal text-muted-foreground hover:text-foreground">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : focus.kind === "theme" ? (
              <>
                <div className="flex items-center justify-between font-semibold uppercase tracking-wider">
                  <span>● thème</span>
                  <button type="button" onClick={goRoot} aria-label="Fermer">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-4 pl-5">
                  <p className="text-lg font-semibold">{focus.theme}</p>
                  <p className="mt-1 uppercase tracking-wider text-muted-foreground">{projectsOf(focus.theme).length} projets</p>
                </div>
                <ul className="mt-4 divide-y divide-dashed divide-foreground/30 border-t border-dashed border-foreground/30">
                  {projectsOf(focus.theme).map((p) => (
                    <li key={p.slug}>
                      <button type="button" onClick={() => setSelected(p.slug)} className="w-full py-2 text-left font-semibold lowercase hover:underline">
                        {p.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="font-semibold uppercase tracking-wider">● portfolio</p>
                <div className="mt-4 pl-5">
                  <p className="text-lg font-semibold">augustin marsollier</p>
                  <p className="mt-1 text-muted-foreground">designer produit, dsaa design produit — ensaama, paris</p>
                  <p className="mt-4 text-base leading-relaxed indent-6">
                    {projects.length} projets classés par thèmes. Choisir un thème pour l&apos;amener au centre, puis un projet pour lire sa fiche.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {sel?.images[1] && (
          <div className="relative -mt-10 ml-auto hidden aspect-square w-[45%] overflow-hidden bg-black lg:block">
            <Image src={sel.images[1].src} alt="" fill sizes="18vw" className="object-cover" />
          </div>
        )}
      </aside>
    </div>
  );
}
