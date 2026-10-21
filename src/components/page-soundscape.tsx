"use client";

import { useEffect, useRef, useState } from "react";
import { SOUND_EVENT, VOLUME_EVENT, audioContext, getVolume, setSoundOn, setVolume, soundOn } from "@/lib/sounds";
import { AmbienceBars } from "@/components/project-ambience";
import { asset } from "@/lib/projects";
import { cn } from "@/lib/utils";

// Musique de la page « pourquoi », au choix, jouée en boucle et doucement. Le contrôle reste
// accroché en bas à gauche ; le choix du morceau et le lecteur YouTube s'ouvrent au-dessus.
// - Pachelbel, Canon : « Canon » (2004), Strolling Strings de l'United States Air Force Band
//   (domaine public, Wikimedia Commons).
// - Satie, Gymnopédie n° 1 : interprétée par Michael Laucke (domaine public, Wikimedia Commons).
// - Bach, Toccata en ré mineur (BWV 565, sans la fugue) : orgue, par Ashtar Moïra (domaine public,
//   Wikimedia Commons).
// - Perfect Day, au piano : reprise arrangée pour Augustin, publiée sous licence de reprise
//   obtenue par lui. (Le lecteur YouTube reste possible pour un morceau sans licence : champ youtube.)

type Track = { id: string; titre: string; src?: string; youtube?: string };
const TRACKS: Track[] = [
  { id: "canon", titre: "pachelbel, canon en ré", src: "/ambiances/canon.mp3" },
  { id: "gymnopedie", titre: "satie, gymnopédie n° 1", src: "/ambiances/gymnopedie.mp3" },
  { id: "perfect-day", titre: "perfect day, au piano", src: "/ambiances/perfect-day-piano.mp3" },
  { id: "toccata", titre: "bach, toccata en ré mineur", src: "/ambiances/toccata.mp3" },
];
const STORE = "portfolio:pourquoi-musique"; // préférence de ce navigateur seulement
const LEVEL = 0.3; // en fond, sous la lecture

const load = (ctx: AudioContext, url: string) =>
  fetch(asset(url))
    .then((r) => r.arrayBuffer())
    .then((b) => ctx.decodeAudioData(b));

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

  async play(src: string) {
    const buf = await load(this.ctx, src);
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

// Commande envoyée au lecteur YouTube intégré (API iframe par messages).
function yt(frame: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}

export function PageSoundscape() {
  const engine = useRef<Engine | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [track, setTrack] = useState(TRACKS[0]);
  const trackRef = useRef(track);
  const [state, setState] = useState<"off" | "on" | "blocked">("off");
  const [menu, setMenu] = useState(false);

  const stop = () => {
    engine.current?.stop();
    engine.current = null;
    yt(frame.current, "pauseVideo");
  };

  const start = async () => {
    const t = trackRef.current;
    if (t.youtube) {
      // le lecteur YouTube joue lui-même ; on lui donne le volume du site
      yt(frame.current, "setVolume", [Math.round(getVolume() * 100)]);
      yt(frame.current, "playVideo");
      return setState("on");
    }
    if (engine.current) return;
    const ctx = audioContext();
    if (!ctx) return setState("off");
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    if (ctx.state !== "running") return setState("blocked"); // lecture automatique refusée : un geste suffira
    if (engine.current) return;
    const e = new Engine(ctx);
    engine.current = e;
    setState("on");
    e.play(t.src!).catch(() => {
      if (engine.current === e) {
        stop();
        setState("off");
      }
    });
  };

  const choose = (t: Track) => {
    setMenu(false);
    if (t.id === trackRef.current.id) return;
    stop();
    trackRef.current = t;
    setTrack(t);
    try {
      localStorage.setItem(STORE, t.id);
    } catch {}
    if (!soundOn()) setSoundOn(true);
    if (getVolume() < 0.05) setVolume(0.5);
    // le lecteur YouTube démarre seul (lecture automatique) ; les fichiers du site, tout de suite
    if (t.youtube) setState("on");
    else void start();
  };

  useEffect(() => {
    try {
      const saved = TRACKS.find((t) => t.id === localStorage.getItem(STORE));
      if (saved) {
        trackRef.current = saved;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- préférence lue après l'hydratation
        setTrack(saved);
      }
    } catch {}
    if (soundOn() && !trackRef.current.youtube) void start();

    // premier geste sur la page : si la lecture automatique était bloquée, on démarre
    const wake = (e: Event) => {
      if (box.current?.contains(e.target as Node)) return; // le contrôle gère ses propres clics
      if (soundOn() && !engine.current && !trackRef.current.youtube) void start();
    };
    const sync = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) void start();
      else {
        stop();
        setState("off");
      }
    };
    const vol = (e: Event) => {
      const v = (e as CustomEvent<number>).detail;
      engine.current?.setVolume(v);
      yt(frame.current, "setVolume", [Math.round(v * 100)]);
    };
    const outside = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    window.addEventListener("pointerdown", outside);
    window.addEventListener(SOUND_EVENT, sync);
    window.addEventListener(VOLUME_EVENT, vol);
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("pointerdown", outside);
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
    <div ref={box} className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6">
      {/* lecteur officiel, visible, au-dessus du contrôle */}
      {track.youtube && (
        <iframe
          ref={frame}
          title="Miriam Stockley — Perfect Day (lecteur YouTube officiel)"
          src={`https://www.youtube-nocookie.com/embed/${track.youtube}?autoplay=1&loop=1&playlist=${track.youtube}&rel=0&enablejsapi=1`}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="mb-2 aspect-video w-56 rounded-md sm:w-64"
          onLoad={() => yt(frame.current, "setVolume", [Math.round(getVolume() * 100)])}
        />
      )}

      {menu && (
        <ul role="listbox" aria-label="Choisir la musique" className="mb-2 grid w-64 gap-0.5 rounded-xl bg-background p-1.5 text-[15px] font-semibold shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_8px_24px_rgb(0_0_0/0.08)]">
          {TRACKS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="option"
                aria-selected={t.id === track.id}
                onClick={() => choose(t)}
                className={cn(
                  "w-full rounded-lg px-3 py-1.5 text-left lowercase transition-colors hover:bg-foreground/5",
                  t.id === track.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t.titre}
                {t.youtube && <span className="ml-1 font-normal text-muted-foreground">(youtube)</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        className={cn(
          "flex items-baseline gap-2.5 rounded-full bg-background/85 px-3 py-1.5 text-[15px] font-semibold backdrop-blur-sm",
          on ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <AmbienceBars on={on} onSilence={() => { stop(); setState("off"); }} onWake={() => { if (!on) void start(); }} />
        <button type="button" onClick={toggle} aria-pressed={on} className="lowercase hover:text-foreground">
          musique · {track.titre}
          {state === "blocked" && <span className="ml-1 font-normal text-muted-foreground">(cliquer pour écouter)</span>}
        </button>
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          className="font-normal text-muted-foreground underline decoration-1 underline-offset-4 hover:text-foreground"
        >
          changer
        </button>
      </div>
    </div>
  );
}
