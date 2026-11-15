"use client";

import * as THREE from "three";

/**
 * Procedural textures for the Listening Room — generated once on a canvas,
 * so the scene needs no image downloads beyond the album covers.
 */

const cache = new Map<string, THREE.Texture>();

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function finish(c: HTMLCanvasElement, opts: { srgb?: boolean; repeat?: [number, number]; aniso?: number } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...opts.repeat);
  }
  t.anisotropy = opts.aniso ?? 8;
  t.needsUpdate = true;
  return t;
}

function memo(key: string, make: () => THREE.Texture) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key)!;
}

/** Dark walnut: long wavy grain lines, colour variation, and fine pores. */
export function walnutTexture(base = "#3a2619", light = "#5a3d28") {
  return memo(`walnut-${base}`, () => {
    const [c, g] = canvas(1024, 512);
    g.fillStyle = base;
    g.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 160; i++) {
      const y0 = Math.random() * 512;
      const amp = 4 + Math.random() * 14;
      const freq = 0.004 + Math.random() * 0.01;
      const phase = Math.random() * 10;
      g.strokeStyle = Math.random() < 0.5 ? light : "#1f140c";
      g.globalAlpha = 0.06 + Math.random() * 0.16;
      g.lineWidth = 0.6 + Math.random() * 2.4;
      g.beginPath();
      for (let x = 0; x <= 1024; x += 8) {
        const y = y0 + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1) * amp * 0.25;
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 0.05;
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = Math.random() < 0.5 ? "#000" : light;
      g.fillRect(Math.random() * 1024, Math.random() * 512, 1 + Math.random() * 2, 1);
    }
    g.globalAlpha = 1;
    return finish(c, { repeat: [1, 1] });
  });
}

/** Horizontal brushed-aluminium streaks (used on the platter rim & tonearm). */
export function brushedTexture() {
  return memo("brushed", () => {
    const [c, g] = canvas(512, 256);
    g.fillStyle = "#9a9a9c";
    g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 2600; i++) {
      const v = 120 + Math.floor(Math.random() * 90);
      g.strokeStyle = `rgb(${v},${v},${v + 3})`;
      g.globalAlpha = 0.18;
      g.lineWidth = Math.random() * 1.2;
      const y = Math.random() * 256;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y + (Math.random() - 0.5) * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    return finish(c, { repeat: [3, 1] });
  });
}

/** Vinyl surface: concentric grooves, the run-out area and a lead-in ring. Drawn in the disc's own XY space. */
export function grooveTexture() {
  return memo("grooves", () => {
    const S = 1024;
    const [c, g] = canvas(S, S);
    g.fillStyle = "#0b0b0c";
    g.fillRect(0, 0, S, S);
    const cx = S / 2;
    const R = S / 2;
    for (let r = R * 0.36; r < R * 0.985; r += 1.15) {
      const band = Math.sin(r * 0.045) * 0.5 + 0.5; // tracks between songs read as subtle bands
      const v = 16 + Math.floor(Math.random() * 7 + band * 6);
      g.strokeStyle = `rgb(${v},${v},${v + 1})`;
      g.lineWidth = 0.8;
      g.beginPath();
      g.arc(cx, cx, r, 0, Math.PI * 2);
      g.stroke();
    }
    // lead-in & run-out: smooth, slightly glossier rings
    g.strokeStyle = "#202022";
    g.lineWidth = R * 0.02;
    g.beginPath();
    g.arc(cx, cx, R * 0.975, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = R * 0.03;
    g.beginPath();
    g.arc(cx, cx, R * 0.37, 0, Math.PI * 2);
    g.stroke();
    return finish(c, { aniso: 16 });
  });
}

/** Height map for the grooves so light catches them (used as a bump map). */
export function grooveBump() {
  return memo("groove-bump", () => {
    const S = 1024;
    const [c, g] = canvas(S, S);
    g.fillStyle = "#808080";
    g.fillRect(0, 0, S, S);
    const cx = S / 2;
    for (let r = (S / 2) * 0.37; r < (S / 2) * 0.97; r += 2.2) {
      g.strokeStyle = r % 4.4 < 2.2 ? "#9a9a9a" : "#666";
      g.lineWidth = 1.1;
      g.beginPath();
      g.arc(cx, cx, r, 0, Math.PI * 2);
      g.stroke();
    }
    return finish(c, { srgb: false, aniso: 16 });
  });
}

/** Felt mat with fine fibres. */
export function feltTexture() {
  return memo("felt", () => {
    const [c, g] = canvas(512, 512);
    g.fillStyle = "#161616";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 14000; i++) {
      const v = 18 + Math.floor(Math.random() * 18);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(Math.random() * 512, Math.random() * 512, 1, 1 + Math.random() * 2);
    }
    return finish(c);
  });
}

/** Engraved brass badge for the deck. */
export function badgeTexture() {
  return memo("badge", () => {
    const [c, g] = canvas(1024, 192);
    const grad = g.createLinearGradient(0, 0, 0, 192);
    grad.addColorStop(0, "#5a4521");
    grad.addColorStop(0.5, "#9c7a3c");
    grad.addColorStop(1, "#4a381b");
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 192);
    g.font = "600 96px Georgia, 'Times New Roman', serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "rgba(0,0,0,0.45)";
    g.fillText("O R C H E S T R I X", 514, 100);
    g.fillStyle = "#e9d3a0";
    g.fillText("O R C H E S T R I X", 512, 96);
    return finish(c);
  });
}

/** Small printed legend ("33 · 45", "START/STOP"). */
export function legendTexture(text: string) {
  return memo(`legend-${text}`, () => {
    const [c, g] = canvas(256, 64);
    g.clearRect(0, 0, 256, 64);
    g.font = "600 30px ui-monospace, Menlo, monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#b8ab95";
    g.fillText(text, 128, 34);
    return finish(c);
  });
}
