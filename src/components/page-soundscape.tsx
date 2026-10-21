"use client";

import { useEffect, useRef, useState } from "react";
import { SOUND_EVENT, VOLUME_EVENT, audioContext, getVolume, setSoundOn, setVolume, soundOn } from "@/lib/sounds";
import { AmbienceBars } from "@/components/project-ambience";
import { asset } from "@/lib/projects";
import { cn } from "@/lib/utils";

// Musique de la page « pourquoi », générée en direct et qui suit les chapitres du manifeste.
// Une seule pièce en sol dièse mineur (la tonalité des sons de l'interface), sur une suite
// d'accords fixe (sol#m – mi – si – fa#) : chaque chapitre ajoute ou retire une voix, la musique
// monte peu à peu jusqu'à l'atelier puis se resserre pour la lecture et la coda.
// Seul bruit concret : une page qu'on tourne, au moment où l'on change de chapitre.

type Part = {
  melody: number; // probabilité d'une note de piano par temps
  bass?: boolean;
  chords?: boolean; // accord plaqué au piano en début de mesure
  celesta?: boolean; // tintements aigus, sur les temps
  pluck?: boolean; // arpège pincé en croches
  counter?: boolean; // deuxième voix, sous la mélodie
  cutoff: number; // ouverture du filtre de la nappe
};
type Chapter = { id: string; titre: string; part: Part };

const CHAPTERS: Chapter[] = [
  { id: "", titre: "prélude", part: { melody: 0.12, cutoff: 520 } },
  { id: "foi", titre: "choral", part: { melody: 0.3, cutoff: 700 } },
  { id: "fin", titre: "basse continue", part: { melody: 0.3, bass: true, cutoff: 480 } },
  { id: "ia", titre: "signaux", part: { melody: 0.32, bass: true, celesta: true, cutoff: 900 } },
  { id: "pistes", titre: "élan", part: { melody: 0.45, bass: true, chords: true, celesta: true, cutoff: 1100 } },
  { id: "designers", titre: "trois voix", part: { melody: 0.45, bass: true, chords: true, counter: true, cutoff: 1100 } },
  { id: "inspirations", titre: "atelier", part: { melody: 0.5, bass: true, chords: true, counter: true, pluck: true, cutoff: 1300 } },
  { id: "notes", titre: "lecture", part: { melody: 0.25, bass: true, cutoff: 650 } },
  { id: "ouvrages", titre: "coda", part: { melody: 0.12, cutoff: 500 } },
];

const LEVEL = 0.22; // doux, en fond
const BEAT = 60 / 62; // tempo lent
const PAGE = "/ambiances/page.mp3";

// Suite d'accords : fondamentale grave et trois notes de l'accord (Hz).
const PROGRESSION = [
  { root: 51.91, tones: [207.65, 246.94, 311.13] }, // sol#m
  { root: 41.2, tones: [164.81, 207.65, 246.94] }, // mi
  { root: 61.74, tones: [246.94, 311.13, 369.99] }, // si
  { root: 46.25, tones: [185, 233.08, 277.18] }, // fa#
];
// Pentatonique de sol# mineur pour la mélodie (médium-aigu).
const MELODY = [415.3, 493.88, 554.37, 622.25, 739.99, 830.61, 987.77];

function impulse(ctx: AudioContext, seconds = 4.5) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  return buf;
}

class Engine {
  ctx: AudioContext;
  master: GainNode;
  verb: GainNode; // envoi vers la réverbération commune
  pad: { oscs: OscillatorNode[]; gain: GainNode }[] = [];
  padFilter: BiquadFilterNode;
  part: Part = CHAPTERS[0].part;
  pageBuf: AudioBuffer | null = null;
  timer = 0;
  beat = 0;
  nextBeat = 0;
  melodyIdx = 3;
  stopped = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    const t = ctx.currentTime;
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(LEVEL * getVolume(), t + 4);
    const tone = ctx.createBiquadFilter(); // patine commune : pas d'aigus durs
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
    verbTone.frequency.value = 2600;
    this.verb = ctx.createGain();
    this.verb.gain.value = 0.55;
    this.verb.connect(conv).connect(verbTone).connect(this.master);

    // nappe : 4 voix qui suivent les accords en glissant, et respirent lentement
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = "lowpass";
    this.padFilter.frequency.value = this.part.cutoff;
    this.padFilter.Q.value = 0.4;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.42;
    this.padFilter.connect(padGain);
    padGain.connect(this.master);
    padGain.connect(this.verb);
    const first = PROGRESSION[0];
    [first.root * 2, ...first.tones].forEach((f, i) => {
      const gain = ctx.createGain();
      gain.gain.value = [0.45, 0.24, 0.2, 0.16][i];
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.021;
      const depth = ctx.createGain();
      depth.gain.value = gain.gain.value * 0.4;
      lfo.connect(depth).connect(gain.gain);
      lfo.start();
      const oscs = [-5, 5].map((cents) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = cents;
        o.connect(gain);
        o.start();
        return o;
      });
      gain.connect(this.padFilter);
      this.pad.push({ oscs: [...oscs, lfo], gain });
    });

    void fetch(asset(PAGE))
      .then((r) => r.arrayBuffer())
      .then((b) => ctx.decodeAudioData(b))
      .then((b) => (this.pageBuf = b))
      .catch(() => {});

    this.nextBeat = t + 0.3;
    this.timer = window.setInterval(() => this.schedule(), 100);
  }

  setPart(part: Part, turnPage: boolean) {
    this.part = part;
    this.padFilter.frequency.setTargetAtTime(part.cutoff, this.ctx.currentTime, 2);
    if (turnPage) this.pageTurn();
  }

  setVolume(v: number) {
    this.master.gain.setTargetAtTime(LEVEL * v, this.ctx.currentTime, 0.08);
  }

  // Programme les temps qui tombent dans la prochaine demi-seconde (horloge audio, sans à-coups).
  private schedule() {
    while (this.nextBeat < this.ctx.currentTime + 0.5) {
      this.playBeat(this.beat, this.nextBeat);
      this.beat++;
      this.nextBeat += BEAT;
    }
  }

  private playBeat(beat: number, t: number) {
    const p = this.part;
    const inBar = beat % 4;
    const chord = PROGRESSION[Math.floor(beat / 4) % PROGRESSION.length];

    if (inBar === 0) {
      // la nappe glisse vers le nouvel accord
      [chord.root * 2, ...chord.tones].forEach((f, i) =>
        this.pad[i].oscs.slice(0, 2).forEach((o) => o.frequency.setTargetAtTime(f, t, 0.8))
      );
      if (p.bass) this.bass(chord.root * 2, t, BEAT * 4);
      if (p.chords) chord.tones.forEach((f, i) => this.piano(f, t + i * 0.03, 3.2, 0.05));
    }
    if (Math.random() < p.melody) {
      // mélodie : petits pas dans la gamme, plutôt vers les notes de l'accord
      this.melodyIdx = Math.max(0, Math.min(MELODY.length - 1, this.melodyIdx + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      this.piano(MELODY[this.melodyIdx], t + (Math.random() < 0.3 ? BEAT / 2 : 0), 2.6, 0.075);
      if (p.counter && Math.random() < 0.5) this.piano(MELODY[Math.max(0, this.melodyIdx - 2)] / 2, t + BEAT / 2, 2.6, 0.05);
    }
    if (p.celesta && Math.random() < 0.35) {
      const f = chord.tones[Math.floor(Math.random() * 3)] * 4;
      this.celesta(f, t + (Math.random() < 0.5 ? 0 : BEAT / 2));
    }
    if (p.pluck) {
      // arpège en croches sur les notes de l'accord, une octave au-dessus
      [0, 1].forEach((half) => {
        const f = chord.tones[(inBar * 2 + half) % 3] * 2;
        this.pluck(f, t + (half * BEAT) / 2);
      });
    }
  }

  private voice(dest: AudioNode, wet: number, panValue = Math.random() * 0.8 - 0.4) {
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = panValue;
    pan.connect(dest);
    const send = this.ctx.createGain();
    send.gain.value = wet;
    pan.connect(send).connect(this.verb);
    return pan;
  }

  // Piano feutré : fondamentale et deux partiels, attaque nette, longue décroissance, filtre doux.
  private piano(f: number, t: number, dur: number, level: number) {
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(f * 6, t);
    lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur);
    lp.connect(this.voice(this.master, 0.6));
    [1, 2, 3].forEach((r, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "triangle" : "sine";
      o.frequency.value = f * r;
      const g = ctx.createGain();
      const peak = level / (1 + i * 1.8);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (1 + i * 0.5));
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  private bass(f: number, t: number, dur: number) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.13, t + 0.25);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.7, dur * 0.2);
    o.connect(g).connect(this.voice(this.master, 0.15, 0));
    o.start(t);
    o.stop(t + dur * 1.3);
  }

  private celesta(f: number, t: number) {
    const ctx = this.ctx;
    const out = this.voice(this.master, 0.8);
    [1, 4].forEach((r, i) => {
      const o = ctx.createOscillator();
      o.frequency.value = f * r;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(i === 0 ? 0.03 : 0.006, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (i === 0 ? 1.8 : 0.4));
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 1.9);
    });
  }

  private pluck(f: number, t: number) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(f * 4, t);
    lp.frequency.exponentialRampToValueAtTime(f, t + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.028, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(lp).connect(g).connect(this.voice(this.master, 0.4));
    o.start(t);
    o.stop(t + 0.55);
  }

  // Page qu'on tourne (enregistrement du domaine public), un peu à droite, sans réverbération.
  private pageTurn() {
    if (!this.pageBuf) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.pageBuf;
    s.playbackRate.value = 0.94 + Math.random() * 0.12;
    const g = this.ctx.createGain();
    g.gain.value = 0.9;
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = 0.25;
    s.connect(g).connect(pan).connect(this.master);
    s.start();
  }

  stop() {
    this.stopped = true;
    window.clearInterval(this.timer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 1.4);
    window.setTimeout(() => {
      this.pad.forEach((v) => v.oscs.forEach((o) => o.stop()));
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
    e.setPart(c.part, false);
    setChapter(c);
    setState("on");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- démarrage à l'ouverture de la page
    if (soundOn()) void start();

    // minuterie plutôt que requestAnimationFrame : la musique continue même quand l'onglet est en arrière-plan
    let timer = 0;
    let last = CHAPTERS[0];
    const onScroll = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        const c = currentChapter();
        if (c === last) return;
        last = c;
        engine.current?.setPart(c.part, true); // la page tourne seulement au changement de chapitre
        setChapter(c);
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
        musique ·{" "}
        <span key={chapter.titre} className="inline-block animate-[soundscape-in_1.2s_ease-out]">
          {chapter.titre}
        </span>
        {state === "blocked" && <span className="ml-1 font-normal text-muted-foreground">(cliquer pour écouter)</span>}
      </button>
    </div>
  );
}
