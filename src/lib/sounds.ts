"use client";

// Sons d'interface synthétisés à la volée (Web Audio), sans fichier à charger.
// Ambiants et spatialisés : attaques douces, longues traînes dans une réverbération
// « grande pièce claire », et chaque son placé à gauche ou à droite selon l'endroit de l'écran.
let ctx: AudioContext | null = null;
let bus: { dry: GainNode; wet: GainNode } | null = null;
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

// Réponse impulsionnelle générée : bruit qui s'éteint en ~2,6 s, légèrement différent à gauche et à droite.
function impulse(a: AudioContext, seconds = 2.6) {
  const len = Math.floor(a.sampleRate * seconds);
  const buf = a.createBuffer(2, len, a.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  return buf;
}

function audio() {
  if (typeof window === "undefined" || !soundOn()) return null;
  if (!ctx) {
    ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); // évite les pics quand plusieurs sons se superposent
    master.connect(comp).connect(ctx.destination);
    const dry = ctx.createGain();
    dry.gain.value = 0.55;
    const wet = ctx.createGain();
    wet.gain.value = 0.7;
    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx);
    const tone = ctx.createBiquadFilter(); // réverbération feutrée, sans aigus durs
    tone.type = "lowpass";
    tone.frequency.value = 3200;
    dry.connect(master);
    wet.connect(verb).connect(tone).connect(master);
    bus = { dry, wet };
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Gamme pentatonique (do majeur) : les sons s'accordent toujours entre eux.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
const pick = (i: number) => SCALE[Math.max(0, Math.min(SCALE.length - 1, i))];

// Une note : deux sinus très légèrement désaccordés (chorus), attaque douce, longue traîne,
// placée dans l'espace stéréo (pan -1 gauche → 1 droite).
function note(freq: number, { at = 0, dur = 0.9, gain = 0.03, pan = 0, attack = 0.025, glide }: { at?: number; dur?: number; gain?: number; pan?: number; attack?: number; glide?: number } = {}) {
  const a = audio();
  if (!a || !bus) return;
  const t = a.currentTime + at;
  const out = a.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(gain, t + attack);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const p = a.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  out.connect(p);
  p.connect(bus.dry);
  p.connect(bus.wet);
  for (const detune of [-5, 6]) {
    const o = a.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + Math.min(dur, 0.35));
    o.detune.value = detune;
    o.connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

// Position horizontale (0 → 1) convertie en placement stéréo.
const panAt = (x?: number) => (typeof window === "undefined" || x === undefined ? 0 : (x / window.innerWidth) * 1.6 - 0.8);
// Hauteur selon la position : plus aigu en haut de l'écran.
const degreeAt = (y?: number) => (typeof window === "undefined" || y === undefined ? 4 : 7 - Math.round((y / window.innerHeight) * 5));

export const sounds = {
  // survol d'une carte : goutte cristalline, presque murmurée
  hover: (x?: number, y?: number) => note(pick(degreeAt(y)), { dur: 0.7, gain: 0.012, pan: panAt(x), attack: 0.015 }),
  // clic : deux notes posées, comme un souffle
  click: (x?: number) => {
    note(pick(2), { dur: 0.6, gain: 0.022, pan: panAt(x) });
    note(pick(4), { at: 0.06, dur: 0.8, gain: 0.016, pan: panAt(x) });
  },
  // interrupteur : glissé vers l'aigu (personnes) ou le grave (objet)
  toggle: (on: boolean, x?: number) => note(on ? pick(1) : pick(5), { glide: on ? pick(5) : pick(1), dur: 1.1, gain: 0.026, pan: panAt(x), attack: 0.04 }),
  // ouverture d'un projet : accord qui s'ouvre de gauche à droite
  open: (x?: number) => {
    const base = panAt(x);
    [0, 2, 4, 7].forEach((d, i) => note(pick(d), { at: i * 0.07, dur: 1.8, gain: 0.02, pan: base - 0.45 + i * 0.3, attack: 0.06 }));
  },
};
