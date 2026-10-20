"use client";

// Sons d'interface synthétisés à la volée (Web Audio), sans fichier à charger : compositions
// originales dans l'esprit des vidéos de lancement produit (sons purs, attaques douces,
// quintes, longues traînes), spatialisés selon l'endroit de l'écran.
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

// Gamme pentatonique de sol dièse (sons purs, souvent à la quinte) : graves chauds,
// médiums ronds et tintements clairs dans l'aigu.
const SCALE = [207.65, 233.08, 261.63, 311.13, 349.23, 415.3, 466.16, 523.25, 622.25, 698.46, 830.61, 932.33, 1046.5, 1244.51, 1396.91];
const pick = (i: number) => SCALE[Math.max(0, Math.min(SCALE.length - 1, i))];

// Son pur (sinus) qui « gonfle » puis s'éteint lentement dans la réverbération,
// placé dans l'espace stéréo (pan -1 gauche → 1 droite).
function note(freq: number, { at = 0, dur = 1.6, gain = 0.03, pan = 0, attack = 0.09, glide }: { at?: number; dur?: number; gain?: number; pan?: number; attack?: number; glide?: number } = {}) {
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
  const o = a.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + Math.min(dur * 0.5, 0.4));
  o.connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Pulsation grave, à peine perceptible : donne du corps sans « boum ».
function sub(at = 0, gain = 0.05) {
  note(61.7, { at, dur: 0.55, gain, attack: 0.03 });
}

// Position horizontale convertie en placement stéréo.
const panAt = (x?: number) => (typeof window === "undefined" || x === undefined ? 0 : (x / window.innerWidth) * 1.6 - 0.8);
// Tintement aigu : plus haut en haut de l'écran.
const highAt = (y?: number) => (typeof window === "undefined" || y === undefined ? 12 : 14 - Math.round((y / window.innerHeight) * 4));

export const sounds = {
  // survol d'une carte : tintement clair, pur, presque murmuré
  hover: (x?: number, y?: number) => note(pick(highAt(y)), { dur: 1.2, gain: 0.01, pan: panAt(x), attack: 0.03 }),
  // clic : quinte ronde dans le médium, posée sur une pulsation grave
  click: (x?: number) => {
    sub(0, 0.035);
    note(pick(5), { dur: 1.4, gain: 0.018, pan: panAt(x), attack: 0.06 });
    note(pick(8), { at: 0.02, dur: 1.4, gain: 0.012, pan: panAt(x), attack: 0.07 });
  },
  // interrupteur : une note qui gonfle et glisse d'une quinte, vers l'aigu (personnes) ou le grave (objet)
  toggle: (on: boolean, x?: number) =>
    note(on ? pick(3) : pick(7), { glide: on ? pick(7) : pick(3), dur: 1.8, gain: 0.024, pan: panAt(x), attack: 0.12 }),
  // ouverture d'un projet : pulsation, quinte grave qui s'ouvre, puis un tintement lointain
  open: (x?: number) => {
    const base = panAt(x);
    sub(0, 0.05);
    note(pick(0), { dur: 3.2, gain: 0.022, pan: base - 0.35, attack: 0.15 });
    note(pick(3), { at: 0.05, dur: 3.2, gain: 0.018, pan: base + 0.35, attack: 0.15 });
    note(pick(13), { at: 0.32, dur: 2.4, gain: 0.008, pan: base, attack: 0.04 });
  },
};
