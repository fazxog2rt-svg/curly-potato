"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  Award,
  Copy,
  Check,
  RotateCcw,
  Play,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

function YouTubeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

interface YouTubeAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToNotes?: (content: string) => void;
}

export function YouTubeAnalyzerModal({
  isOpen,
  onClose,
  onImportToNotes,
}: YouTubeAnalyzerModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedAnswers({});
    setShowQuizResults(false);

    try {
      const data = await api.tools.analyzeYouTube(url.trim());
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Gagal menganalisis video YouTube. Pastikan link valid.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex]: option,
    }));
  };

  const handleCopySummary = () => {
    if (!result) return;
    const text = `## ${result.title}\nChannel: ${result.author}\nLink: https://www.youtube.com/watch?v=${result.video_id}\n\n### Ringkasan Konsep\n${result.summary}\n\n### Poin Kunci\n${result.key_takeaways?.map((t: string) => `- ${t}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-stone-200/80 bg-[#FAF8F5] shadow-2xl dark:border-stone-800 dark:bg-[#1A1917] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/70 px-6 py-4 dark:border-stone-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <YouTubeIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                YouTube Video Summarizer & Quiz
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                  oEmbed + AI
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Ubah video pembelajaran YouTube menjadi ringkasan konsep terstruktur dan kuis evaluasi.
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
          {/* Input Form */}
          <form onSubmit={handleAnalyze} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <YouTubeIcon className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Tempel tautan video YouTube (misal: https://www.youtube.com/watch?v=...)"
                  className="w-full rounded-2xl border border-stone-200/90 bg-white py-2.5 pl-10 pr-4 text-xs text-stone-900 shadow-2xs placeholder:text-stone-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={!url.trim() || loading}
                className="gap-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white shrink-0 px-5 text-xs shadow-xs"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Ekstrak Materi</span>
                  </>
                )}
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
              <span className="font-medium">Contoh video:</span>
              <button
                type="button"
                onClick={() => {
                  setUrl("https://www.youtube.com/watch?v=kqtD5dpn9C8");
                }}
                className="rounded-lg bg-stone-100 px-2 py-0.5 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 transition"
              >
                Python untuk Pemula
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrl("https://www.youtube.com/watch?v=aircAruvnKk");
                }}
                className="rounded-lg bg-stone-100 px-2 py-0.5 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 transition"
              >
                Neural Networks (3Blue1Brown)
              </button>
            </div>
          </form>

          {/* Error notice */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Analysis Result */}
          {result && (
            <div className="space-y-6">
              {/* Video Info Header */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-900">
                {result.thumbnail_url && (
                  <img
                    src={result.thumbnail_url}
                    alt={result.title}
                    className="h-28 w-44 rounded-xl object-cover shrink-0 shadow-xs border border-stone-100 dark:border-stone-800"
                  />
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                      {result.author}
                    </span>
                    <h4 className="text-sm font-serif font-bold text-stone-900 dark:text-white mt-0.5 line-clamp-2">
                      {result.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <a
                      href={`https://www.youtube.com/watch?v=${result.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition"
                    >
                      <ExternalLink className="h-3 w-3" /> Tonton di YouTube
                    </a>

                    <button
                      onClick={handleCopySummary}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 transition"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Salin Ringkasan</span>
                        </>
                      )}
                    </button>

                    {onImportToNotes && (
                      <button
                        onClick={() => {
                          const note = `## ${result.title}\n\n**Video:** https://www.youtube.com/watch?v=${result.video_id}\n**Channel:** ${result.author}\n\n### Ringkasan Konsep\n${result.summary}\n\n### Poin Kunci Pembelajaran\n${result.key_takeaways?.map((t: string) => `- ${t}`).join("\n")}`;
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
              </div>

              {/* Summary Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-500">
                  Ringkasan Konsep Inti
                </h4>
                <div className="rounded-2xl border border-stone-200/80 bg-white p-4 text-xs leading-relaxed text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                  {result.summary}
                </div>
              </div>

              {/* Key Takeaways */}
              {result.key_takeaways && result.key_takeaways.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-500">
                    Poin Kunci & Wawasan Pembelajaran
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.key_takeaways.map((point: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl border border-stone-200/70 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-stone-700 dark:text-stone-300 leading-snug">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz Evaluasi */}
              {result.quiz_questions && result.quiz_questions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <ListChecks className="h-4 w-4 text-red-500" />
                      Kuis Evaluasi Pemahaman Video
                    </h4>
                    <button
                      onClick={() => setShowQuizResults(!showQuizResults)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      {showQuizResults ? "Sembunyikan Kunci Jawaban" : "Periksa Jawaban"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {result.quiz_questions.map((q: any, qIdx: number) => {
                      const userChoice = selectedAnswers[qIdx];
                      const isCorrect = userChoice === q.correct_answer;

                      return (
                        <div
                          key={qIdx}
                          className="rounded-2xl border border-stone-200/80 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 space-y-3"
                        >
                          <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                            {qIdx + 1}. {q.question}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options?.map((opt: string, optIdx: number) => {
                              const isSelected = userChoice === opt;
                              let btnClass = "border-stone-200 hover:border-stone-400 dark:border-stone-700";

                              if (showQuizResults) {
                                if (opt === q.correct_answer) {
                                  btnClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold";
                                } else if (isSelected && !isCorrect) {
                                  btnClass = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 line-through";
                                }
                              } else if (isSelected) {
                                btnClass = "border-red-600 bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-medium";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectAnswer(qIdx, opt)}
                                  className={`flex items-center text-left p-2.5 rounded-xl border text-xs transition ${btnClass}`}
                                >
                                  <span className="mr-2 text-[10px] font-bold text-stone-400 uppercase">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {showQuizResults && (
                            <div className="rounded-xl bg-stone-50 p-2.5 text-[11px] text-stone-600 dark:bg-stone-800/60 dark:text-stone-300">
                              <span className="font-semibold text-stone-800 dark:text-stone-200">
                                Penjelasan:{" "}
                              </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
