"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Timer, Sparkles, Volume2, X } from "lucide-react";
import { api } from "@/lib/api";

export function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Completed cycle!
      playChime();
      if (mode === "focus") {
        setSessionsCompleted((prev) => prev + 1);
        // Automatically log 25 minutes of study session
        api.analytics.logSession({
          subject: "Fokus Pomodoro",
          duration_minutes: 25,
          activity_type: "pomodoro",
          notes: "Sesi belajar terfokus 25 menit selesai.",
        }).catch(() => {});

        setMode("break");
        setTimeLeft(BREAK_TIME);
      } else {
        setMode("focus");
        setTimeLeft(FOCUS_TIME);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // AudioContext fallback
    }
  };

  const toggleRun = () => setIsRunning(!isRunning);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? FOCUS_TIME : BREAK_TIME);
  };

  const switchMode = (newMode: "focus" | "break") => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === "focus" ? FOCUS_TIME : BREAK_TIME);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="relative">
      {/* Trigger Pill in Navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
          isRunning
            ? "bg-indigo-600 text-white border-indigo-500 shadow-sm animate-pulse"
            : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-750"
        }`}
        title="Buka Timer Pomodoro Fokus"
      >
        <Timer className={`h-3.5 w-3.5 ${isRunning ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`} />
        <span className="font-mono tracking-tight">{formattedTime}</span>
        {sessionsCompleted > 0 && (
          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-indigo-500 text-[10px] text-white font-bold">
            {sessionsCompleted}
          </span>
        )}
      </button>

      {/* Floating Popup Panel */}
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Timer className="h-3.5 w-3.5" />
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Focus Pomodoro
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switch Tabs */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => switchMode("focus")}
              className={`py-1.5 rounded-lg transition-all ${
                mode === "focus"
                  ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-700 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              🎯 Fokus (25m)
            </button>
            <button
              onClick={() => switchMode("break")}
              className={`py-1.5 rounded-lg transition-all ${
                mode === "break"
                  ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              ☕ Rehat (5m)
            </button>
          </div>

          {/* Large Time Display */}
          <div className="my-5 text-center">
            <div className={`text-4xl font-extrabold font-mono tracking-tight ${
              mode === "focus" ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {formattedTime}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {mode === "focus" ? "Waktu belajar tanpa distraksi" : "Waktu santai sejenak"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              title="Reset Timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={toggleRun}
              className={`flex h-10 px-5 items-center justify-center gap-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                isRunning
                  ? "bg-amber-500 hover:bg-amber-600"
                  : mode === "focus"
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" /> Jeda
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" /> Mulai
                </>
              )}
            </button>
          </div>

          {/* Progress / Motivation */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[10.5px] text-slate-400">
            Sesi selesai hari ini: <strong className="text-slate-700 dark:text-slate-200">{sessionsCompleted}</strong> sesi ({sessionsCompleted * 25} menit)
          </div>
        </div>
      )}
    </div>
  );
}
