"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause, Square } from "lucide-react";

interface AudioPlayerButtonProps {
  text: string;
  className?: string;
}

export function AudioPlayerButton({ text, className = "" }: AudioPlayerButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 1.25 | 1.5>(1);

  // Stop audio if component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanTextForSpeech = (rawText: string) => {
    // Strip markdown formatting, code fences, and symbols for pleasant listening
    return rawText
      .replace(/```[\s\S]*?```/g, "Kode program diabaikan untuk audio.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/#+\s+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\$[^$]+\$/g, "rumus matematika")
      .trim();
  };

  const handleTogglePlay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Browser Anda tidak mendukung Web Speech API.");
      return;
    }

    const synth = window.speechSynthesis;

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    synth.cancel(); // Clear any previous queue
    const spokenText = cleanTextForSpeech(text);
    if (!spokenText) return;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = speed;
    utterance.lang = "id-ID";

    // Prefer Natural / Online / Google Indonesian Voice
    const voices = synth.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        (v.lang.startsWith("id") || v.name.toLowerCase().includes("indonesia")) &&
        (v.name.includes("Natural") ||
          v.name.includes("Online") ||
          v.name.includes("Neural") ||
          v.name.includes("Google"))
    );
    const indonesianVoice = naturalVoice || voices.find((v) => v.lang.startsWith("id"));
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }
    utterance.pitch = 1.05;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    synth.speak(utterance);
    setIsPlaying(true);
  };

  const handleCycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : 1;
    setSpeed(nextSpeed);

    // If currently playing, restart with new speed
    if (isPlaying && typeof window !== "undefined") {
      const synth = window.speechSynthesis;
      synth.cancel();
      const spokenText = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = nextSpeed;
      utterance.lang = "id-ID";
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      synth.speak(utterance);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        onClick={handleTogglePlay}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isPlaying
            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 animate-pulse font-semibold"
            : "bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300"
        }`}
        title={isPlaying ? "Hentikan Suara" : "Dengarkan Audio (Podcast)"}
      >
        {isPlaying ? (
          <>
            <Square className="h-3.5 w-3.5 fill-amber-700 dark:fill-amber-300" />
            <span>Hentikan</span>
          </>
        ) : (
          <>
            <Volume2 className="h-3.5 w-3.5 text-indigo-500" />
            <span>Dengarkan</span>
          </>
        )}
      </button>

      {isPlaying && (
        <button
          onClick={handleCycleSpeed}
          className="px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          title="Ubah Kecepatan Audio"
        >
          {speed}x
        </button>
      )}
    </div>
  );
}
