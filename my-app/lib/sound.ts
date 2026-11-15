"use client";

/**
 * Orchestrix sound engine — cinematic, synthesized with Web Audio (no files).
 *
 * Used only for the desktop navbar. Each section owns a degree of D natural
 * minor: hovering swells a low string pad on it, clicking lands a short brass
 * "hit" over a sub-bass, all through a generated concert-hall reverb.
 * Audio starts after the first user gesture; the on/off choice is remembered.
 */

const STORAGE_KEY = "orchestrix-sound";
const EVENT = "orchestrix-sound";

// D natural minor (Aeolian), from D2 upward: D E F G A Bb C D …
const MINOR = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19];
const D2 = 73.42;
const freqOf = (degree: number, octave = 0) => D2 * Math.pow(2, (MINOR[Math.max(0, Math.min(MINOR.length - 1, degree))] + octave * 12) / 12);

// each nav section's chord root + third + fifth, a dark progression: i – VI – III – VII – v – iv
const SECTION_CHORDS: number[][] = [
  [0, 2, 4], // Dm
  [5, 7, 9], // Bb
  [2, 4, 6], // F
  [6, 8, 10], // C
  [4, 6, 8], // Am
  [3, 5, 7], // Gm
];

let ctx: AudioContext | null = null;
let bus: GainNode | null = null; // dry + reverb send
let lastHoverAt = 0;

/** Sounds are a desktop nicety: only devices with a hovering mouse/trackpad get them. */
export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth >= 768;
}

/* ───────── preference (shared store, works with useSyncExternalStore) ───────── */

export function isSoundOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
  if (on) sfx.toggleOn();
}

export function subscribeSound(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/* ───────── audio graph ───────── */

/** A decaying stereo noise burst works as a convincing hall impulse response. */
function hallImpulse(ac: AudioContext, seconds = 3.4) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2) * (t < 0.01 ? t / 0.01 : 1);
    }
  }
  return buf;
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.connect(ctx.destination);

    bus = ctx.createGain();
    bus.gain.value = 0.9;

    const dry = ctx.createGain();
    dry.gain.value = 0.55;
    const reverb = ctx.createConvolver();
    reverb.buffer = hallImpulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.6;

    bus.connect(dry);
    dry.connect(comp);
    bus.connect(reverb);
    reverb.connect(wet);
    wet.connect(comp);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call from a user gesture so later sounds are allowed to play. */
export function unlockAudio() {
  if (isSoundOn() && isDesktop()) ensureContext();
}

function ready(): AudioContext | null {
  if (!isSoundOn() || !isDesktop()) return null;
  const ac = ensureContext();
  return ac && bus && ac.state === "running" ? ac : null;
}

/** Low string pad: detuned saws through a soft low-pass, slow swell, long release. */
function strings(freq: number, { volume = 0.05, attack = 0.35, hold = 0.5, release = 2.2, pan = 0, cutoff = 900 } = {}) {
  const ac = ready();
  if (!ac || !bus) return;
  const t = ac.currentTime;

  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(volume, t + attack);
  env.gain.setValueAtTime(volume, t + attack + hold);
  env.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);

  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  filter.Q.value = 0.7;

  const panner = ac.createStereoPanner();
  panner.pan.value = pan;
  filter.connect(env);
  env.connect(panner);
  panner.connect(bus);

  // slow vibrato shared by the section
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.value = 5.2;
  lfoGain.gain.value = freq * 0.004;
  lfo.connect(lfoGain);

  const end = t + attack + hold + release + 0.1;
  [-7, 0, 7].forEach((cents) => {
    const o = ac.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = freq;
    o.detune.value = cents;
    lfoGain.connect(o.frequency);
    o.connect(filter);
    o.start(t);
    o.stop(end);
  });
  lfo.start(t);
  lfo.stop(end);
}

/** Brass hit: bright attack whose filter snaps shut, plus a sub-bass thump. */
function brassHit(freqs: number[], { volume = 0.07, pan = 0 } = {}) {
  const ac = ready();
  if (!ac || !bus) return;
  const t = ac.currentTime;

  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(volume, t + 0.03);
  env.gain.exponentialRampToValueAtTime(volume * 0.35, t + 0.45);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);

  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(350, t);
  filter.frequency.exponentialRampToValueAtTime(2400, t + 0.06);
  filter.frequency.exponentialRampToValueAtTime(500, t + 0.9);

  const panner = ac.createStereoPanner();
  panner.pan.value = pan;
  filter.connect(env);
  env.connect(panner);
  panner.connect(bus);

  freqs.forEach((f) => {
    [-5, 5].forEach((cents) => {
      const o = ac.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = cents;
      o.connect(filter);
      o.start(t);
      o.stop(t + 2.7);
    });
  });

  // sub-bass: a sine dropping slightly in pitch, like a low drum under the brass
  const sub = ac.createOscillator();
  const subEnv = ac.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(freqs[0] / 2, t);
  sub.frequency.exponentialRampToValueAtTime(freqs[0] / 2.2, t + 1.2);
  subEnv.gain.setValueAtTime(0.0001, t);
  subEnv.gain.exponentialRampToValueAtTime(volume * 2.2, t + 0.02);
  subEnv.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  sub.connect(subEnv);
  subEnv.connect(bus);
  sub.start(t);
  sub.stop(t + 1.9);
}

/* ───────── public sound vocabulary ───────── */

export const sfx = {
  /** Hovering a navbar item — a low string swell on that section's root and fifth. */
  navHover(index: number) {
    const now = performance.now();
    if (now - lastHoverAt < 140) return; // let each swell breathe
    lastHoverAt = now;
    const [root, , fifth] = SECTION_CHORDS[index % SECTION_CHORDS.length];
    const pan = (index - 2) * 0.22;
    strings(freqOf(root, 1), { volume: 0.035, pan, hold: 0.25, release: 1.8 });
    strings(freqOf(fifth, 1), { volume: 0.022, pan, hold: 0.25, release: 1.8 });
  },
  /** Clicking a navbar item — a brass hit on that section's chord. */
  nav(index: number) {
    const chord = SECTION_CHORDS[index % SECTION_CHORDS.length];
    const pan = (index - 2) * 0.22;
    brassHit(chord.map((d) => freqOf(d, 1)), { volume: 0.05, pan });
    strings(freqOf(chord[0], 2), { volume: 0.02, attack: 0.6, hold: 0.4, release: 2.6, pan, cutoff: 1400 });
  },
  /** Confirmation that sound was switched on — a quiet low swell. */
  toggleOn() {
    ensureContext();
    setTimeout(() => strings(freqOf(0, 1), { volume: 0.03, hold: 0.2, release: 1.6 }), 40);
  },
};
