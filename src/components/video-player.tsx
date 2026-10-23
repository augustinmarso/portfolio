"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { LazyVideo } from "@/components/lazy-video";
import { cn } from "@/lib/utils";

// Vidéo de démonstration cadrée sur le téléphone : lecture automatique en boucle,
// sans barre de lecture ; un clic met en pause, le bouton lecture n'apparaît qu'en pause.
export function VideoPlayer({ src, poster, label }: { src: string; poster: string; label: string }) {
  const [playing, setPlaying] = useState(true);
  const userPaused = useRef(false);

  const toggle = (e: React.MouseEvent) => {
    const v = (e.currentTarget.closest("div")?.querySelector("video") ?? null) as HTMLVideoElement | null;
    if (!v) return;
    userPaused.current = !v.paused;
    if (v.paused) void v.play();
    else v.pause();
  };

  return (
    <div className="relative">
      {/* chargée et lue seulement quand elle arrive à l'écran (3,5 Mo pour LudiLove) */}
      <LazyVideo
        src={src}
        poster={poster}
        pausedRef={userPaused}
        aria-label={label}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="mx-auto block max-h-[calc(100dvh-120px)] w-auto cursor-pointer"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label="Lecture"
        className={cn(
          "absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-background",
          playing && "hidden"
        )}
      >
        <Play className="size-6 translate-x-0.5" fill="currentColor" />
      </button>
    </div>
  );
}
