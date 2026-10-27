"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Mic,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Radio,
  BookOpen,
  Headphones,
  Forward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface PodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialSourceText?: string;
  onImportToNotes?: (text: string) => void;
}

export function PodcastModal({
  isOpen,
  onClose,
  initialTopic = "",
  initialSourceText = "",
  onImportToNotes,
}: PodcastModalProps) {
  const [topic, setTopic] = useState(initialTopic || "Konsep Dasar Jaringan Syaraf Tiruan (Neural Networks)");
  const [sourceText, setSourceText] = useState(initialSourceText || "");
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [loading, setLoading] = useState(false);
  const [podcastData, setPodcastData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Audio Playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialSourceText) setSourceText(initialSourceText);
  }, [initialTopic, initialSourceText]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [podcastData]);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setPodcastData(null);
    setIsPlaying(false);

    try {
      const res = await api.tools.generatePodcast(topic.trim(), sourceText.trim(), language);
      setPodcastData(res);
    } catch (err: any) {
      setError(err?.message || "Gagal membuat episode podcast. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const changeSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleDownload = () => {
    if (!podcastData?.audio_data_url) return;
    const a = document.createElement("a");
    a.href = podcastData.audio_data_url;
    a.download = `${(podcastData.title || "podcast").toLowerCase().replace(/[^a-z0-9]/g, "-")}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyTranscript = () => {
    if (!podcastData?.dialogue) return;
    const text = podcastData.dialogue.map((d: any) => `${d.speaker}: ${d.text}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FAF8F5] shadow-2xl dark:border-stone-800 dark:bg-[#191816]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/80 px-6 py-4.5 dark:border-stone-800/80 bg-white dark:bg-[#1E1D1A]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  AI Podcast Studio (2-Host Audio Overview)
                </h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                  Edge-TTS Neural
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Ubah topik dan catatan belajar menjadi percakapan podcast dua narasumber (Rian & Siti) secara instan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Generation Form */}
          <form onSubmit={handleGenerate} className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-5 dark:border-stone-800 dark:bg-[#1F1E1B] shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Topik Podcast
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Cara Kerja Algoritma Dijkstra dan Graph Search"
                  className="w-full rounded-xl border border-stone-200/90 bg-stone-50/60 px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Bahasa & Karakter Host
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "id" | "en")}
                  className="w-full rounded-xl border border-stone-200/90 bg-stone-50/60 px-3.5 py-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                  disabled={loading}
                >
                  <option value="id">Bahasa Indonesia (Rian & Siti)</option>
                  <option value="en">English (Guy & Jenny)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>Rujukan Materi Tambahan (Opsional)</span>
                <span className="text-[11px] text-stone-400">Bisa kutip catatan atau dokumen</span>
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Tempel ringkasan dokumen, catatan, atau silabus materi jika ingin pembahasan lebih spesifik..."
                rows={2}
                className="w-full rounded-xl border border-stone-200/90 bg-stone-50/60 p-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[11px] text-stone-500">
                <Radio className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                <span>Format 2-Host: Host Penanya + Host Ekspert</span>
              </div>

              <Button
                type="submit"
                disabled={!topic.trim() || loading}
                className="gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs px-5 shadow-xs"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Menyusun Naskah & Merender Audio...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Rekam Episode Podcast</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Error Notice */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="py-14 text-center space-y-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700">
              <div className="flex items-center justify-center gap-1.5 h-10">
                <span className="w-1.5 h-6 bg-amber-600 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-1.5 h-10 bg-amber-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-8 bg-amber-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                <span className="w-1.5 h-12 bg-amber-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="w-1.5 h-7 bg-amber-600 rounded-full animate-bounce [animation-delay:0.5s]" />
              </div>
              <p className="font-serif text-sm font-semibold text-stone-800 dark:text-stone-200">
                Studio AI sedang menyusun naskah dan merender suara neural 2 host...
              </p>
              <p className="text-xs text-stone-500">
                Audio disintesis secara natural menggunakan Edge-TTS Engine.
              </p>
            </div>
          )}

          {/* Podcast Player & Transcript Result */}
          {podcastData && (
            <div className="space-y-6">
              {/* Hidden HTML5 Audio Element */}
              <audio ref={audioRef} src={podcastData.audio_data_url} preload="metadata" />

              {/* Master Player Deck */}
              <div className="rounded-3xl border border-amber-900/20 bg-gradient-to-br from-amber-900/90 via-stone-900 to-stone-950 p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                        <Radio className="h-3 w-3" /> Episode Baru
                      </span>
                      <h4 className="font-serif text-lg font-bold mt-1 text-amber-50">
                        {podcastData.title}
                      </h4>
                      <p className="text-xs text-stone-300 line-clamp-2 mt-0.5">
                        {podcastData.summary}
                      </p>
                    </div>

                    {/* Host Avatars */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5 border border-white/10">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-stone-900 font-bold text-xs">
                          R
                        </span>
                        <div className="text-left">
                          <p className="text-[11px] font-bold">Rian</p>
                          <p className="text-[9px] text-amber-200/70">Host</p>
                        </div>
                      </div>
                      <span className="text-xs text-amber-300 font-serif italic">&</span>
                      <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5 border border-white/10">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold text-xs">
                          S
                        </span>
                        <div className="text-left">
                          <p className="text-[11px] font-bold">Siti</p>
                          <p className="text-[9px] text-emerald-200/70">Ekspert</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden cursor-pointer">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-150"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-400 font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={changeSpeed}
                      className="rounded-xl bg-white/10 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-white/20 transition"
                      title="Ubah Kecepatan Putar"
                    >
                      {playbackRate}x
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => skipTime(-10)}
                        className="rounded-full p-2 text-stone-300 hover:text-white hover:bg-white/10 transition"
                        title="Mundur 10 Detik"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>

                      <button
                        onClick={togglePlay}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-stone-950 font-bold hover:scale-105 transition shadow-lg"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </button>

                      <button
                        onClick={() => skipTime(10)}
                        className="rounded-full p-2 text-stone-300 hover:text-white hover:bg-white/10 transition"
                        title="Maju 10 Detik"
                      >
                        <Forward className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-amber-200 transition"
                        title="Unduh File MP3 Podcast"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Unduh MP3</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transcript Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Mic className="h-4 w-4 text-amber-600" />
                    Naskah Percakapan Podcast
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyTranscript}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 transition"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-600 font-semibold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-stone-400" />
                          <span>Salin Naskah</span>
                        </>
                      )}
                    </button>

                    {onImportToNotes && (
                      <button
                        onClick={() => {
                          const note = `## 🎙️ Podcast: ${podcastData.title}\n\n**Ringkasan:** ${podcastData.summary}\n\n### Transkrip Diskusi:\n${podcastData.dialogue?.map((d: any) => `**${d.speaker}:** ${d.text}`).join("\n\n")}`;
                          onImportToNotes(note);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 transition"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>Simpan ke Catatan</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dialogue Turns */}
                <div className="space-y-3">
                  {podcastData.dialogue?.map((turn: any) => {
                    const isRian = turn.speaker === "Rian";
                    return (
                      <div
                        key={turn.id}
                        className={`flex gap-3 p-3.5 rounded-2xl border transition ${
                          isRian
                            ? "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/20"
                            : "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/20"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-2xs ${
                            isRian
                              ? "bg-amber-500 text-stone-900"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {turn.speaker[0]}
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[11.5px] font-bold ${
                                isRian
                                  ? "text-amber-800 dark:text-amber-300"
                                  : "text-emerald-800 dark:text-emerald-300"
                              }`}
                            >
                              {turn.speaker}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {turn.voice}
                            </span>
                          </div>
                          <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                            {turn.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
