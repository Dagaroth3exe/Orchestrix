"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Btn, PageHeader } from "@/app/components/kit";
import { cn } from "@/lib/utils";

const PRESETS = [5, 15, 25, 45, 60];
const R = 140;
const C = 2 * Math.PI * R;

function chime() {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ac = new Ctx();
  // two soft bell partials
  [528, 792].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ac.destination);
    const t = ac.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    osc.start(t);
    osc.stop(t + 2.3);
  });
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function FocusPage() {
  const [sessionMin, setSessionMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [sound, setSound] = useState(true);

  // tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // phase change when the clock hits zero
  useEffect(() => {
    if (!running || timeLeft > 0) return;
    const t = setTimeout(() => {
      if (sound) chime();
      if (!isBreak) {
        setCompleted((c) => c + 1);
        setIsBreak(true);
        setTimeLeft(breakMin * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(sessionMin * 60);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [running, timeLeft, isBreak, sessionMin, breakMin, sound]);

  // show the clock in the tab title while running
  useEffect(() => {
    const original = document.title;
    if (running) document.title = `${fmt(timeLeft)} · ${isBreak ? "Rest" : "Focus"} — Orchestrix`;
    return () => { document.title = original; };
  }, [running, timeLeft, isBreak]);

  const total = (isBreak ? breakMin : sessionMin) * 60;
  const progress = total ? (total - timeLeft) / total : 0;

  const setSession = (m: number) => {
    setSessionMin(m);
    if (!running && !isBreak) setTimeLeft(m * 60);
  };
  const setBreak = (m: number) => {
    setBreakMin(m);
    if (!running && isBreak) setTimeLeft(m * 60);
  };
  const reset = () => {
    setRunning(false);
    setIsBreak(false);
    setTimeLeft(sessionMin * 60);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageHeader
        title="Focus"
        description={`${isBreak ? "Break" : `Session ${completed + 1}`} · ${completed} completed today`}
      />

      <div className="grid flex-1 gap-4 p-5 md:p-8 lg:grid-cols-2">
        {/* Timer */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface-2/40 p-6 md:p-8">
          <div className="relative grid aspect-square w-full max-w-[22rem] place-items-center">
            {/* soft aura that breathes with the music */}
            <div
              className={cn(
                "absolute inset-[14%] rounded-full blur-2xl transition-colors duration-700",
                isBreak ? "bg-mint/40" : "bg-accent/20",
                running ? "animate-breathe" : "opacity-40"
              )}
            />
            {/* tick marks: 60 beats around the dial */}
            <svg viewBox="0 0 300 300" className="absolute inset-0 size-full" aria-hidden>
              {Array.from({ length: 60 }).map((_, i) => {
                const a = (i / 60) * Math.PI * 2;
                const long = i % 5 === 0;
                const r1 = long ? 118 : 122;
                return (
                  <line
                    key={i}
                    x1={150 + Math.sin(a) * r1}
                    y1={150 - Math.cos(a) * r1}
                    x2={150 + Math.sin(a) * 127}
                    y2={150 - Math.cos(a) * 127}
                    stroke={i === (60 - (timeLeft % 60)) % 60 && running ? "var(--accent)" : "var(--line-strong)"}
                    strokeWidth={long ? 2 : 1}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <svg viewBox="0 0 300 300" className="absolute inset-0 size-full -rotate-90">
              <circle cx="150" cy="150" r={R} fill="none" stroke="var(--line-strong)" strokeWidth="2" />
              <motion.circle
                cx="150"
                cy="150"
                r={R}
                fill="none"
                stroke={isBreak ? "var(--mint)" : "var(--accent)"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={C}
                animate={{ strokeDashoffset: C * (1 - progress) }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <div className="relative flex flex-col items-center text-center">
              <Metronome running={running} rest={isBreak} />
              <p className="font-display text-[clamp(3.2rem,11vw,5rem)] leading-none font-bold tracking-[-0.04em] text-fg tabular-nums">
                {fmt(timeLeft)}
              </p>
              <div className="mt-3 h-4">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={running ? "playing" : "idle"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.5 }}
                    className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle"
                  >
                    {running ? (isBreak ? "on a break" : "focusing") : isBreak ? "break ready" : "ready"}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Btn variant="ghost" size="icon" onClick={reset} aria-label="Reset" className="border border-line">
              <RotateCcw />
            </Btn>
            <Btn variant={running ? "primary" : "accent"} onClick={() => setRunning((r) => !r)} className="h-12 min-w-36 px-6 text-base">
              {running ? <Pause /> : <Play />}
              {running ? "Pause" : timeLeft < total ? "Resume" : "Start"}
            </Btn>
            <Btn
              variant="ghost"
              size="icon"
              onClick={() => setSound((s) => !s)}
              aria-label={sound ? "Mute chime" : "Unmute chime"}
              className="border border-line"
            >
              {sound ? <Volume2 /> : <VolumeX />}
            </Btn>
          </div>
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-surface-2/40 p-5">
            <p className="text-[15px] font-semibold text-fg">Session length</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => setSession(m)}
                  disabled={running}
                  className={cn(
                    "h-10 rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    sessionMin === m ? "bg-fg text-bg" : "bg-surface text-muted hover:text-fg"
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-line bg-surface-2/40 p-5">
            <Slider label="Focus" value={sessionMin} min={1} max={90} onChange={setSession} disabled={running} />
            <Slider label="Break" value={breakMin} min={1} max={30} onChange={setBreak} disabled={running} />
          </div>

          {/* Today — fills the remaining height so both columns end together */}
          <div className="flex flex-1 flex-col rounded-2xl border border-line bg-surface-2/40 p-5">
            <p className="text-[15px] font-semibold text-fg">Today</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface p-4">
                <p className="font-display text-3xl font-bold tracking-[-0.03em] text-fg tabular-nums">{completed}</p>
                <p className="text-xs text-muted">sessions completed</p>
              </div>
              <div className="rounded-xl bg-surface p-4">
                <p className="font-display text-3xl font-bold tracking-[-0.03em] text-fg tabular-nums">{completed * sessionMin}</p>
                <p className="text-xs text-muted">minutes focused</p>
              </div>
            </div>
            <div className="mt-auto flex items-center gap-1.5 pt-5" aria-label={`${completed} sessions completed`}>
              {Array.from({ length: Math.max(8, completed + 1) }).map((_, i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-500", i < completed ? "bg-accent" : "bg-line-strong")} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-butter p-5 text-butter-fg">
            <p className="text-sm font-semibold">Tip</p>
            <p className="mt-1 text-sm leading-relaxed">
              Close distracting tabs and write down the one task you&apos;ll work on before you start.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A little metronome whose arm ticks once per second while the timer runs. */
function Metronome({ running, rest }: { running: boolean; rest: boolean }) {
  return (
    <svg viewBox="0 0 60 56" className="mb-3 h-12 w-auto" aria-hidden>
      <path d="M18 52 L26 6 Q30 2 34 6 L42 52 Z" fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeLinejoin="round" />
      <line x1="14" x2="46" y1="52" y2="52" stroke="var(--line-strong)" strokeWidth="2" strokeLinecap="round" />
      <motion.g
        style={{ originX: 0.5, originY: 1 }}
        animate={running ? { rotate: [-26, 26] } : { rotate: 0 }}
        transition={running ? { duration: 1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } : { duration: 0.4 }}
      >
        <line x1="30" x2="30" y1="46" y2="8" stroke={rest ? "var(--mint)" : "var(--accent)"} strokeWidth="2.2" strokeLinecap="round" />
        <rect x="26.5" y="18" width="7" height="6" rx="1.5" fill={rest ? "var(--mint)" : "var(--accent)"} />
      </motion.g>
      <circle cx="30" cy="46" r="2.4" fill="var(--fg)" />
    </svg>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm font-medium text-fg">{label}</span>
        <span className="text-sm text-muted tabular-nums">{value} min</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}
