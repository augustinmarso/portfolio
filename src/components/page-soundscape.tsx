"use client";

import { useEffect, useRef, useState } from "react";
import { SOUND_EVENT, VOLUME_EVENT, audioContext, getVolume, setSoundOn, setVolume, soundOn } from "@/lib/sounds";
import { AmbienceBars } from "@/components/project-ambience";
import { asset } from "@/lib/projects";
import { cn } from "@/lib/utils";

// Musique de la page « pourquoi » : le Canon en ré de Pachelbel, joué en boucle, doucement.
// Enregistrement du domaine public : « Canon » (2004), Strolling Strings de l'United States
// Air Force Band, via Wikimedia Commons. Seul autre son : une page qu'on tourne (domaine
// public, planish), au moment où l'on change de chapitre du manifeste.

const CANON = "/ambiances/canon.mp3";
const PAGE = "/ambiances/page.mp3";
const LEVEL = 0.3; // en fond, sous la lecture
const CHAPTERS = ["foi", "fin", "ia", "pistes", "designers", "inspirations", "notes", "ouvrages"];

const load = (ctx: AudioContext, url: string) =>
  fetch(asset(url))
    .then((r) => r.arrayBuffer())
    .then((b) => ctx.decodeAudioData(b));

class Engine {
  ctx: AudioContext;
  master: GainNode;
  source: AudioBufferSourceNode | null = null;
  pageBuf: AudioBuffer | null = null;
  stopped = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    void load(ctx, PAGE)
      .then((b) => (this.pageBuf = b))
      .catch(() => {});
  }

  async play() {
    const buf = await load(this.ctx, CANON);
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

  // Page qu'on tourne, un peu à droite, par-dessus la musique.
  pageTurn() {
    if (!this.pageBuf || this.stopped) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.pageBuf;
    s.playbackRate.value = 0.94 + Math.random() * 0.12;
    const g = this.ctx.createGain();
    g.gain.value = 0.35 * getVolume();
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = 0.25;
    s.connect(g).connect(pan).connect(this.ctx.destination);
    s.start();
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

// Chapitre courant : le dernier dont le haut a passé le milieu de l'écran (vide : ouverture).
function currentChapter() {
  const line = window.innerHeight * 0.5;
  let c = "";
  for (const id of CHAPTERS) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= line) c = id;
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) c = CHAPTERS[CHAPTERS.length - 1];
  return c;
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

    // minuterie plutôt que requestAnimationFrame : continue même quand l'onglet est en arrière-plan
    let timer = 0;
    let last = currentChapter();
    const onScroll = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        const c = currentChapter();
        if (c === last) return;
        last = c;
        engine.current?.pageTurn(); // la page tourne seulement au changement de chapitre
      }, 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // filet de sécurité : les événements de défilement ne partent pas quand la page n'est pas affichée
    const poll = window.setInterval(onScroll, 1000);
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
      window.clearTimeout(timer);
      window.clearInterval(poll);
      window.removeEventListener("scroll", onScroll);
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
        musique · Pachelbel, canon en ré
        {state === "blocked" && <span className="ml-1 font-normal text-muted-foreground">(cliquer pour écouter)</span>}
      </button>
    </div>
  );
}
