"use client";

/* eslint-disable @next/next/no-img-element -- album covers come from Spotify's CDN */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Btn, Equalizer } from "@/app/components/kit";
import type { SceneHandle } from "@/app/components/listening/TurntableScene";
import { RECORDS, SIDE_SECONDS, type RecordItem } from "@/lib/records";
import {
  disposeVinylAudio,
  isVinylFxOn,
  needleDrop,
  needleLift,
  setVinylFxOn,
  startCrackle,
  stopCrackle,
  subscribeVinylFx,
  unlockVinylAudio,
} from "@/lib/vinylAudio";
import { cn } from "@/lib/utils";

const TurntableScene = dynamic(() => import("@/app/components/listening/TurntableScene"), { ssr: false });

/* ════════════════════════ Spotify iFrame API ════════════════════════ */

type Playback = { isPaused: boolean; position: number; duration: number };
type SpotifyController = {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  destroy: () => void;
  addListener: (event: string, cb: (e: { data: Playback }) => void) => void;
};
type SpotifyAPI = {
  createController: (el: HTMLElement, opts: { uri: string; width: string | number; height: number }, cb: (c: SpotifyController) => void) => void;
};
type SpotifyWindow = Window & { onSpotifyIframeApiReady?: (api: SpotifyAPI) => void; __spotifyApi?: Promise<SpotifyAPI> };

function loadSpotifyApi(): Promise<SpotifyAPI> {
  const w = window as SpotifyWindow;
  if (!w.__spotifyApi) {
    w.__spotifyApi = new Promise((resolve) => {
      w.onSpotifyIframeApiReady = (api) => resolve(api);
      const s = document.createElement("script");
      s.src = "https://open.spotify.com/embed/iframe-api/v1";
      s.async = true;
      document.body.appendChild(s);
    });
  }
  return w.__spotifyApi;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const N = RECORDS.length;

/* ════════════════════════ page ════════════════════════ */

export default function RecordsPage() {
  const sceneRef = useRef<SceneHandle>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  const [hovered, setHovered] = useState<number | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [needleDown, setNeedleDown] = useState(false);
  const [busy, setBusy] = useState(false);
  const currentRef = useRef<number | null>(null);
  const needleRef = useRef(false);
  const busyRef = useRef(false);
  const pendingRef = useRef<number | null | undefined>(undefined);

  const embedRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const advancedFor = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [playback, setPlayback] = useState<Playback>({ isPaused: true, position: 0, duration: 0 });
  const [minuteSides, setMinuteSides] = useState(true);
  const fxOn = useSyncExternalStore(subscribeVinylFx, isVinylFxOn, () => true);

  const record: RecordItem | null = current === null ? null : RECORDS[current];
  const shown: RecordItem | null = hovered !== null ? RECORDS[hovered] : record;

  useEffect(() => {
    const t = setTimeout(() => setWebgl(hasWebGL()), 0);
    return () => clearTimeout(t);
  }, []);

  /* ── Spotify embed ── */
  useEffect(() => {
    let cancelled = false;
    loadSpotifyApi().then((api) => {
      if (cancelled || !embedRef.current) return;
      const host = document.createElement("div");
      embedRef.current.appendChild(host);
      api.createController(host, { uri: RECORDS[0].uri, width: "100%", height: 80 }, (c) => {
        if (cancelled) { c.destroy(); return; }
        controllerRef.current = c;
        c.addListener("ready", () => setReady(true));
        c.addListener("playback_update", (e) => setPlayback(e.data));
      });
    });
    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
      disposeVinylAudio();
    };
  }, []);

  /* ════════ needle & record sequencing (strictly one thing at a time) ════════ */

  const lower = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene) return;
    startCrackle(); // surface noise fades in as the stylus approaches the groove
    await scene.lowerNeedle();
    needleDrop();
    needleRef.current = true;
    setNeedleDown(true);
    controllerRef.current?.play();
  }, []);

  const raise = useCallback(async () => {
    const scene = sceneRef.current;
    controllerRef.current?.pause();
    needleRef.current = false;
    setNeedleDown(false);
    needleLift();
    stopCrackle(0.8);
    await scene?.raiseNeedle();
  }, []);

  const switchTo = useCallback(async (i: number | null) => {
    unlockVinylAudio();
    const scene = sceneRef.current;
    if (!scene) {
      // no WebGL: skip the choreography and just play through Spotify
      const c = controllerRef.current;
      if (i === null) { c?.pause(); currentRef.current = null; setCurrent(null); setNeedleDown(false); needleRef.current = false; return; }
      if (i === currentRef.current) { if (needleRef.current) c?.pause(); else c?.play(); needleRef.current = !needleRef.current; setNeedleDown(needleRef.current); return; }
      c?.loadUri(RECORDS[i].uri);
      c?.play();
      advancedFor.current = null;
      currentRef.current = i;
      setCurrent(i);
      needleRef.current = true;
      setNeedleDown(true);
      return;
    }
    if (busyRef.current) { pendingRef.current = i; return; } // rapid clicks: the last choice wins

    busyRef.current = true;
    setBusy(true);
    try {
      if (i !== null && i === currentRef.current) {
        // same record: lift or lower the needle
        if (needleRef.current) await raise();
        else await lower();
        return;
      }
      // 1 · stylus up, platter stops, record goes home
      if (currentRef.current !== null) {
        if (needleRef.current) await raise();
        scene.setSpinning(false);
        await scene.unload();
        currentRef.current = null;
        setCurrent(null);
      }
      // 2 · only then the next record
      if (i !== null) {
        controllerRef.current?.loadUri(RECORDS[i].uri);
        advancedFor.current = null;
        setPlayback({ isPaused: true, position: 0, duration: 0 });
        currentRef.current = i;
        setCurrent(i);
        await scene.load(i, () => scene.setSpinning(true));
        await lower();
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    const p = pendingRef.current;
    pendingRef.current = undefined;
    if (p !== undefined && p !== currentRef.current) void switchTo(p);
  }, [lower, raise]);

  const togglePlay = useCallback(() => void switchTo(currentRef.current ?? 0), [switchTo]);
  const next = useCallback(() => void switchTo(currentRef.current === null ? 0 : (currentRef.current + 1) % N), [switchTo]);
  const prev = useCallback(() => void switchTo(currentRef.current === null ? 0 : (currentRef.current - 1 + N) % N), [switchTo]);

  /* ── tonearm tracks the side; auto-advance after about a minute ── */
  const sideLength = minuteSides ? Math.min(SIDE_SECONDS * 1000, playback.duration || SIDE_SECONDS * 1000) : playback.duration;
  useEffect(() => {
    if (!needleDown || busy || !record || !sideLength) return;
    sceneRef.current?.setProgress(playback.position / sideLength);
  }, [playback.position, sideLength, needleDown, busy, record]);

  useEffect(() => {
    if (!record || playback.isPaused || busy) return;
    const atMinute = minuteSides && playback.position >= SIDE_SECONDS * 1000;
    const ended = playback.duration > 0 && playback.position >= playback.duration - 600;
    if ((atMinute || ended) && advancedFor.current !== record.id) {
      advancedFor.current = record.id;
      const t = setTimeout(next, 0);
      return () => clearTimeout(t);
    }
  }, [playback, minuteSides, record, busy, next]);

  /* ── keyboard ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.closest?.("input, textarea")) return;
      if (e.key === " ") {
        if (el?.closest?.("button")) return;
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key.toLowerCase() === "m") setVinylFxOn(!isVinylFxOn());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, next, prev]);

  const progress = record && sideLength ? Math.min(1, playback.position / sideLength) : 0;
  const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  const status = busy ? (needleDown ? "Lifting the needle…" : current === null ? "Returning the record…" : "Placing the record…") : record ? (needleDown ? "Now playing" : "Needle up") : "Platter empty";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* compact header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 md:px-8">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Your records · on vinyl</p>
          <h1 className="font-display text-3xl leading-tight font-semibold text-fg">Listening Room</h1>
        </div>
        <button
          onClick={() => { unlockVinylAudio(); setVinylFxOn(!fxOn); }}
          className={cn(
            "flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors",
            fxOn ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted hover:text-fg"
          )}
          title="Vinyl surface noise (M)"
          aria-pressed={fxOn}
        >
          {fxOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          Surface noise
        </button>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* ───────── 3D stage ───────── */}
        <section className="relative min-h-[18rem] overflow-hidden rounded-2xl border border-line bg-[radial-gradient(120%_90%_at_45%_25%,#1a1613_0%,#0d0b0a_70%)]">
          {webgl === false ? (
            <FallbackCrate current={current} onPick={(i) => void switchTo(i)} />
          ) : webgl ? (
            <TurntableScene
              records={RECORDS}
              apiRef={sceneRef}
              playing={needleDown}
              onHover={setHovered}
              onPick={(i) => void switchTo(i)}
              onReady={() => setSceneReady(true)}
            />
          ) : null}

          {/* loading veil */}
          <AnimatePresence>
            {webgl !== false && !sceneReady && (
              <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 grid place-items-center bg-[#0d0b0a]">
                <span className="flex items-center gap-3 text-sm text-muted"><Equalizer /> Setting up the turntable…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* hovered record caption */}
          <AnimatePresence>
            {hovered !== null && (
              <motion.div
                key={hovered}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="pointer-events-none absolute right-4 bottom-4 rounded-xl border border-line bg-surface/85 px-3.5 py-2 backdrop-blur-md"
              >
                <p className="font-display text-lg leading-tight font-semibold text-fg">{RECORDS[hovered].title}</p>
                <p className="text-xs text-muted">{RECORDS[hovered].artist} · click to play</p>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="pointer-events-none absolute top-3 left-4 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
            Drag to look around · hover the crate
          </p>
        </section>

        {/* ───────── side panel ───────── */}
        <aside className="flex min-h-0 flex-col gap-3">
          {/* now playing */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {shown && <img src={shown.cover} alt="" className="size-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">{hovered !== null ? "In the crate" : status}</p>
                <p className="truncate font-display text-xl leading-tight font-semibold text-fg">{shown ? shown.title : "Choose a record"}</p>
                <p className="truncate text-xs text-muted">{shown ? shown.artist : "Hover the crate, click a sleeve"}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Btn variant="ghost" size="icon" onClick={prev} aria-label="Previous record"><SkipBack /></Btn>
              <Btn variant="accent" onClick={togglePlay} className="size-12 rounded-full p-0" aria-label={needleDown ? "Lift the needle" : "Lower the needle"}>
                {needleDown ? <Pause className="!size-5" /> : <Play className="!size-5" />}
              </Btn>
              <Btn variant="ghost" size="icon" onClick={next} aria-label="Next record"><SkipForward /></Btn>
              <Btn variant="soft" size="sm" onClick={() => void switchTo(null)} disabled={current === null} aria-label="Return the record to the crate">
                <CornerDownLeft /> Return
              </Btn>
            </div>

            <div className="mt-3">
              <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-linear" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-subtle tabular-nums">
                <span>{fmt(record ? playback.position : 0)}</span>
                <label className="flex cursor-pointer items-center gap-1.5 text-muted">
                  <input type="checkbox" checked={minuteSides} onChange={(e) => setMinuteSides(e.target.checked)} className="accent-[var(--accent)]" />
                  1-minute sides
                </label>
                <span>{fmt(record ? sideLength : 0)}</span>
              </div>
            </div>
          </div>

          {/* official Spotify player — must stay visible */}
          <div className="rounded-2xl border border-line bg-surface p-3">
            <div ref={embedRef} className="min-h-20 overflow-hidden rounded-xl bg-surface-2 [&_iframe]:block [&_iframe]:rounded-xl" />
            <p className="mt-2 px-1 text-[11px] leading-snug text-subtle">
              {ready ? "Log in to Spotify in this browser for full tracks (otherwise previews). If a record doesn't start, press play here once." : "Connecting to Spotify…"}
            </p>
          </div>

          {/* liner notes */}
          <div className="hidden min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface p-4 lg:block">
            <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">Liner notes</p>
            {shown ? (
              <>
                <p className="mt-1.5 font-display text-lg leading-tight font-semibold text-fg">{shown.title}</p>
                <p className="text-xs text-muted">{shown.artist}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg/80">{shown.note}</p>
              </>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Hover a sleeve to slide it out and see the cover. Click to place the record, drop the needle, and listen. Space lifts the needle,
                ← → change records, M mutes the surface noise.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ════════════════════════ no-WebGL fallback ════════════════════════ */

function FallbackCrate({ current, onPick }: { current: number | null; onPick: (i: number) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
      <p className="max-w-sm text-sm text-muted">
        Your browser can&apos;t show the 3D turntable (WebGL is unavailable), but the records still play.
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {RECORDS.map((r, i) => (
          <button
            key={r.id}
            onClick={() => onPick(i)}
            className={cn("overflow-hidden rounded-lg ring-offset-2 ring-offset-bg transition-transform hover:-translate-y-1", current === i && "ring-2 ring-accent")}
            aria-label={`Play ${r.title} by ${r.artist}`}
          >
            <img src={r.cover} alt="" className="size-20 object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
