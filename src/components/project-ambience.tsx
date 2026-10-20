"use client";

import { useEffect, useRef, useState } from "react";
import { SOUND_EVENT, VOLUME_EVENT, audioContext, getVolume, setSoundOn, setVolume, soundOn } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const LEVEL = 0.22; // très doux
const FADE = 2.2; // secondes

// Ambiance sonore d'un projet : enregistrement réel (CC0 / domaine public) en boucle sans couture,
// à faible volume, qui apparaît et disparaît en fondu. Respecte le bouton « son » du site.
export function ProjectAmbience({ src, title }: { src: string; title: string }) {
  const nodes = useRef<{ ctx: AudioContext; source: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const [state, setState] = useState<"off" | "loading" | "on" | "blocked">("off");

  const stop = () => {
    const n = nodes.current;
    nodes.current = null;
    if (!n) return;
    const t = n.ctx.currentTime; // contexte gardé : il reste utilisable même son coupé
    n.gain.gain.cancelScheduledValues(t);
    n.gain.gain.setValueAtTime(n.gain.gain.value, t);
    n.gain.gain.linearRampToValueAtTime(0, t + 1.2);
    n.source.stop(t + 1.3);
  };

  const start = async () => {
    const ctx = audioContext();
    if (!ctx) return setState("off");
    setState("loading");
    try {
      if (ctx.state === "suspended") await ctx.resume();
      if (ctx.state !== "running") return setState("blocked"); // lecture automatique refusée : un clic suffira
      const buf = await ctx.decodeAudioData(await (await fetch(src)).arrayBuffer());
      if (nodes.current) return;
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(LEVEL * getVolume(), ctx.currentTime + FADE);
      source.connect(gain).connect(ctx.destination);
      source.start();
      nodes.current = { ctx, source, gain };
      setState("on");
    } catch {
      setState("off");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- démarrage à l'ouverture de la page
    if (soundOn()) void start();
    const sync = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) void start();
      else {
        stop();
        setState("off");
      }
    };
    // le réglage de volume agit en direct sur l'ambiance
    const vol = (e: Event) => {
      const n = nodes.current;
      if (n) n.gain.gain.setTargetAtTime(LEVEL * (e as CustomEvent<number>).detail, n.ctx.currentTime, 0.08);
    };
    window.addEventListener(SOUND_EVENT, sync);
    window.addEventListener(VOLUME_EVENT, vol);
    return () => {
      window.removeEventListener(SOUND_EVENT, sync);
      window.removeEventListener(VOLUME_EVENT, vol);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const on = state === "on" || state === "loading";
  const toggle = () => {
    if (on) {
      stop();
      setState("off");
    } else {
      if (!soundOn()) setSoundOn(true);
      if (getVolume() < 0.05) setVolume(0.5);
      void start();
    }
  };

  return (
    <div className={cn("mt-6 flex items-baseline gap-2.5 text-[15px] font-semibold", on ? "text-foreground" : "text-muted-foreground")}>
      <AmbienceBars on={on} onSilence={() => { stop(); setState("off"); }} onWake={() => { if (!on) void start(); }} />
      <button type="button" onClick={toggle} aria-pressed={on} className="lowercase hover:text-foreground">
        ambiance · {title}
        {state === "blocked" && <span className="ml-1 font-normal text-muted-foreground">(cliquer pour écouter)</span>}
      </button>
    </div>
  );
}

// Barres d'égaliseur qui ondulent tant que l'ambiance joue ; leur hauteur suit le volume.
// Maintenues et tirées vers le bas : le volume baisse jusqu'à zéro (l'ambiance s'arrête) ;
// vers le haut : il remonte. Les barres suivent la souris en direct.
const BARS = 5;
const H = 14; // hauteur maximale des barres, en px
function AmbienceBars({ on, onSilence, onWake }: { on: boolean; onSilence: () => void; onWake: () => void }) {
  const [vol, setVol] = useState(0.7);
  const [drag, setDrag] = useState<{ y: number; start: number } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- préférence lue après l'hydratation
    setVol(soundOn() ? getVolume() : 0);
    const sync = (e: Event) => setVol((e as CustomEvent<number>).detail);
    const syncOn = (e: Event) => setVol((e as CustomEvent<boolean>).detail ? getVolume() : 0);
    window.addEventListener(VOLUME_EVENT, sync);
    window.addEventListener(SOUND_EVENT, syncOn);
    return () => {
      window.removeEventListener(VOLUME_EVENT, sync);
      window.removeEventListener(SOUND_EVENT, syncOn);
    };
  }, []);

  const level = on ? vol : 0;
  const dragging = drag !== null;

  return (
    <span
      role="slider"
      tabIndex={0}
      aria-label="Volume de l'ambiance : tirer vers le bas pour baisser, vers le haut pour monter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(level * 100)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({ y: e.clientY, start: level });
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        const v = Math.min(1, Math.max(0, drag.start + (drag.y - e.clientY) / 60)); // 60 px = tout le réglage
        setVol(v);
        setVolume(v);
        if (v === 0) onSilence();
        else {
          if (!soundOn()) setSoundOn(true);
          onWake();
        }
      }}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") setVolume(vol + 0.1);
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") setVolume(vol - 0.1);
      }}
      title="glisser vers le bas pour baisser"
      className="group/vol flex touch-none select-none items-end gap-[2px] outline-none"
      style={{ height: H }}
    >
      {Array.from({ length: BARS }, (_, i) => {
        // profil d'égaliseur : barres du milieu plus hautes
        const shape = [0.55, 0.85, 1, 0.75, 0.6][i];
        const h = Math.max(2, H * shape * level);
        return (
          <span key={i} className="relative h-full w-[3px]">
            {/* trace du niveau maximal : montre qu'on peut descendre (ou remonter) les barres */}
            <span
              className="absolute inset-x-0 bottom-0 rounded-full bg-current opacity-15 transition-opacity duration-300 group-hover/vol:opacity-30"
              style={{ height: H * shape }}
            />
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 origin-bottom rounded-full bg-current",
                on && level > 0 && !dragging && "ambience-bar",
                !dragging && "transition-[height] duration-300 ease-out"
              )}
              style={{ height: h, animationDelay: `${i * -0.27}s`, animationDuration: `${1.2 + (i % 3) * 0.25}s` }}
            />
          </span>
        );
      })}
    </span>
  );
}
