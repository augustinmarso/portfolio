"use client";

import { useEffect, useRef } from "react";
import data from "@/data/memoire.json";
import { asset } from "@/lib/projects";
import { cn } from "@/lib/utils";

// Le mémoire « La société de jeux » mis en page dans le site : chaque double page garde sa mise
// en page d'origine (BD, photos, flèches rouges en fond, sans le texte) et le texte est du vrai
// texte du site, en Scoutie Sans, posé ligne par ligne à sa place. Chaque ligne est ajustée à
// la largeur de l'original (Scoutie n'a pas la même chasse que Space Grotesk / Urbanist).
// Ordinateur : doubles pages ; téléphone : une page à la fois (la double page coupée en deux).

type Span = { t: string; w: number; i: boolean; c: string; s: number; sup: boolean };
type Line = { x: number; y: number; len: number; a: number; size: number; spans: Span[] };
type Page = { w: number; h: number; bg: string; lines: Line[] };
const PAGES = (data as { pages: Page[] }).pages;
const SPREAD_W = 839.05;

function Lines({ page }: { page: Page }) {
  return (
    <>
      {page.lines.map((l, n) => (
        <span
          key={n}
          data-fit={l.len}
          className="absolute origin-[0_0] whitespace-pre leading-none"
          style={{
            left: `${(l.x / page.w) * 100}%`,
            // la ligne de base du PDF : on remonte de la hauteur des capitales
            top: `${(l.y / page.h) * 100}%`,
            fontSize: `calc(var(--u) * ${l.size})`,
            transform: `translateY(-0.8em) rotate(${l.a}deg)`,
          }}
        >
          {l.spans.map((s, k) => (
            <span
              key={k}
              style={{
                fontWeight: s.w,
                fontStyle: s.i ? "italic" : undefined,
                color: s.c === "#231f20" ? undefined : s.c,
                fontSize: s.s !== l.size ? `${s.s / l.size}em` : undefined,
                verticalAlign: s.sup ? "super" : undefined,
              }}
            >
              {s.t}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

// Une double page (ou une page simple : couverture, dos). `half` : n'en montrer qu'une moitié.
function Sheet({ page, half }: { page: Page; half?: 0 | 1 }) {
  const single = page.w < 500;
  const shown = half === undefined || single ? page.w : page.w / 2;
  return (
    <div className="@container w-full overflow-hidden bg-white" style={{ aspectRatio: `${shown} / ${page.h}` }}>
      <div
        className="relative h-full [--u:calc(100cqw/var(--pw))]"
        style={{
          width: `${(page.w / shown) * 100}%`,
          marginLeft: half === 1 && !single ? "-100%" : undefined,
          ["--pw" as string]: shown,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- fond fixe, chargé au fil de la lecture */}
        <img src={asset(`/memoire/${page.bg}.webp`)} alt="" loading="lazy" className="absolute inset-0 size-full" />
        <Lines page={page} />
      </div>
    </div>
  );
}

// `pages` : la couverture seule (colonne du haut de page) ou tout le reste (pleine largeur).
export function MemoireBook({ pages = "all" }: { pages?: "all" | "cover" | "rest" }) {
  const shown = pages === "cover" ? PAGES.slice(0, 1) : pages === "rest" ? PAGES.slice(1) : PAGES;
  const ref = useRef<HTMLDivElement>(null);

  // ajuste chaque ligne à la largeur de l'original (compression ou étirement léger)
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const fit = () => {
      root.querySelectorAll<HTMLElement>("[data-fit]").forEach((el) => {
        if (!el.offsetParent) return; // version cachée (téléphone / ordinateur)
        const sheet = el.parentElement!;
        const pw = parseFloat(getComputedStyle(sheet).getPropertyValue("--pw")) || SPREAD_W;
        const target = (parseFloat(el.dataset.fit!) / pw) * sheet.parentElement!.clientWidth;
        const base = el.style.transform.replace(/ scaleX\([^)]*\)/, "");
        el.style.transform = base;
        const actual = el.scrollWidth;
        if (actual > 0) el.style.transform = `${base} scaleX(${Math.min(1.15, Math.max(0.7, target / actual))})`;
      });
    };
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid gap-6">
      {shown.map((page) => (
        <figure key={page.bg} aria-label={`Mémoire, ${page.w < 500 ? "page" : "double page"} ${PAGES.indexOf(page) + 1}`}>
          {/* ordinateur : la double page entière */}
          <div className={cn("hidden md:block", page.w < 500 && (pages === "cover" ? "md:max-w-xl" : "md:mx-auto md:w-1/2"))}>
            <Sheet page={page} />
          </div>
          {/* téléphone : page par page */}
          <div className="grid gap-6 md:hidden">
            <Sheet page={page} half={0} />
            {page.w >= 500 && <Sheet page={page} half={1} />}
          </div>
        </figure>
      ))}
    </div>
  );
}
