"use client";

import React, { useState } from "react";
import {
  Award,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface CATExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: string;
}

export function CATExamModal({ isOpen, onClose, subject = "Matematika" }: CATExamModalProps) {
  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<any>(null);
  const [finalReport, setFinalReport] = useState<any>(null);

  const handleStartExam = async () => {
    setLoading(true);
    setFinalReport(null);
    setLastFeedback(null);
    try {
      const res = await api.catExam.start(subject);
      setSession(res);
      setCurrentQuestion(res.next_question);
      setStarted(true);
      setSelectedOption("");
    } catch (err: any) {
      alert("Gagal memulai CAT Exam: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQuestion || !session) return;
    setLoading(true);
    try {
      const res = await api.catExam.submitAnswer(
        session.session_id,
        currentQuestion.id,
        selectedOption
      );

      setLastFeedback({
        was_correct: res.was_correct,
        explanation: res.explanation,
        correct_answer: res.correct_answer,
      });

      if (res.is_finished) {
        setFinalReport(res.final_results);
        setSession((prev: any) => ({ ...prev, is_finished: true }));
      } else {
        setSession((prev: any) => ({
          ...prev,
          current_theta: res.current_theta,
          scaled_score: res.scaled_score,
          total_administered: res.total_administered,
        }));
        setCurrentQuestion(res.next_question);
        setSelectedOption("");
      }
    } catch (err: any) {
      alert("Gagal mengirim jawaban: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/60 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Simulasi Ujian Adaptif CAT (Item Response Theory)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tingkat kesulitan soal beradaptasi otomatis terhadap kemampuan Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!started ? (
            <div className="text-center py-8 space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                <Sparkles className="h-10 w-10 animate-pulse" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Mulai Tryout Standar Psikometrik IRT
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Algoritma IRT 3-Parameter Logistic (3PL) akan mengkalibrasi estimasi kemampuan laten (θ)
                  Anda secara real-time. Jika Anda menjawab benar, soal berikutnya akan lebih menantang
                  untuk mengukur batas maksimal pemahaman Anda.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-left">
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Metode</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">CAT 3PL IRT</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Estimasi</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Skala 200-1000</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Panjang Tes</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">5 Soal Adaptif</p>
                </div>
              </div>

              <Button onClick={handleStartExam} isLoading={loading} className="px-8 shadow-md">
                Mulai Simulasi CAT Sekarang <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : finalReport ? (
            /* Final Report Screen */
            <div className="space-y-6 py-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                  {finalReport.badge}
                </div>
                <h4 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                  Skor Standar: {finalReport.scaled_score} / 1000
                </h4>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mt-1">
                  Predikat: {finalReport.proficiency_level} (Grade: {finalReport.grade})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Estimasi Kemampuan Laten (θ): {finalReport.theta > 0 ? `+${finalReport.theta}` : finalReport.theta} | Ketepatan: {finalReport.correct_count} dari {finalReport.total_questions} butir soal
                </p>
              </div>

              {/* Response History Table */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Dinamika Adaptasi Kesulitan Per Butir Soal:
                </h5>
                <div className="space-y-2">
                  {finalReport.history.map((h: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-white dark:border-slate-800 dark:bg-slate-950 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {h.is_correct ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            Soal #{idx + 1}: {h.topic}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Tingkat Kesulitan Parameter (b): {h.b > 0 ? `+${h.b}` : h.b}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          h.is_correct
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {h.is_correct ? "Benar (+θ)" : "Salah (-θ)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={handleStartExam} size="sm">
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Uji Coba Lagi
                </Button>
                <Button onClick={onClose} size="sm">
                  Selesai
                </Button>
              </div>
            </div>
          ) : (
            /* Active Question Screen */
            <div className="space-y-6">
              {/* Telemetry Bar */}
              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs dark:border-indigo-950 dark:bg-indigo-950/20">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                    Soal ke-{session?.total_administered + 1} dari {session?.max_questions}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    Tingkat: {currentQuestion?.difficulty_label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Estimasi Skor Saat Ini:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {session?.scaled_score} / 1000
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Topik: {currentQuestion?.topic}
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {currentQuestion?.question_text}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion?.options?.map((opt: string, idx: number) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(opt)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left text-xs font-medium transition ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 text-slate-500 dark:border-slate-700"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Previous Answer Brief Flash Feedback */}
              {lastFeedback && (
                <div
                  className={`rounded-xl border p-3 text-xs ${
                    lastFeedback.was_correct
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-300"
                  }`}
                >
                  <p className="font-bold">
                    {lastFeedback.was_correct
                      ? "✓ Jawaban sebelumnya Benar! Kemampuan θ meningkat."
                      : "✕ Jawaban sebelumnya Kurang Tepat. Algoritma menyesuaikan tingkat soal."}
                  </p>
                  <p className="mt-1 text-[11px] opacity-90">{lastFeedback.explanation}</p>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end pt-3">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption || loading}
                  isLoading={loading}
                >
                  Kirim Jawaban <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
