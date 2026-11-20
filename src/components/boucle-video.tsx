"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { LazyVideo } from "@/components/lazy-video";
import type { ProjectVideo } from "@/lib/projects";

// Vidéo 3D en boucle. Elle démarre muette (les navigateurs bloquent le son automatique) ;
// si elle a une bande son, un bouton permet de l'activer.
export function BoucleVideo({ video, label }: { video: ProjectVideo; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);

  const toggle = () => {
    const v = ref.current?.querySelector("video");
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) void v.play().catch(() => {});
  };

  return (
    <div ref={ref} className="relative mx-auto w-fit max-w-full">
      <LazyVideo src={video.src} poster={video.poster} aria-label={label} className="block h-auto max-h-[calc(100dvh-120px)] w-auto max-w-full" />
      {video.son && (
        <button
          type="button"
          onClick={toggle}
          aria-label={muted ? "Activer le son" : "Couper le son"}
          aria-pressed={!muted}
          className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-foreground/80 text-background hover:bg-foreground"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      )}
    </div>
  );
}
