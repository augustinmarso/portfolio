"use client";

import { useEffect, useRef, type ComponentProps } from "react";

// Vidéo muette en boucle qui ne se télécharge qu'à l'approche de l'écran et se met en pause
// hors de vue. Une vidéo masquée (display: none, version téléphone ou ordinateur) n'est
// jamais chargée. `pausedRef` : le visiteur l'a arrêtée, on ne la relance pas d'office.
export function LazyVideo({
  pausedRef,
  ...props
}: Omit<ComponentProps<"video">, "autoPlay" | "preload"> & { pausedRef?: React.RefObject<boolean> }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Attendre la fin du chargement de la page : la vidéo ne dispute pas la bande passante
    // aux images et au texte du premier écran.
    let io: IntersectionObserver | undefined;
    const start = () => {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            if (!pausedRef?.current) void v.play().catch(() => {});
          } else if (!v.paused) v.pause();
        },
        { rootMargin: "200px" }
      );
      io.observe(v);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      io?.disconnect();
    };
  }, [pausedRef]);

  return <video ref={ref} muted loop playsInline preload="none" {...props} />;
}
