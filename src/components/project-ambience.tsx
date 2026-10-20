"use client";

import { useEffect, useRef, useState } from "react";
import { audioContext, setSoundOn, soundOn } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const LEVEL = 0.22; // très doux
const FADE = 2.2; // secondes

// Ambiance sonore d'un projet : enregistrement réel (CC0 / domaine public) en boucle sans couture,
// à faible volume, qui apparaît et disparaît en fondu. Respecte le bouton « son » du site.
export function ProjectAmbience({ src, title }: { src: string; title: string }) {
  const nodes = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const [state, setState] = useState<"off" | "loading" | "on" | "blocked">("off");

  const stop = () => {
    const n = nodes.current;
    const ctx = audioContext();
    nodes.current = null;
    if (!n || !ctx) return;
    const t = ctx.currentTime;
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
      gain.gain.linearRampToValueAtTime(LEVEL, ctx.currentTime + FADE);
      source.connect(gain).connect(ctx.destination);
      source.start();
      nodes.current = { source, gain };
      setState("on");
    } catch {
      setState("off");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- démarrage à l'ouverture de la page
    if (soundOn()) void start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const on = state === "on" || state === "loading";
  return (
    <button
      type="button"
      onClick={() => {
        if (on) {
          stop();
          setState("off");
        } else {
          if (!soundOn()) setSoundOn(true);
          void start();
        }
      }}
      aria-pressed={on}
      className={cn("mt-6 flex items-center gap-2 text-sm font-semibold", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
    >
      {/* petites barres qui ondulent tant que l'ambiance joue */}
      <span aria-hidden className="flex h-3 items-end gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("w-[2px] rounded-full bg-current", on ? "ambience-bar" : "h-[3px]")}
            style={on ? { animationDelay: `${i * -0.35}s` } : undefined}
          />
        ))}
      </span>
      <span className="lowercase">ambiance · {title}</span>
      {state === "blocked" && <span className="font-normal text-muted-foreground">(cliquer pour écouter)</span>}
    </button>
  );
}
