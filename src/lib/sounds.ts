"use client";

// Sons d'interface synthétisés à la volée (Web Audio), sans fichier à charger : compositions
// originales, mates et effacées, avec un léger grain rauque ; chaque son tire au hasard
// une variante (notes, timbre, texture) et se place dans l'espace selon l'endroit de l'écran.
let ctx: AudioContext | null = null;
let bus: { dry: GainNode; wet: GainNode } | null = null;
let noise: AudioBuffer | null = null;
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

// Bruit rose approximatif (1 s), réutilisé pour le grain rauque.
function pinkNoise(a: AudioContext) {
  const buf = a.createBuffer(1, a.sampleRate, a.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + 0.029591 * w;
    b1 = 0.985 * b1 + 0.032534 * w;
    b2 = 0.95 * b2 + 0.048056 * w;
    d[i] = (b0 + b1 + b2 + w * 0.05) * 1.6;
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
    dry.gain.value = 0.5;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx);
    const tone = ctx.createBiquadFilter(); // traîne mate, sans aigus
    tone.type = "lowpass";
    tone.frequency.value = 2000;
    dry.connect(master);
    wet.connect(verb).connect(tone).connect(master);
    bus = { dry, wet };
    noise = pinkNoise(ctx);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Gamme pentatonique de sol dièse : graves chauds, médiums ronds, tintements dans l'aigu.
const SCALE = [207.65, 233.08, 261.63, 311.13, 349.23, 415.3, 466.16, 523.25, 622.25, 698.46, 830.61, 932.33, 1046.5, 1244.51, 1396.91];
const pick = (i: number) => SCALE[Math.max(0, Math.min(SCALE.length - 1, i))];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const any = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

// Courbe de saturation douce : arrondit et « râpe » légèrement le son.
let curve: Float32Array<ArrayBuffer> | null = null;
function clipCurve() {
  curve ??= Float32Array.from({ length: 1024 }, (_, i) => {
    const x = (i / 1023) * 2 - 1;
    return Math.tanh(x * 2.2) / Math.tanh(2.2);
  });
  return curve;
}

type NoteOpts = {
  at?: number;
  dur?: number;
  gain?: number;
  pan?: number;
  attack?: number;
  glide?: number;
  bright?: number; // ouverture du filtre (1 = clair, 0,5 = mat)
  rasp?: number; // saturation (0 → 1)
  breath?: number; // souffle rauque autour de la note (0 → 1,5)
  wave?: OscillatorType;
};

// Une note mate : oscillateur passé dans un passe-bas qui se referme, un peu saturé (rasp),
// avec un souffle filtré autour de la note (breath) pour le grain rauque.
function note(freq: number, { at = 0, dur = 1.4, gain = 0.03, pan = 0, attack = 0.09, glide, bright = 1, rasp = 0, breath = 0, wave = "sine" }: NoteOpts = {}) {
  const a = audio();
  if (!a || !bus || !noise) return;
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

  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.3;
  lp.frequency.setValueAtTime(Math.min(freq * 3.2 * bright, 5000), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 180), t + dur * 0.7);
  const pre = a.createGain();
  pre.gain.value = 1 + rasp * 3;
  const post = a.createGain();
  post.gain.value = 1 / (1 + rasp * 1.5);
  if (rasp > 0) {
    const shaper = a.createWaveShaper();
    shaper.curve = clipCurve();
    pre.connect(shaper).connect(post);
  } else pre.connect(post);
  post.connect(lp).connect(out);

  const o = a.createOscillator();
  o.type = wave;
  o.frequency.setValueAtTime(freq, t);
  o.detune.value = rnd(-7, 7);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + Math.min(dur * 0.5, 0.4));
  o.connect(pre);
  o.start(t);
  o.stop(t + dur + 0.05);

  if (breath > 0) {
    const n = a.createBufferSource();
    n.buffer = noise;
    n.playbackRate.value = rnd(0.8, 1.2);
    const bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = Math.min(freq * rnd(1.5, 2.5), 3500);
    bp.Q.value = rnd(1.2, 3);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * breath, t + attack * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur * 0.45, 0.6));
    n.connect(bp).connect(g).connect(out);
    n.start(t, rnd(0, 0.4));
    n.stop(t + dur);
  }
}

// Pulsation grave, mate et brève.
function sub(at = 0, gain = 0.04) {
  note(any([55, 61.74, 69.3]), { at, dur: rnd(0.35, 0.6), gain, attack: 0.025, bright: 0.6, rasp: rnd(0.2, 0.6) });
}

// Position horizontale convertie en placement stéréo.
const panAt = (x?: number) => (typeof window === "undefined" || x === undefined ? 0 : (x / window.innerWidth) * 1.6 - 0.8);
// Registre selon la hauteur à l'écran : plus aigu en haut.
const highAt = (y?: number) => (typeof window === "undefined" || y === undefined ? 11 : 13 - Math.round((y / window.innerHeight) * 5));

export const sounds = {
  // survol d'une carte : petit son effacé, l'une de trois couleurs (verre, bois, souffle)
  hover: (x?: number, y?: number) => {
    const deg = highAt(y) + any([-1, 0, 0, 1]);
    const v = any(["verre", "bois", "souffle"] as const);
    if (v === "verre") note(pick(deg), { dur: rnd(0.6, 0.9), gain: 0.008, pan: panAt(x) + rnd(-0.1, 0.1), attack: 0.02, bright: 0.7 });
    if (v === "bois") note(pick(deg - 5), { dur: rnd(0.25, 0.4), gain: 0.011, pan: panAt(x), attack: 0.008, wave: "triangle", bright: 0.5, rasp: 0.3 });
    if (v === "souffle") note(pick(deg - 2), { dur: rnd(0.4, 0.6), gain: 0.007, pan: panAt(x), attack: 0.03, bright: 0.5, breath: 1.4 });
  },
  // clic : accord mat (quinte, quarte ou tierce), posé sur une pulsation, parfois rauque
  click: (x?: number) => {
    const root = any([3, 4, 5, 6]);
    const interval = any([2, 3, 3, 4]);
    const opts: NoteOpts = { pan: panAt(x), attack: rnd(0.03, 0.07), bright: rnd(0.45, 0.8), rasp: rnd(0, 0.5), breath: rnd(0, 0.9), wave: any(["sine", "triangle"] as const) };
    sub(0, rnd(0.025, 0.04));
    note(pick(root), { ...opts, dur: rnd(0.8, 1.3), gain: 0.016 });
    note(pick(root + interval), { ...opts, at: rnd(0.01, 0.05), dur: rnd(0.8, 1.2), gain: 0.011 });
  },
  // barres de menu (haut et bas) : note grave et mate, à la quinte inférieure, sur la pulsation
  bar: (x?: number) => {
    const root = any([0, 1, 2]);
    sub(0, rnd(0.04, 0.055));
    note(pick(root) / 2, { dur: rnd(0.6, 0.9), gain: 0.03, pan: panAt(x), attack: rnd(0.02, 0.04), wave: any(["sine", "triangle"] as const), bright: rnd(0.4, 0.6), rasp: rnd(0.2, 0.5), breath: rnd(0.2, 0.6) });
    note((pick(root) / 2) * 1.5, { at: rnd(0.02, 0.05), dur: rnd(0.5, 0.8), gain: 0.014, pan: panAt(x), attack: 0.04, bright: 0.45 });
  },
  // interrupteur : note qui gonfle et glisse vers l'aigu (personnes) ou le grave (objet), avec souffle
  toggle: (on: boolean, x?: number) => {
    const lo = any([2, 3, 4]);
    const hi = lo + any([3, 4]);
    note(on ? pick(lo) : pick(hi), { glide: on ? pick(hi) : pick(lo), dur: rnd(1.2, 1.7), gain: 0.022, pan: panAt(x), attack: 0.1, bright: 0.6, rasp: rnd(0.2, 0.6), breath: rnd(0.4, 1) });
  },
  // ouverture d'un projet : pulsation, accord grave qui s'élargit, parfois un tintement lointain
  open: (x?: number) => {
    const base = panAt(x);
    const root = any([0, 1, 2]);
    const chord = any([[0, 3], [0, 2, 4], [0, 3, 5], [0, 4]] as const);
    sub(0, 0.045);
    chord.forEach((d, i) =>
      note(pick(root + d), {
        at: i * rnd(0.03, 0.07),
        dur: rnd(2.2, 3),
        gain: 0.018 - i * 0.003,
        pan: base - 0.4 + (0.8 * i) / Math.max(1, chord.length - 1),
        attack: 0.14,
        bright: rnd(0.45, 0.7),
        rasp: rnd(0.1, 0.5),
        breath: rnd(0.2, 0.8),
      })
    );
    if (Math.random() < 0.6) note(pick(any([11, 12, 13])), { at: rnd(0.25, 0.45), dur: 1.8, gain: 0.006, pan: base + rnd(-0.3, 0.3), attack: 0.04, bright: 0.6 });
  },
};
