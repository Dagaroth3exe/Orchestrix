"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

export default function FocusPage() {
  const router = useRouter();
  const [sessionDuration, setSessionDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(sessionDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevSessionDurationRef = useRef(sessionDuration);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Session/break ended
      if (!isBreak) {
        setSessionsCompleted((prev) => prev + 1);
        setIsBreak(true);
        setTimeLeft(breakDuration * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(sessionDuration * 60);
      }
      if (soundEnabled) {
        playNotificationSound();
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, sessionDuration, breakDuration, soundEnabled]);

  // Only update timeLeft when duration actually changes, not when pausing
  useEffect(() => {
    if (prevSessionDurationRef.current !== sessionDuration && !isRunning) {
      setTimeLeft(sessionDuration * 60);
    }
    prevSessionDurationRef.current = sessionDuration;
  }, [sessionDuration]);

  const playNotificationSound = () => {
    // Simple beep sound
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1000;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(sessionDuration * 60);
  };

  const progressPercentage =
    ((isBreak ? breakDuration * 60 : sessionDuration * 60) - timeLeft) /
    (isBreak ? breakDuration * 60 : sessionDuration * 60);

  return (
    <div className="w-full h-full flex flex-col bg-amber-50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#231E1F]/10">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-[#231E1F] hover:opacity-70 transition-opacity [font-family:var(--font-outfit)] font-semibold mb-4"
        >
          <ArrowLeft className="size-5" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl text-[#231E1F] font-semibold [font-family:var(--font-outfit)]">
          Focus Timer
        </h1>
        <p className="text-[#231E1F]/60 text-sm mt-2">
          {isBreak ? "Break Time" : "Focus Session"} • {sessionsCompleted}{" "}
          session{sessionsCompleted !== 1 ? "s" : ""} completed
        </p>
      </div>

      {/* Main Timer - two column layout */}
      <div className="flex-1 overflow-hidden p-8">
        <div className="flex gap-8 h-full max-w-4xl mx-auto">

          {/* Left column: Timer + Controls — always fully visible */}
          <div className="flex flex-col items-center justify-center gap-6 flex-1">
            {/* Status Indicator */}
            <div className="text-center">
              <p className="text-2xl text-[#231E1F]/60 font-semibold [font-family:var(--font-outfit)] mb-1">
                {isBreak ? "🎉 Break Time" : "🎯 Stay Focused"}
              </p>
              <p className="text-sm text-[#231E1F]/50 [font-family:var(--font-outfit)]">
                {sessionsCompleted} session{sessionsCompleted !== 1 ? "s" : ""} completed today
              </p>
            </div>

            {/* Timer Display Circle */}
            <div className="relative w-64 h-64 flex items-center justify-center shrink-0">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#231E1F"
                  strokeWidth="8"
                  opacity="0.1"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#231E1F"
                  strokeWidth="8"
                  strokeDasharray={`${progressPercentage * 565.48} 565.48`}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{ transition: "stroke-dasharray 1s linear" }}
                />
              </svg>
              <div className="text-center z-10">
                <div className="text-6xl font-bold text-[#231E1F] [font-family:var(--font-outfit)] tabular-nums">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 px-8 py-4 bg-[#231E1F] text-amber-50 rounded-2xl hover:bg-[#231E1F]/90 transition-colors font-semibold [font-family:var(--font-outfit)] text-lg"
              >
                {isRunning ? (
                  <>
                    <Pause className="size-6" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="size-6" />
                    Start
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                className="p-4 bg-[#231E1F]/10 text-[#231E1F] rounded-2xl hover:bg-[#231E1F]/20 transition-colors"
                title="Reset"
              >
                <RotateCcw className="size-6" />
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-4 bg-[#231E1F]/10 text-[#231E1F] rounded-2xl hover:bg-[#231E1F]/20 transition-colors"
                title={soundEnabled ? "Mute" : "Unmute"}
              >
                {soundEnabled ? (
                  <Volume2 className="size-6" />
                ) : (
                  <VolumeX className="size-6" />
                )}
              </button>
            </div>
          </div>

          {/* Right column: Settings — can scroll if needed */}
          <div className="flex flex-col gap-4 w-72 overflow-y-auto py-1">
            {/* Quick Presets */}
            <div className="bg-white rounded-2xl p-6 border border-[#231E1F]/10">
              <h3 className="text-sm font-semibold text-[#231E1F] mb-3 [font-family:var(--font-outfit)]">
                Quick Presets
              </h3>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 25, 30, 45].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => {
                      setSessionDuration(minutes);
                      if (!isRunning) setTimeLeft(minutes * 60);
                    }}
                    disabled={isRunning}
                    className={`px-4 py-2 text-sm font-semibold rounded-2xl transition-colors [font-family:var(--font-outfit)] ${
                      sessionDuration === minutes
                        ? "bg-[#231E1F] text-amber-50"
                        : "bg-[#231E1F]/10 text-[#231E1F] hover:bg-[#231E1F]/20"
                    } ${isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Duration Settings */}
            <div className="bg-white rounded-2xl p-6 border border-[#231E1F]/10">
              <h2 className="text-lg font-semibold text-[#231E1F] mb-6 [font-family:var(--font-outfit)]">
                Custom Duration
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-[#231E1F] [font-family:var(--font-outfit)]">
                      Focus Time: {sessionDuration}m
                    </label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={sessionDuration}
                    onChange={(e) => {
                      const newDuration = parseInt(e.target.value);
                      setSessionDuration(newDuration);
                      if (!isRunning) {
                        setTimeLeft(newDuration * 60);
                      }
                    }}
                    className="w-full h-2 bg-[#231E1F]/20 rounded-lg appearance-none cursor-pointer accent-[#231E1F]"
                    disabled={isRunning}
                  />
                  <div className="text-xs text-[#231E1F]/50 mt-1">(1-60 minutes)</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-[#231E1F] [font-family:var(--font-outfit)]">
                      Break Time: {breakDuration}m
                    </label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#231E1F]/20 rounded-lg appearance-none cursor-pointer accent-[#231E1F]"
                    disabled={isRunning}
                  />
                  <div className="text-xs text-[#231E1F]/50 mt-1">(1-15 minutes)</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
