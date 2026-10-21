"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Met en pause les animations CSS en boucle tant qu'elles sont hors de l'écran (cellules des
// bentos LudiLove, clignotement des vignettes de l'index sur téléphone) : elles ne coûtent plus
// rien quand on ne les voit pas. CSS associé : [data-off] dans globals.css.
// (le clignotement des vignettes n'existe que sur écran tactile : inutile de les surveiller ailleurs)
const selector = () => (window.matchMedia("(hover: none)").matches ? ".llb-cell, .people-blink" : ".llb-cell");

export function OffscreenPause() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.toggleAttribute("data-off", !e.isIntersecting)),
      { rootMargin: "120px" }
    );
    const watched = new WeakSet<Element>();
    const scan = () =>
      document.querySelectorAll(selector()).forEach((el) => {
        if (watched.has(el)) return;
        watched.add(el);
        io.observe(el);
      });
    scan();
    // les vues de l'index et les bentos arrivent après coup (chargement différé)
    let pending = 0;
    const mo = new MutationObserver(() => {
      if (!pending) pending = window.setTimeout(() => ((pending = 0), scan()), 300);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(pending);
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
