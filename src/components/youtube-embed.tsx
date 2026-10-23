"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

// Vidéo YouTube en façade : la miniature et un bouton lecture, le vrai lecteur (près d'1 Mo
// de scripts YouTube par vidéo) ne se charge qu'au clic, et démarre aussitôt.
export function YouTubeEmbed({ id, title, vertical }: { id: string; title: string; vertical: boolean }) {
  const [active, setActive] = useState(false);
  const frame = cn("w-full rounded-md bg-muted", vertical ? "aspect-[9/16]" : "aspect-video");

  if (active)
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={frame}
      />
    );

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Lire la vidéo : ${title}`}
      className={cn(frame, "group relative block overflow-hidden")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- miniature servie par YouTube */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
      <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover:scale-110">
        <Play className="size-6 translate-x-0.5" fill="currentColor" />
      </span>
    </button>
  );
}
