"use client";

import { useEffect, useRef } from "react";

/**
 * "The Score" — the Orchestrix ambient background.
 *
 * Faint musical staves scroll slowly across a dotted stage, with notes and
 * bar lines generated deterministically so the score never repeats. The
 * cursor is the conductor's baton: staff lines near it resonate like plucked
 * strings and nearby notes light up. A click is a downbeat that sends a wave
 * across the staves. Pure canvas; pauses when hidden, static for
 * reduced-motion users.
 */

const LINE_GAP = 10; // distance between the 5 staff lines
const STAVE_SPACING = 150; // distance between staves
const BAR = 280; // bar width in px
const BEAT = BAR / 4;
const SPEED = 0.012; // px per ms
const BATON_R = 170;
const WAVE_LIFE = 2200;

// deterministic pseudo-random in [0,1)
function hash(a: number, b: number, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export default function ScoreBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let scroll = 0;
    const waves: { x: number; y: number; t0: number }[] = [];
    const baton = { x: -9999, y: -9999, tx: -9999, ty: -9999, s: 0, target: 0 };
    const col = { line: "244 241 236", a: 0.05, note: "238 149 128" };

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      col.line = cs.getPropertyValue("--staff-line").trim() || col.line;
      col.a = parseFloat(cs.getPropertyValue("--staff-alpha")) || col.a;
      col.note = cs.getPropertyValue("--staff-note").trim() || col.note;
      if (reduceMotion) draw(0);
    };
    const themeObserver = new MutationObserver(readColors);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    /** vertical displacement of a point on a staff line */
    function disp(x: number, y: number, now: number, live: { x: number; y: number; age: number }[]) {
      let dy = 0;
      if (baton.s > 0.01) {
        const d = Math.hypot(x - baton.x, y - baton.y);
        if (d < BATON_R) {
          const k = 1 - d / BATON_R;
          dy += Math.sin(x * 0.09 - now * 0.022) * k * k * 5 * baton.s;
        }
      }
      for (const wv of live) {
        const band = Math.hypot(x - wv.x, y - wv.y) - wv.age * 700;
        if (Math.abs(band) < 50) {
          dy += Math.sin(band * 0.14) * 4 * Math.cos((band / 50) * (Math.PI / 2)) * (1 - wv.age);
        }
      }
      return dy;
    }

    function draw(now: number) {
      ctx!.clearRect(0, 0, w, h);
      const live = waves
        .map((wv) => ({ x: wv.x, y: wv.y, age: Math.max(0, (now - wv.t0) / WAVE_LIFE) }))
        .filter((wv) => wv.age < 1);

      ctx!.lineWidth = 1;
      for (let s = 0, y0 = 70; y0 < h + STAVE_SPACING; s++, y0 += STAVE_SPACING) {
        const stave = y0;
        const offset = scroll * (s % 2 ? 1 : 0.82); // alternate staves drift at slightly different tempi

        // staff lines
        ctx!.strokeStyle = `rgb(${col.line} / ${col.a * 1.6})`;
        for (let i = 0; i < 5; i++) {
          const ly = stave + i * LINE_GAP;
          ctx!.beginPath();
          for (let x = 0; x <= w + 6; x += 6) {
            const y = ly + disp(x, ly, now, live);
            if (x === 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
          }
          ctx!.stroke();
        }

        // bar lines
        ctx!.strokeStyle = `rgb(${col.line} / ${col.a * 2})`;
        for (let x = -(offset % BAR); x < w; x += BAR) {
          ctx!.beginPath();
          ctx!.moveTo(x, stave);
          ctx!.lineTo(x, stave + 4 * LINE_GAP);
          ctx!.stroke();
        }

        // notes, one possible note per beat
        const firstBeat = Math.floor(offset / BEAT);
        for (let b = firstBeat; b * BEAT - offset < w + BEAT; b++) {
          if (b % 4 === 0) continue; // keep the downbeat clear of the bar line
          const r = hash(s + 1, b);
          if (r > 0.5) continue;
          const x = b * BEAT - offset + BEAT * 0.15;
          const step = Math.floor(hash(s + 7, b, 3) * 9); // 0 = bottom line … 8 = top line
          const ny = stave + 4 * LINE_GAP - step * (LINE_GAP / 2);
          const y = ny + disp(x, ny, now, live);
          const accent = hash(s + 3, b, 9) < 0.14;
          const near = baton.s > 0.01 ? Math.max(0, 1 - Math.hypot(x - baton.x, y - baton.y) / BATON_R) * baton.s : 0;

          const alpha = accent ? 0.55 + near * 0.4 : col.a * 3 + near * 0.55;
          const rgb = accent || near > 0.25 ? col.note : col.line;
          ctx!.fillStyle = `rgb(${rgb} / ${alpha})`;
          ctx!.strokeStyle = `rgb(${rgb} / ${alpha})`;

          ctx!.beginPath();
          ctx!.ellipse(x, y, 5.2 + near * 1.5, 3.8 + near * 1.1, -0.35, 0, Math.PI * 2);
          ctx!.fill();

          // stem (+ flag on some eighth notes)
          const up = step < 4;
          const sx = up ? x + 4.6 : x - 4.6;
          const sy2 = up ? y - 30 : y + 30;
          ctx!.beginPath();
          ctx!.moveTo(sx, y);
          ctx!.lineTo(sx, sy2);
          if (hash(s, b, 5) < 0.3) {
            ctx!.quadraticCurveTo(sx + 8, up ? sy2 + 8 : sy2 - 8, sx + 6, up ? sy2 + 16 : sy2 - 16);
          }
          ctx!.stroke();
        }
      }

      // downbeat rings
      for (const wv of live) {
        ctx!.strokeStyle = `rgb(${col.note} / ${0.3 * (1 - wv.age)})`;
        ctx!.beginPath();
        ctx!.arc(wv.x, wv.y, wv.age * 700, 0, Math.PI * 2);
        ctx!.stroke();
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduceMotion) draw(0);
    };

    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      scroll += dt * SPEED;
      baton.x += (baton.tx - baton.x) * 0.12;
      baton.y += (baton.ty - baton.y) * 0.12;
      baton.s += (baton.target - baton.s) * 0.06;
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      baton.tx = e.clientX - rect.left;
      baton.ty = e.clientY - rect.top;
      if (baton.x < -9000) { baton.x = baton.tx; baton.y = baton.ty; }
      baton.target = 1;
    };
    const onLeave = () => { baton.target = 0; };
    const onDown = (e: PointerEvent) => {
      if (reduceMotion) return;
      const rect = canvas.getBoundingClientRect();
      waves.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t0: performance.now() });
      if (waves.length > 4) waves.shift();
    };
    const onVisibility = () => {
      if (reduceMotion) return;
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); }
    };

    readColors();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 z-0 bg-bg">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
