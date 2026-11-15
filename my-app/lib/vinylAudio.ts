"use client";

/**
 * Vinyl surface sounds for the Listening Room — synthesized, no audio files.
 *
 *  - crackle: a soft, continuous bed of hiss + randomized pops, looped
 *  - needleDrop: the low thump + tick when the stylus meets the groove
 *  - needleLift: a small click as the stylus leaves the record
 *
 * Runs in its own AudioContext, created on the first user interaction.
 * The on/off preference is remembered.
 */

const KEY = "orchestrix-vinyl-fx";
const EVENT = "orchestrix-vinyl-fx";

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let crackleSrc: AudioBufferSourceNode | null = null;
let crackleGain: GainNode | null = null;
let crackleBuf: AudioBuffer | null = null;

export function isVinylFxOn(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setVinylFxOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  if (!on) stopCrackle(0.2);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeVinylFx(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    out = ctx.createGain();
    out.gain.value = 1;
    // warm, slightly band-limited like a cartridge
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 7000;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 120;
    out.connect(hp).connect(lp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call from a click/keypress so later sounds may play. */
export function unlockVinylAudio() {
  ensure();
}

/** 6 seconds of surface noise: very quiet hiss, frequent tiny ticks, occasional deeper pops. */
function buildCrackle(ac: AudioContext): AudioBuffer {
  const seconds = 6;
  const len = ac.sampleRate * seconds;
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let brown = 0;
    for (let i = 0; i < len; i++) {
      // brownish hiss (rumble-free thanks to the high-pass)
      brown = (brown + (Math.random() * 2 - 1) * 0.02) * 0.995;
      d[i] = brown * 0.6 + (Math.random() * 2 - 1) * 0.004;
    }
    // ticks & pops
    const events = 70 + Math.floor(Math.random() * 30);
    for (let e = 0; e < events; e++) {
      const at = Math.floor(Math.random() * (len - 2000));
      const big = Math.random() < 0.08;
      const amp = (big ? 0.45 : 0.08 + Math.random() * 0.16) * (Math.random() < 0.5 ? -1 : 1);
      const decay = big ? 0.004 : 0.0009 + Math.random() * 0.0012; // seconds
      const n = Math.floor(decay * ac.sampleRate * 6);
      for (let k = 0; k < n; k++) {
        const env = Math.exp(-k / (decay * ac.sampleRate));
        d[at + k] += amp * env * (k % 2 ? 1 : -0.6) * (0.6 + Math.random() * 0.4);
      }
    }
  }
  return buf;
}

export function startCrackle(level = 0.16) {
  if (!isVinylFxOn()) return;
  const ac = ensure();
  if (!ac || !out) return;
  stopCrackle(0);
  crackleBuf ??= buildCrackle(ac);
  crackleSrc = ac.createBufferSource();
  crackleSrc.buffer = crackleBuf;
  crackleSrc.loop = true;
  crackleGain = ac.createGain();
  const t = ac.currentTime;
  crackleGain.gain.setValueAtTime(0.0001, t);
  crackleGain.gain.exponentialRampToValueAtTime(level, t + 1.8); // fade in gently as the stylus approaches the groove
  crackleSrc.connect(crackleGain).connect(out);
  crackleSrc.start(t, Math.random() * 5);
}

export function stopCrackle(fade = 0.6) {
  if (!ctx || !crackleSrc || !crackleGain) return;
  const src = crackleSrc;
  const g = crackleGain;
  const t = ctx.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.01, fade));
  src.stop(t + Math.max(0.02, fade) + 0.05);
  crackleSrc = null;
  crackleGain = null;
}

function noiseBurst(ac: AudioContext, at: number, dur: number, vol: number, freq: number) {
  const len = Math.floor(ac.sampleRate * dur);
  const b = ac.createBuffer(1, len, ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len / 5));
  const s = ac.createBufferSource();
  s.buffer = b;
  const f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = 1.2;
  const g = ac.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(out!);
  s.start(at);
}

/** Stylus meets the groove: a soft low thump with a little tick. */
export function needleDrop() {
  if (!isVinylFxOn()) return;
  const ac = ensure();
  if (!ac || !out) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(95, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.18);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.3);
  noiseBurst(ac, t, 0.05, 0.5, 2400);
  noiseBurst(ac, t + 0.09, 0.03, 0.18, 3200);
}

/** Stylus leaves the record. */
export function needleLift() {
  if (!isVinylFxOn()) return;
  const ac = ensure();
  if (!ac || !out) return;
  noiseBurst(ac, ac.currentTime, 0.035, 0.22, 2800);
}

export function disposeVinylAudio() {
  stopCrackle(0);
  void ctx?.close().catch(() => {});
  ctx = null;
  out = null;
  crackleBuf = null;
}
