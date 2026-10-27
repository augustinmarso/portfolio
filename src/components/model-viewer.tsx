"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// <model-viewer> (Google) : élément web, typé ici pour le JSX.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}

// Modèle 3D tournable à la souris ou au doigt. La bibliothèque (three.js compris) et le .glb ne se
// téléchargent qu'à l'approche de l'écran, une fois la page chargée ; d'ici là, l'image d'attente.
// Pas de zoom (la molette fait défiler la page) ; au doigt, un glissé vertical fait défiler, un
// glissé horizontal fait tourner l'objet.
export function ModelViewer({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false); // bibliothèque chargée : l'élément peut s'afficher
  const [loaded, setLoaded] = useState(false); // modèle affiché : l'image d'attente s'efface

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let io: IntersectionObserver | undefined;
    let cancelled = false;
    const start = () => {
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io?.disconnect();
          void import("@google/model-viewer").then(() => !cancelled && setReady(true));
        },
        { rootMargin: "400px" }
      );
      io.observe(el);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      io?.disconnect();
    };
  }, []);

  const viewer = useRef<HTMLElement>(null);
  useEffect(() => {
    const v = viewer.current;
    if (!v) return;
    const onLoad = () => setLoaded(true);
    v.addEventListener("load", onLoad);
    return () => v.removeEventListener("load", onLoad);
  }, [ready]);

  return (
    <div ref={ref} className="relative aspect-[4/3] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        aria-hidden
        className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", loaded && "opacity-0")}
      />
      {ready && (
        <model-viewer
          ref={viewer}
          src={src}
          alt={label}
          camera-controls=""
          disable-zoom=""
          disable-pan=""
          touch-action="pan-y"
          interaction-prompt="none"
          auto-rotate=""
          auto-rotate-delay="0"
          rotation-per-second="14deg"
          camera-orbit="30deg 72deg auto"
          environment-image="neutral"
          exposure="1.05"
          shadow-intensity="0.8"
          shadow-softness="1"
          loading="eager"
          class={cn("absolute inset-0 h-full w-full transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0")}
          style={{ "--poster-color": "transparent" } as React.CSSProperties}
        />
      )}
    </div>
  );
}
