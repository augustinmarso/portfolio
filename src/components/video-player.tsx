"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (t: number) => {
  if (!Number.isFinite(t)) return "0:00";
  const s = Math.floor(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Lecteur vidéo sur mesure (dans l'esprit de skiper91) : barre qui s'étire au survol,
// défilement au glisser, temps affiché sous le curseur, bouton lecture à ressort.
export function VideoPlayer({ src, poster, label }: { src: string; poster: string; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hover, setHover] = useState<number | null>(null); // position 0–1 sous le curseur
  const [scrubbing, setScrubbing] = useState(false);

  // Les métadonnées peuvent être chargées avant l'hydratation : on relit la durée au montage.
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 1) setDuration(v.duration);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const ratioAt = (clientX: number) => {
    const r = barRef.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const seek = (clientX: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = ratioAt(clientX) * duration;
    setTime(v.currentTime);
  };

  useEffect(() => {
    if (!scrubbing) return;
    const move = (e: PointerEvent) => {
      seek(e.clientX);
      setHover(ratioAt(e.clientX));
    };
    const up = () => setScrubbing(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  });

  const progress = duration ? time / duration : 0;

  return (
    <div ref={wrapRef} className="group/player relative overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => !scrubbing && setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        className="mx-auto block max-h-[80vh] w-auto cursor-pointer"
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Lecture"}
        className={cn(
          "absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-background",
          "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          playing ? "scale-50 opacity-0 group-hover/player:scale-100 group-hover/player:opacity-100" : "scale-100"
        )}
      >
        {playing ? <Pause className="size-6" fill="currentColor" /> : <Play className="size-6 translate-x-0.5" fill="currentColor" />}
      </button>

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/50 to-transparent px-4 pb-3 pt-8 text-sm font-semibold text-white">
        <span className="tabular-nums">{fmt(time)}</span>
        <div
          ref={barRef}
          role="slider"
          aria-label="Position dans la vidéo"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          tabIndex={0}
          onKeyDown={(e) => {
            const v = videoRef.current;
            if (!v) return;
            if (e.key === "ArrowRight") v.currentTime = Math.min(duration, v.currentTime + 2);
            if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 2);
          }}
          onPointerDown={(e) => {
            setScrubbing(true);
            seek(e.clientX);
          }}
          onPointerMove={(e) => setHover(ratioAt(e.clientX))}
          onPointerLeave={() => !scrubbing && setHover(null)}
          className="group/bar relative flex h-5 flex-1 cursor-pointer touch-none items-center"
        >
          <div
            className={cn(
              "relative h-1 w-full overflow-hidden rounded-full bg-white/35 transition-[height] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/bar:h-2.5",
              scrubbing && "h-2.5"
            )}
          >
            {hover !== null && <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${hover * 100}%` }} />}
            <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${progress * 100}%` }} />
          </div>
          {hover !== null && (
            <span
              className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded bg-white px-1.5 py-0.5 text-xs tabular-nums text-black"
              style={{ left: `${hover * 100}%` }}
            >
              {fmt(hover * duration)}
            </span>
          )}
        </div>
        <span className="tabular-nums text-white/70">{fmt(duration)}</span>
        <button
          type="button"
          aria-label="Plein écran"
          onClick={() => void wrapRef.current?.requestFullscreen?.()}
          className="opacity-80 hover:opacity-100"
        >
          <Maximize className="size-4" />
        </button>
      </div>
    </div>
  );
}
