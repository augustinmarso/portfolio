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
    <div ref={ref} className="[--book-scale:0.8] sm:[--book-scale:1.15]">
      <div className="relative flex h-[190px] items-end gap-[3px] overflow-hidden px-2 pt-8 sm:h-[260px]">
        {books.map((b, i) => {
          const last = i === books.length - 1;
          const lift = picked === i ? -30 : hover === i ? -12 : 0;
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
                transformOrigin: last ? "bottom left" : "bottom center",
                transform: shown
                  ? `translateY(${lift}px) rotate(${last ? -9 : 0}deg)`
                  : "translateY(115%) rotate(0deg)",
                marginLeft: last ? 6 : undefined,
                transition: `transform ${shown && lift === 0 && !last ? 900 : 550}ms cubic-bezier(0.32,0.72,0,1) ${
                  shown && hover === null && picked === null ? i * 70 : 0
                }ms`,
              }}
            >
              <span
                className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[2px] py-3 group-focus-visible:ring-2 group-focus-visible:ring-foreground"
                style={{
                  background: b.couleur,
                  color: b.encre,
                  // ombre des bords du dos, pour donner un peu de volume
                  boxShadow: "inset 3px 0 4px -2px rgb(0 0 0 / 0.25), inset -3px 0 4px -2px rgb(0 0 0 / 0.2), 0 0 0 1px rgb(0 0 0 / 0.06)",
                }}
              >
                <span aria-hidden className="h-px w-3/5 opacity-40" style={{ background: b.encre }} />
                <span className="min-h-0 flex-1 rotate-180 overflow-hidden text-ellipsis whitespace-nowrap py-2 text-[10px] font-semibold leading-none tracking-tight [writing-mode:vertical-rl] sm:text-[11px]">
                  {b.titre}
                </span>
                <span className="rotate-180 text-[9px] uppercase leading-none tracking-wide opacity-75 [writing-mode:vertical-rl] sm:text-[10px]">
                  {b.auteur}
                </span>
              </span>
            </button>
          );
        })}
        {/* serre-livre */}
        <span aria-hidden className="ml-4 h-16 w-4 shrink-0 rounded-t-[2px] bg-foreground/80 sm:h-20" />
      </div>
      {/* tablette */}
      <div aria-hidden className="h-2 rounded-[1px] bg-foreground/85" />
      <div aria-hidden className="mx-3 h-1.5 bg-foreground/15" />

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
