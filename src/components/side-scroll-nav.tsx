"use client";

import { useEffect, useRef, useState } from "react";
import { scrollToElement } from "@/components/smooth-scroll";
import { cn } from "@/lib/utils";

// Sommaire fixé sur le côté : la section en cours de lecture passe en noir et un trait
// glisse jusqu'à elle. Un clic fait défiler jusqu'à la section.
export function SideScrollNav({ items }: { items: { id: string; titre: string }[] }) {
  const [active, setActive] = useState(0);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const [bar, setBar] = useState({ top: 0, height: 0 });

  useEffect(() => {
    const targets = items.map((it) => document.getElementById(it.id)).filter((el): el is HTMLElement => !!el);
    // Section active : la dernière dont le haut a passé le tiers de l'écran.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let i = 0;
      targets.forEach((t, k) => {
        if (t.getBoundingClientRect().top <= line) i = k;
      });
      setActive(i);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  useEffect(() => {
    const a = links.current[active];
    if (a) setBar({ top: a.offsetTop, height: a.offsetHeight });
  }, [active]);

  return (
    <nav aria-label="Sommaire du manifeste" className="relative pl-4">
      <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-foreground/10" />
      <span
        aria-hidden
        className="absolute left-0 w-[2px] -translate-x-[0.5px] rounded-full bg-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ top: bar.top, height: bar.height }}
      />
      <ol className="grid gap-1">
        {items.map((it, i) => (
          <li key={it.id}>
            <a
              ref={(el) => {
                links.current[i] = el;
              }}
              href={`#${it.id}`}
              onClick={(e) => {
                const el = document.getElementById(it.id);
                if (!el) return;
                e.preventDefault();
                scrollToElement(el);
              }}
              aria-current={i === active ? "true" : undefined}
              className={cn(
                "block py-1 transition-colors duration-300",
                i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {it.titre}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
