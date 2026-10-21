"use client";

import { useEffect, useRef, useState } from "react";
import type { Ouvrage } from "@/data/manifeste";
import { cn } from "@/lib/utils";

// Petite bibliothèque imaginaire : les livres cités se rangent sur l'étagère un à un quand elle
// entre à l'écran. Survolé, un livre se soulève ; choisi (clic ou toucher), il sort de la rangée
// et sa référence complète s'affiche dessous. Le dernier livre penche contre le serre-livre.
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
    <div ref={ref} className="[--book-scale:0.8] [--shelf-h:158px] sm:[--book-scale:1.15] sm:[--shelf-h:228px]">
      <div className="relative flex h-[190px] items-end gap-[2px] overflow-hidden px-2 pt-8 sm:h-[260px]">
        {/* ombre douce des livres sur le mur, juste au-dessus de la tablette */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/[0.06] to-transparent" />
        {books.map((b, i) => {
          const last = i === books.length - 1;
          const lift = picked === i ? -30 : hover === i ? -12 : 0;
          const cloth = i % 2 === 0; // dos toilés à nervures, les autres imprimés
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
              className="group relative shrink-0 cursor-pointer outline-none"
              style={{
                width: `calc(${b.l}px * var(--book-scale))`,
                height: `${b.h * 100}%`,
                transformOrigin: "bottom left",
                transform: shown
                  ? `translateY(${lift}px) rotate(${last ? -8 : 0}deg)`
                  : "translateY(115%) rotate(0deg)",
                // le livre penché laisse la place à son sommet, qui vient s'appuyer sur le voisin
                marginLeft: last ? `calc(var(--shelf-h) * ${b.h} * 0.139 + 2px)` : undefined,
                transition: `transform ${shown && lift === 0 && !last ? 900 : 550}ms cubic-bezier(0.32,0.72,0,1) ${
                  shown && hover === null && picked === null ? i * 70 : 0
                }ms`,
              }}
            >
              <span
                className="absolute inset-0 flex flex-col items-center justify-between gap-2 overflow-hidden rounded-[3px_3px_1px_1px] py-3 group-focus-visible:ring-2 group-focus-visible:ring-foreground"
                style={{
                  background: b.couleur,
                  color: b.encre,
                  // ombre portée vers la droite (lumière venant de la gauche) et arête claire en haut
                  boxShadow: "2px 0 3px rgb(0 0 0 / 0.22), 1px 0 0 rgb(0 0 0 / 0.12), inset 0 1px 0 rgb(255 255 255 / 0.35)",
                }}
              >
                {cloth ? (
                  <span aria-hidden className="h-[3px] w-full bg-[linear-gradient(to_bottom,rgb(255_255_255/0.28),rgb(0_0_0/0.28))]" />
                ) : (
                  <span aria-hidden className="h-px w-3/5 opacity-40" style={{ background: b.encre }} />
                )}
                <span className="min-h-0 flex-1 rotate-180 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold leading-none tracking-tight [writing-mode:vertical-rl] sm:text-[11px]">
                  {b.titre}
                </span>
                <span className="rotate-180 text-[9px] uppercase leading-none tracking-wide opacity-75 [writing-mode:vertical-rl] sm:text-[10px]">
                  {b.auteur}
                </span>
                {cloth && (
                  <span aria-hidden className="h-[3px] w-full bg-[linear-gradient(to_bottom,rgb(255_255_255/0.28),rgb(0_0_0/0.28))]" />
                )}
                {/* dos arrondi : sombre sur les bords, reflet à gauche du milieu */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgb(0 0 0 / 0.38) 0%, rgb(0 0 0 / 0.1) 9%, rgb(255 255 255 / 0.2) 24%, rgb(255 255 255 / 0.06) 42%, transparent 58%, rgb(0 0 0 / 0.1) 82%, rgb(0 0 0 / 0.4) 100%)",
                  }}
                />
                {/* coiffe : le haut du dos accroche un peu de lumière */}
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-white/25 to-transparent" />
              </span>
              {/* ombre de contact sur la tablette */}
              <span aria-hidden className="pointer-events-none absolute -inset-x-1 -bottom-0.5 -z-10 h-2 rounded-full bg-black/35 blur-[3px]" />
            </button>
          );
        })}
        {/* serre-livre en métal */}
        <span
          aria-hidden
          className="ml-2 h-16 w-3.5 shrink-0 rounded-t-[2px] sm:h-20"
          style={{
            background: "linear-gradient(90deg, #2a2a2a, #5a5a5a 35%, #3a3a3a 60%, #1c1c1c)",
            boxShadow: "2px 0 4px rgb(0 0 0 / 0.25)",
          }}
        />
      </div>
      {/* tablette en chêne clair : face du dessus, chant, puis ombre sur le mur */}
      <div aria-hidden className="h-1.5 bg-[linear-gradient(to_bottom,#d9bf98,#c8a679)]" />
      <div aria-hidden className="h-3 bg-[linear-gradient(to_bottom,#b48c5c,#9a7347)] shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]" />
      <div aria-hidden className="mx-2 h-3 bg-gradient-to-b from-black/20 to-transparent blur-[2px]" />

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
