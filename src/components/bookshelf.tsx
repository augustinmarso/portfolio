"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Ouvrage } from "@/data/manifeste";
import { cn } from "@/lib/utils";

// Petite bibliothèque imaginaire, vue de trois quarts, dessinée au trait et en aplats : chaque
// livre est un volume CSS 3D (dos, plats de couverture, tranche des pages) cerné d'un trait noir. Les livres se dressent un à un quand l'étagère
// entre à l'écran. Survolé, un livre se soulève ; choisi (clic ou toucher), il sort de la rangée
// et sa référence complète s'affiche dessous. Le dernier livre penche sur son voisin.
// Les dimensions suivent --s (échelle : réduite sur téléphone).

const SHELF_H = 228; // hauteur utile de l'étagère, en px à l'échelle 1
const DEPTH = 150; // profondeur des livres
const px = (n: number) => `calc(${n}px * var(--s))`;
const INK = "#1e1e1e"; // trait
const LINE = `1.5px solid ${INK}`;
const PAGES = `repeating-linear-gradient(90deg, transparent 0 5px, ${INK} 5px 6px), #f6f1e6`; // tranche : quelques traits sur un aplat crème
const shade = (c: string, k: number) => `color-mix(in srgb, ${c} ${k}%, ${INK})`;

// Volume : face avant (le dos du livre) puis les faces qui partent vers le fond.
function Box({
  w,
  h,
  d,
  front,
  side,
  top,
  children,
  frontStyle,
}: {
  w: string;
  h: string;
  d: string;
  front: string;
  side: string;
  top: string;
  children?: ReactNode;
  frontStyle?: CSSProperties;
}) {
  const face = "absolute";
  const line = { border: LINE };
  return (
    <>
      {/* plat gauche, côté lumière */}
      <span aria-hidden className={face} style={{ left: 0, top: 0, width: d, height: h, background: side, ...line, transformOrigin: "left", transform: "rotateY(90deg)" }} />
      {/* plat droit, dans l'ombre */}
      <span aria-hidden className={face} style={{ left: w, top: 0, width: d, height: h, background: side, ...line, filter: "brightness(0.8)", transformOrigin: "left", transform: "rotateY(90deg)" }} />
      {/* tranche du haut */}
      <span aria-hidden className={face} style={{ left: 0, top: 0, width: w, height: d, background: top, ...line, transformOrigin: "top", transform: "rotateX(-90deg)" }} />
      <span className="absolute inset-0" style={{ background: front, ...line, ...frontStyle }}>
        {children}
      </span>
    </>
  );
}

export function Bookshelf({ books }: { books: Ouvrage[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const current = hover ?? picked;
  const book = current !== null ? books[current] : null;

  return (
    <div ref={ref} className="[--s:0.62] sm:[--s:1]">
      <div className="flex justify-center py-6 [perspective:1500px] sm:py-10" style={{ height: px(SHELF_H + 150) }}>
        <div
          className="relative flex items-end gap-[2px] self-end [transform-style:preserve-3d]"
          style={{ transform: "rotateX(-14deg) rotateY(28deg)", paddingInline: px(14) }}
        >
          {books.map((b, i) => {
            const last = i === books.length - 1;
            const w = px(b.l * 1.15);
            const h = px(b.h * SHELF_H);
            const lift = picked === i ? `translate3d(0, ${px(-14)}, ${px(70)})` : hover === i ? `translateY(${px(-12)})` : "";
            const cloth = i % 2 === 0; // dos toilés à nervures, les autres imprimés
            const ridge = "h-[1.5px] w-full";
            return (
              <button
                key={b.titre}
                type="button"
                aria-label={`${b.titre}, ${b.detail}`}
                aria-pressed={picked === i}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => setPicked(picked === i ? null : i)}
                className="group relative shrink-0 cursor-pointer outline-none [transform-style:preserve-3d]"
                style={{
                  width: w,
                  height: h,
                  transformOrigin: "bottom left",
                  transform: shown ? `${lift} rotate(${last ? -8 : 0}deg)` : "scale3d(1, 0.001, 1)",
                  // le livre penché laisse la place à son sommet, qui s'appuie sur le voisin
                  marginLeft: last ? `calc(${b.h * SHELF_H * 0.139 + 2}px * var(--s))` : undefined,
                  transition: `transform ${shown && !lift && !last ? 900 : 550}ms cubic-bezier(0.32,0.72,0,1) ${
                    shown && hover === null && picked === null ? i * 70 : 0
                  }ms`,
                }}
              >
                <Box
                  w={w}
                  h={h}
                  d={px(DEPTH)}
                  front={b.couleur}
                  side={shade(b.couleur, 82)}
                  top={PAGES}
                  frontStyle={{ color: b.encre }}
                >
                  <span className="absolute inset-0 flex flex-col items-center justify-between gap-2 overflow-hidden py-3 group-focus-visible:ring-2 group-focus-visible:ring-foreground">
                    {cloth ? <span aria-hidden className={ridge} style={{ background: b.encre }} /> : <span aria-hidden className="h-px w-3/5 opacity-40" style={{ background: b.encre }} />}
                    <span className="min-h-0 flex-1 rotate-180 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold leading-none tracking-tight [writing-mode:vertical-rl] sm:text-[11px]">
                      {b.titre}
                    </span>
                    <span className="rotate-180 text-[9px] uppercase leading-none tracking-wide opacity-75 [writing-mode:vertical-rl] sm:text-[10px]">
                      {b.auteur}
                    </span>
                    {cloth && <span aria-hidden className={ridge} style={{ background: b.encre }} />}
                  </span>
                </Box>
              </button>
            );
          })}

          {/* serre-livre en métal */}
          <span aria-hidden className="relative ml-3 shrink-0 [transform-style:preserve-3d]" style={{ width: px(14), height: px(80) }}>
            <Box w={px(14)} h={px(80)} d={px(DEPTH * 0.8)} front="#3a3a3a" side="#2a2a2a" top="#555" />
          </span>

          {/* tablette en chêne clair, en aplats : chant devant, dessus qui part vers le mur */}
          <span aria-hidden className="absolute inset-x-0 top-full [transform-style:preserve-3d]" style={{ height: px(16) }}>
            <span className="absolute inset-0" style={{ background: "#b48c5c", border: LINE }} />
            <span
              className="absolute inset-x-0 top-0"
              style={{
                height: px(DEPTH + 30),
                background: "#d6bb93",
                border: LINE,
                transformOrigin: "top",
                transform: "rotateX(-90deg)",
              }}
            />
          </span>
        </div>
      </div>

      <p className="mt-6 min-h-[3.5em] max-w-[62ch] text-base font-normal leading-relaxed sm:text-lg" aria-live="polite">
        {book ? (
          <>
            <span className="font-semibold">{book.titre}</span>
            <span className="text-muted-foreground"> — {book.detail}</span>
          </>
        ) : (
          <span className={cn("text-muted-foreground transition-opacity duration-500", shown ? "opacity-100" : "opacity-0")}>
            survoler ou toucher un livre pour lire sa référence.
          </span>
        )}
      </p>
    </div>
  );
}
