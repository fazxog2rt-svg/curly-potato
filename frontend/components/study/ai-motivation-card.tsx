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
}

export function AIMotivationCard({ currentSubject, className = "" }: AIMotivationCardProps) {
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
    utterance.rate = 0.95; // Calm, thoughtful pace
    utterance.pitch = 1.05;

    // Try finding natural voice
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
      className={`relative shrink-0 overflow-hidden rounded-3xl border border-stone-200/80 bg-[#fbf9f5] p-5 shadow-xs transition-all dark:border-stone-800 dark:bg-[#1e1c19] ${className}`}
    >
      {/* Decorative Background Quote Watermark */}
      <div className="absolute -right-2 -bottom-2 text-stone-300/25 dark:text-stone-700/20 pointer-events-none select-none">
        <Quote className="h-24 w-24 rotate-180" />
      </div>

      <div className="relative z-10 space-y-3.5">
        {/* Top Control Bar: Category Switcher & Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-3 dark:border-stone-800">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "islamic", label: "🌙 Mutiara Islami" },
              { id: "science_leaders", label: "🔬 Tokoh & Sains" },
              { id: "philosophy", label: "🏛️ Filosofi" },
              { id: "general", label: "🌟 Semangat" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  category === cat.id
                    ? "bg-stone-800 text-stone-50 shadow-xs dark:bg-stone-100 dark:text-stone-900"
                    : "bg-stone-100/90 text-stone-600 hover:bg-stone-200/80 dark:bg-stone-800/80 dark:text-stone-300"
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
              className={`rounded-full p-1.5 text-xs transition border ${
                isPlaying
                  ? "bg-stone-800 text-stone-100 border-stone-800 animate-pulse dark:bg-stone-100 dark:text-stone-900"
                  : "bg-white text-stone-700 border-stone-200/80 hover:bg-stone-100 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300"
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
              className="h-7 px-2.5 text-[11px] border-stone-300/80 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Generate Baru
            </Button>
          </div>
        </div>

        {/* Main Quote Content */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-300 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm md:text-base font-semibold text-stone-900 dark:text-stone-100 leading-relaxed">
                "{data.quote}"
              </p>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                — {data.source}
              </p>
            </div>
          </div>

          {/* AI Personal Reflection Note */}
          {data.reflection && (
            <div className="ml-10 rounded-xl bg-white/80 p-2.5 border border-stone-200/70 dark:bg-stone-900/60 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              <span className="font-semibold text-stone-800 dark:text-stone-200 mr-1.5">
                💡 Renungan:
              </span>
              {data.reflection}
            </div>
          )}
        </div>

        {/* Quick Mood Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] text-stone-400">
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
      </div>
    </div>
  );
}
