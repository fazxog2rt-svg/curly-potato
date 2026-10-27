"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Quote,
  RefreshCw,
  Moon,
  BookOpen,
  Volume2,
  VolumeX,
  Compass,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface MotivationData {
  quote: string;
  source: string;
  category_label: string;
  reflection: string;
  category: string;
}

interface AIMotivationCardProps {
  currentSubject?: string;
  className?: string;
  compact?: boolean;
}

export function AIMotivationCard({ currentSubject, className = "", compact = false }: AIMotivationCardProps) {
  const [data, setData] = useState<MotivationData>({
    quote: "Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga.",
    source: "HR. Muslim no. 2699",
    category_label: "Mutiara Islami",
    reflection: "Setiap tetes keringat dan waktu yang Anda luangkan untuk belajar memiliki nilai pahala dan keberkahan.",
    category: "islamic",
  });
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("islamic");
  const [mood, setMood] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchNewMotivation();
  }, [category]);

  const fetchNewMotivation = async (customMood?: string) => {
    setLoading(true);
    try {
      const activeMood = customMood !== undefined ? customMood : mood;
      const contextText = [
        currentSubject ? `Materi: ${currentSubject}` : "",
        activeMood ? `Suasana: ${activeMood}` : "",
      ]
        .filter(Boolean)
        .join(", ");

      const res = await api.ai.generateMotivation(category, contextText || undefined);
      setData(res);
    } catch (err) {
      console.error("Error generating motivation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${data.quote}. Dari ${data.source}. ${data.reflection}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        (v.lang.startsWith("id") || v.name.toLowerCase().includes("indonesia")) &&
        (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Google"))
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/90 bg-[#faf8f5] p-5.5 shadow-xs transition-all dark:border-stone-800 dark:bg-[#1a1918] ${className}`}
    >
      {/* Subtle Quote Watermark */}
      <div className="absolute -right-2 -bottom-2 text-stone-300/20 dark:text-stone-800/30 pointer-events-none select-none">
        <Quote className="h-20 w-20 rotate-180" />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full space-y-3.5">
        {/* Top Control Bar: Compact Category Switcher & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/70 pb-3 dark:border-stone-800/80">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: "islamic", label: "🌙 Islami" },
              { id: "science_leaders", label: "🔬 Sains" },
              { id: "philosophy", label: "🏛️ Filosofi" },
              { id: "general", label: "🌟 Semangat" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  category === cat.id
                    ? "bg-stone-900 text-stone-50 shadow-xs dark:bg-stone-100 dark:text-stone-900"
                    : "bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-800/60 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Voice Reader */}
            <button
              onClick={handleSpeak}
              className={`rounded-xl p-1.5 text-xs transition border ${
                isPlaying
                  ? "bg-stone-900 text-stone-100 border-stone-900 animate-pulse dark:bg-stone-100 dark:text-stone-900"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300"
              }`}
              title={isPlaying ? "Hentikan Suara" : "Dengarkan dengan Suara Tenang"}
            >
              {isPlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            {/* AI Generate New Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchNewMotivation()}
              isLoading={loading}
              className="h-7.5 px-2.5 text-[11px] rounded-xl border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Baru
            </Button>
          </div>
        </div>

        {/* Main Quote Content */}
        <div className="space-y-2 flex-1 flex flex-col justify-center py-1">
          <div className="flex items-start gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-200/80 text-stone-700 dark:bg-stone-800 dark:text-stone-300 mt-0.5">
              <Quote className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-relaxed italic">
                &ldquo;{data.quote}&rdquo;
              </p>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 not-italic">
                — {data.source}
              </p>
            </div>
          </div>

          {/* AI Reflection Note */}
          {data.reflection && (
            <div className="rounded-xl bg-white/90 p-2.5 border border-stone-200/70 dark:bg-stone-900/60 dark:border-stone-800 text-[11.5px] text-stone-600 dark:text-stone-300 leading-relaxed">
              <span className="font-semibold text-stone-800 dark:text-stone-200 mr-1">
                💡 Renungan:
              </span>
              {data.reflection}
            </div>
          )}
        </div>

        {/* Quick Mood Shortcuts (shown only if not compact or minimal) */}
        {!compact ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10.5px] text-stone-400">
            <span>Kondisi saat ini:</span>
            {["Lagi lelah / jenuh", "Takut ujian besok", "Perlu fokus tinggi"].map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setMood(m);
                  fetchNewMotivation(m);
                }}
                className="rounded-md border border-stone-200 bg-white/70 px-2 py-0.5 font-medium text-stone-600 hover:border-stone-400 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 transition"
              >
                {m}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
