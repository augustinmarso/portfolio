"use client";

import { useEffect, useRef, useState } from "react";
import { SOUND_EVENT, VOLUME_EVENT, audioContext, getVolume, setSoundOn, setVolume, soundOn } from "@/lib/sounds";
import { AmbienceBars } from "@/components/project-ambience";
import { asset } from "@/lib/projects";
import { cn } from "@/lib/utils";

// Ambiance sonore de la page « pourquoi », qui suit les chapitres du manifeste.
// Fil conducteur commun : un bourdon d'orgue doux en sol dièse (la tonalité des sons de
// l'interface), toujours présent, passé dans la même réverbération. À chaque chapitre, ses
// accords se déplacent lentement et une texture propre entre en fondu enchaîné :
// cloche lointaine, chant grégorien, orage, signaux, alpage et ruisseau, atelier, feu de lecture.

type Chapter = {
  id: string; // id de la section (vide : ouverture, avant le premier chapitre)
  titre: string;
  notes: number[]; // accord du bourdon (4 voix)
  cutoff: number; // couleur du bourdon
  layers: Partial<Record<LayerKey, number>>; // enregistrements (gain relatif)
  bell?: number; // une cloche toutes les n secondes en moyenne
  blips?: boolean;
  knocks?: boolean;
};

const LAYERS = {
  chant: "/ambiances/collection-d-objets-liturgiques.mp3",
  orage: "/ambiances/echappee.mp3",
  alpage: "/ambiances/kai.mp3",
  ruisseau: "/ambiances/porte-cle-jeton-de-caddie.mp3",
  feu: "/ambiances/la-societe-de-jeux.mp3",
} as const;
type LayerKey = keyof typeof LAYERS;

// Sol dièse : G#1 51.91, D#2 77.78, G#2 103.83, A#2 116.54, B2 123.47, C3 130.81, C#3 138.59, D#3 155.56
const CHAPTERS: Chapter[] = [
  { id: "", titre: "le silence avant d'écrire", notes: [51.91, 77.78, 103.83, 155.56], cutoff: 520, layers: {}, bell: 16 },
  { id: "foi", titre: "une voûte, au loin", notes: [51.91, 77.78, 103.83, 155.56], cutoff: 760, layers: { chant: 0.55 }, bell: 28 },
  { id: "fin", titre: "l'orage sur le moteur thermique", notes: [51.91, 77.78, 103.83, 123.47], cutoff: 380, layers: { orage: 0.75 } },
  { id: "ia", titre: "des signaux dans le calme", notes: [51.91, 77.78, 116.54, 155.56], cutoff: 980, layers: {}, blips: true },
  { id: "pistes", titre: "l'alpage, la vie d'après", notes: [51.91, 77.78, 103.83, 130.81], cutoff: 860, layers: { alpage: 0.6, ruisseau: 0.3 } },
  { id: "designers", titre: "trois voix sous la voûte", notes: [51.91, 77.78, 103.83, 155.56], cutoff: 700, layers: { chant: 0.4 }, bell: 22 },
  { id: "inspirations", titre: "l'atelier, le bois et l'eau", notes: [51.91, 77.78, 103.83, 138.59], cutoff: 820, layers: { ruisseau: 0.35 }, knocks: true },
  { id: "notes", titre: "lire au coin du feu", notes: [51.91, 77.78, 103.83, 123.47], cutoff: 560, layers: { feu: 0.85 } },
  { id: "ouvrages", titre: "lire au coin du feu", notes: [51.91, 77.78, 103.83, 123.47], cutoff: 560, layers: { feu: 0.85 } },
];

const LEVEL = 0.3; // très doux
const BLIPS = [830.61, 932.33, 1046.5, 1244.51, 1396.91]; // pentatonique de sol dièse, dans l'aigu

function impulse(ctx: AudioContext, seconds = 4.5) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  return buf;
}

// Moteur : tout est créé au démarrage et détruit à l'arrêt.
class Engine {
  ctx: AudioContext;
  master: GainNode;
  verb: GainNode; // envoi vers la réverbération commune
  drone: { oscs: OscillatorNode[]; gain: GainNode }[] = [];
  droneFilter: BiquadFilterNode;
  layers = new Map<LayerKey, { gain: GainNode; source?: AudioBufferSourceNode }>();
  timer = 0;
  chapter = CHAPTERS[0];
  nextBell = 0;
  nextBlip = 0;
  nextKnock = 0;
  stopped = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    const t = ctx.currentTime;
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(LEVEL * getVolume(), t + 3);
    // patine commune : coupe les aigus durs et tient les crêtes
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 5200;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 3;
    this.master.connect(tone).connect(comp).connect(ctx.destination);

    const conv = ctx.createConvolver();
    conv.buffer = impulse(ctx);
    const verbTone = ctx.createBiquadFilter();
    verbTone.type = "lowpass";
    verbTone.frequency.value = 2400;
    this.verb = ctx.createGain();
    this.verb.gain.value = 0.6;
    this.verb.connect(conv).connect(verbTone).connect(this.master);

    // bourdon : 4 voix, deux oscillateurs légèrement désaccordés chacune, qui respirent lentement
    this.droneFilter = ctx.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = this.chapter.cutoff;
    this.droneFilter.Q.value = 0.4;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.5;
    this.droneFilter.connect(droneGain);
    droneGain.connect(this.master);
    droneGain.connect(this.verb);
    this.chapter.notes.forEach((f, i) => {
      const gain = ctx.createGain();
      gain.gain.value = [0.5, 0.32, 0.26, 0.18][i];
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.04 + i * 0.023;
      const depth = ctx.createGain();
      depth.gain.value = gain.gain.value * 0.45;
      lfo.connect(depth).connect(gain.gain);
      lfo.start();
      const oscs = [-4, 4].map((cents) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = cents;
        o.connect(gain);
        o.start();
        return o;
      });
      gain.connect(this.droneFilter);
      this.drone.push({ oscs: [...oscs, lfo], gain });
    });

    // couches enregistrées, à gain nul en attendant leur chapitre
    (Object.keys(LAYERS) as LayerKey[]).forEach((k) => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = k === "chant" ? 1900 : 3200; // le chant reste lointain
      const send = ctx.createGain();
      send.gain.value = k === "chant" ? 0.5 : 0.12;
      gain.connect(f);
      f.connect(this.master);
      f.connect(send).connect(this.verb);
      this.layers.set(k, { gain });
    });

    this.timer = window.setInterval(() => this.tick(), 200);
  }

  private async load(k: LayerKey) {
    const layer = this.layers.get(k)!;
    if (layer.source) return;
    const buf = await this.ctx.decodeAudioData(await (await fetch(asset(LAYERS[k]))).arrayBuffer());
    if (this.stopped || layer.source) return;
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.connect(layer.gain);
    s.start(0, Math.random() * buf.duration); // départ au hasard dans la boucle
    layer.source = s;
  }

  setChapter(c: Chapter) {
    this.chapter = c;
    const t = this.ctx.currentTime;
    // le bourdon glisse lentement vers le nouvel accord
    this.drone.forEach((v, i) => v.oscs.slice(0, 2).forEach((o) => o.frequency.setTargetAtTime(c.notes[i], t, 1.6)));
    this.droneFilter.frequency.setTargetAtTime(c.cutoff, t, 1.8);
    // fondu enchaîné des textures (environ 4 secondes)
    this.layers.forEach((layer, k) => {
      const target = c.layers[k] ?? 0;
      if (target > 0) void this.load(k).catch(() => {});
      layer.gain.gain.setTargetAtTime(target, t, 1.3);
    });
    const now = performance.now();
    this.nextBell = now + 2500;
    this.nextBlip = now + 1200;
    this.nextKnock = now + 1500;
  }

  setVolume(v: number) {
    this.master.gain.setTargetAtTime(LEVEL * v, this.ctx.currentTime, 0.08);
  }

  private tick() {
    const now = performance.now();
    const c = this.chapter;
    if (c.bell && now > this.nextBell) {
      this.bell();
      this.nextBell = now + c.bell * 1000 * (0.7 + Math.random() * 0.6);
    }
    if (c.blips && now > this.nextBlip) {
      this.blip();
      this.nextBlip = now + 900 + Math.random() * 2600;
    }
    if (c.knocks && now > this.nextKnock) {
      this.knock();
      this.nextKnock = now + (Math.random() < 0.3 ? 260 : 1400 + Math.random() * 3200); // parfois deux coups rapprochés
    }
  }

  // Cloche lointaine : partiels inharmoniques à décroissance lente, surtout dans la réverbération.
  private bell() {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.09;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 0.8 - 0.4;
    out.connect(pan);
    pan.connect(this.verb);
    const dry = ctx.createGain();
    dry.gain.value = 0.25;
    pan.connect(dry).connect(this.master);
    [0.5, 1, 1.19, 1.56, 2, 2.51, 3.01].forEach((r, i) => {
      const o = ctx.createOscillator();
      o.frequency.value = 207.65 * r;
      const g = ctx.createGain();
      const dur = 9 / (1 + i * 0.6);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1 / (1 + i * 0.8), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  // Signal : note pure, attaque douce, écho qui s'éloigne.
  private blip() {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.value = BLIPS[Math.floor(Math.random() * BLIPS.length)];
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.4 - 0.7;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.37;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    o.connect(g).connect(pan);
    pan.connect(this.master);
    pan.connect(this.verb);
    pan.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(this.verb);
    o.start(t);
    o.stop(t + 1.5);
    window.setTimeout(() => fb.disconnect(), 4000); // l'écho s'éteint, on libère la boucle
  }

  // Coup de maillet sur du bois : bruit filtré très court et petite résonance grave.
  private knock() {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    const n = ctx.createBufferSource();
    n.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 700 + Math.random() * 700;
    bp.Q.value = 6;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    const o = ctx.createOscillator();
    o.frequency.value = 170 + Math.random() * 90;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.12, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.2 - 0.6;
    n.connect(bp).connect(g).connect(pan);
    o.connect(og).connect(pan);
    pan.connect(this.master);
    pan.connect(this.verb);
    n.start(t);
    o.start(t);
    o.stop(t + 0.15);
  }

  stop() {
    this.stopped = true;
    window.clearInterval(this.timer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 1.4);
    window.setTimeout(() => {
      this.drone.forEach((v) => v.oscs.forEach((o) => o.stop()));
      this.layers.forEach((l) => l.source?.stop());
      this.master.disconnect();
    }, 1600);
  }
}

// Chapitre courant : le dernier dont le haut a passé le milieu de l'écran.
function currentChapter() {
  const line = window.innerHeight * 0.5;
  let c = CHAPTERS[0];
  for (const ch of CHAPTERS.slice(1)) {
    const el = document.getElementById(ch.id);
    if (el && el.getBoundingClientRect().top <= line) c = ch;
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) c = CHAPTERS[CHAPTERS.length - 1];
  return c;
}

export function PageSoundscape() {
  const engine = useRef<Engine | null>(null);
  const [state, setState] = useState<"off" | "on" | "blocked">("off");
  const [chapter, setChapter] = useState(CHAPTERS[0]);

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
    const c = currentChapter();
    e.setChapter(c);
    setChapter(c);
    setState("on");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- démarrage à l'ouverture de la page
    if (soundOn()) void start();

    // minuterie plutôt que requestAnimationFrame : le son continue même quand l'onglet est en arrière-plan
    let timer = 0;
    let last = CHAPTERS[0];
    const onScroll = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        const c = currentChapter();
        if (c === last) return;
        last = c;
        engine.current?.setChapter(c);
        setChapter(c);
      }, 150);
    };
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
    window.addEventListener("scroll", onScroll, { passive: true });
    // filet de sécurité : les événements de défilement ne partent pas quand la page n'est pas affichée
    const poll = window.setInterval(onScroll, 1000);
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
        ambiance ·{" "}
        <span key={chapter.titre} className="inline-block animate-[soundscape-in_1.2s_ease-out]">
          {chapter.titre}
        </span>
        {state === "blocked" && <span className="ml-1 font-normal text-muted-foreground">(cliquer pour écouter)</span>}
      </button>
    </div>
  );
}
