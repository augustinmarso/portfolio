"use client";

import { useEffect, useRef, useState } from "react";
import { SOUND_EVENT, VOLUME_EVENT, audioContext, getVolume, setSoundOn, setVolume, soundOn } from "@/lib/sounds";
import { AmbienceBars } from "@/components/project-ambience";
import { asset } from "@/lib/projects";
import { cn } from "@/lib/utils";

// Musique de la page « pourquoi » : le Canon en ré de Pachelbel, joué en boucle, doucement.
// Enregistrement du domaine public : « Canon » (2004), Strolling Strings de l'United States
// Air Force Band, via Wikimedia Commons. Le contrôle reste accroché en bas à gauche.

const CANON = "/ambiances/canon.mp3";
const LEVEL = 0.3; // en fond, sous la lecture

class Engine {
  ctx: AudioContext;
  master: GainNode;
  source: AudioBufferSourceNode | null = null;
  stopped = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
  }

  async play() {
    const buf = await fetch(asset(CANON))
      .then((r) => r.arrayBuffer())
      .then((b) => this.ctx.decodeAudioData(b));
    if (this.stopped) return;
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.connect(this.master);
    s.start();
    this.source = s;
    const t = this.ctx.currentTime;
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(LEVEL * getVolume(), t + 3);
  }

  setVolume(v: number) {
    this.master.gain.setTargetAtTime(LEVEL * v, this.ctx.currentTime, 0.08);
  }

  stop() {
    this.stopped = true;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 1.4);
    window.setTimeout(() => {
      this.source?.stop();
      this.master.disconnect();
    }, 1600);
  }
}

export function PageSoundscape() {
  const engine = useRef<Engine | null>(null);
  const [state, setState] = useState<"off" | "on" | "blocked">("off");

  const stop = () => {
    engine.current?.stop();
    engine.current = null;
  };

  const start = async () => {
    if (engine.current) return;
    const ctx = audioContext();
    if (!ctx) return setState("off");
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    if (ctx.state !== "running") return setState("blocked"); // lecture automatique refusée : un geste suffira
    if (engine.current) return;
    const e = new Engine(ctx);
    engine.current = e;
    setState("on");
    e.play().catch(() => {
      if (engine.current === e) {
        stop();
        setState("off");
      }
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- démarrage à l'ouverture de la page
    if (soundOn()) void start();

    // premier geste sur la page : si la lecture automatique était bloquée, on démarre
    const wake = () => {
      if (soundOn() && !engine.current) void start();
    };
    const sync = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) void start();
      else {
        stop();
        setState("off");
      }
    };
    const vol = (e: Event) => engine.current?.setVolume((e as CustomEvent<number>).detail);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    window.addEventListener(SOUND_EVENT, sync);
    window.addEventListener(VOLUME_EVENT, vol);
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener(SOUND_EVENT, sync);
      window.removeEventListener(VOLUME_EVENT, vol);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- branché une seule fois, à l'ouverture de la page
  }, []);

  const on = state === "on";
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
    <div
      className={cn(
        "fixed bottom-4 left-4 z-40 flex items-baseline gap-2.5 rounded-full bg-background/85 px-3 py-1.5 text-[15px] font-semibold backdrop-blur-sm sm:bottom-6 sm:left-6",
        on ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <AmbienceBars on={on} onSilence={() => { stop(); setState("off"); }} onWake={() => { if (!on) void start(); }} />
      <button type="button" onClick={toggle} aria-pressed={on} className="lowercase hover:text-foreground">
        musique · pachelbel, canon en ré
        {state === "blocked" && <span className="ml-1 font-normal text-muted-foreground">(cliquer pour écouter)</span>}
      </button>
    </div>
  );
}
