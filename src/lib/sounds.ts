"use client";

// Petits sons d'interface synthétisés à la volée (Web Audio) : aucun fichier à charger.
// Doux et courts, dans l'esprit des sons de présentation produit.
let ctx: AudioContext | null = null;
const KEY = "portfolio:son";

export const soundOn = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};
export const setSoundOn = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
};

function audio() {
  if (typeof window === "undefined" || !soundOn()) return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Une note : sinus doux, attaque rapide, extinction exponentielle, filtrée pour rester feutrée.
function tone(freq: number, { at = 0, dur = 0.12, gain = 0.05, to }: { at?: number; dur?: number; gain?: number; to?: number } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  const f = a.createBiquadFilter();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.8);
  f.type = "lowpass";
  f.frequency.value = 2400;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sounds = {
  // survol d'une carte : petite bulle
  hover: () => tone(1180, { to: 880, dur: 0.07, gain: 0.018 }),
  // clic : double tic
  click: () => {
    tone(880, { dur: 0.05, gain: 0.035 });
    tone(1320, { at: 0.035, dur: 0.06, gain: 0.025 });
  },
  // interrupteur : glissé montant (personnes) ou descendant (objet)
  toggle: (on: boolean) => tone(on ? 420 : 820, { to: on ? 820 : 420, dur: 0.16, gain: 0.04 }),
  // ouverture d'un projet : accord bref et aérien
  open: () => {
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, { at: i * 0.045, dur: 0.42, gain: 0.03 }));
  },
};
