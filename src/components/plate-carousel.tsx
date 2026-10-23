"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { FadeImg } from "@/components/fade-img";
import { cn } from "@/lib/utils";

export type Slide = { href: string; src: string; sm?: string; width: number; height: number; alt: string };

// Carrousel des planches d'une étape : défilement horizontal aimanté (glisser au doigt ou au pavé),
// flèches et pastilles pour passer d'une planche à l'autre. Chaque planche mène à son projet.
export function PlateCarousel({ slides }: { slides: Slide[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  const go = (n: number) => {
    const el = track.current;
    if (!el) return;
    const i = (n + slides.length) % slides.length;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="w-full min-w-0 max-w-md">
      <ul
        ref={track}
        onScroll={onScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-xl bg-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <li key={s.src} className="relative aspect-[4/3] w-full shrink-0 snap-center">
            <Link href={s.href} className="block size-full">
              <FadeImg
                src={s.src}
                sm={s.sm}
                alt={s.alt}
                width={s.width}
                height={s.height}
                priority={false}
                sizes="(min-width: 1024px) 448px, 90vw"
                frameClassName="size-full border-0"
                className="size-full object-contain"
              />
              <span className="sr-only">
                planche {i + 1} sur {slides.length}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="planche précédente"
            className="grid size-9 place-items-center rounded-full border border-foreground/15 text-base transition-colors hover:bg-foreground hover:text-background"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="planche suivante"
            className="grid size-9 place-items-center rounded-full border border-foreground/15 text-base transition-colors hover:bg-foreground hover:text-background"
          >
            →
          </button>
          <div className="ml-1 flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => go(i)}
                aria-label={`planche ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/50"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
