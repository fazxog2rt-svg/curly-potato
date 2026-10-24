"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  Trash2,
  Flame,
  Calendar,
  Download,
} from "lucide-react";
import { api } from "@/lib/api";
import { ReviewCardItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ReviewPage() {
  const [dueCards, setDueCards] = useState<ReviewCardItem[]>([]);
  const [allCards, setAllCards] = useState<ReviewCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Review Session State
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Manual Card Creation Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [creating, setCreating] = useState(false);

  const loadCards = async () => {
    try {
      const [dueData, allData] = await Promise.all([
        api.reviews.due(),
        api.reviews.all(),
      ]);
      if (Array.isArray(dueData)) setDueCards(dueData);
      if (Array.isArray(allData)) setAllCards(allData);
    } catch (e) {
      console.error("Error loading review cards:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const startReviewSession = () => {
    if (dueCards.length === 0) return;
    setIsReviewing(true);
    setCurrentCardIdx(0);
    setIsFlipped(false);
  };

  const handleRatingSubmit = async (rating: number) => {
    if (!dueCards[currentCardIdx]) return;
    setSubmittingRating(true);

    try {
      await api.reviews.answer(dueCards[currentCardIdx].id, rating);
      if (currentCardIdx < dueCards.length - 1) {
        setCurrentCardIdx((p) => p + 1);
        setIsFlipped(false);
      } else {
        // Session complete!
        setIsReviewing(false);
        await loadCards();
        alert("🎉 Hebat! Anda telah menyelesaikan seluruh materi review yang jatuh tempo hari ini.");
      }
    } catch (err: any) {
      alert("Gagal mencatat hasil review: " + err.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !question.trim() || !answer.trim()) return;

    setCreating(true);
    try {
      await api.reviews.create({
        subject: subject.trim(),
        topic: topic.trim() || undefined,
        question: question.trim(),
        answer: answer.trim(),
        explanation: explanation.trim() || undefined,
      });

      setCreateModalOpen(false);
      setSubject("");
      setTopic("");
      setQuestion("");
      setAnswer("");
      setExplanation("");
      await loadCards();
    } catch (err: any) {
      alert("Gagal membuat kartu review: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Hapus kartu materi ini?")) return;
    try {
      await api.reviews.delete(id);
      await loadCards();
    } catch (err: any) {
      alert("Gagal menghapus kartu: " + err.message);
    }
  };

  const exportToAnkiCSV = () => {
    if (allCards.length === 0) {
      alert("Belum ada kartu materi untuk diekspor ke Anki.");
      return;
    }

    const escapeCsv = (str: string) => {
      const clean = (str || "").replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = "Front,Back,Subject,Topic\n";
    const rows = allCards
      .map(
        (c) =>
          `${escapeCsv(c.question)},${escapeCsv(
            c.answer + (c.explanation ? `\n\nPenjelasan: ${c.explanation}` : "")
          )},${escapeCsv(c.subject)},${escapeCsv(c.topic || "")}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `anki_flashcards_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentCard = dueCards[currentCardIdx];

  return (
    <AppLayout
      title="Smart Review (Spaced Repetition)"
      subtitle="Pengulangan berkala materi yang sulit atau salah dijawab menggunakan algoritma SuperMemo-2 (SM-2)."
    >
      <div className="space-y-6">
        {/* If Active Flashcard Review Playing */}
        {isReviewing && currentCard ? (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <Button variant="ghost" size="sm" onClick={() => setIsReviewing(false)}>
                ← Keluar dari Sesi
              </Button>
              <Badge variant="secondary">
                Kartu {currentCardIdx + 1} dari {dueCards.length}
              </Badge>
            </div>

            {/* Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative min-h-[300px] w-full rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-md hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="default">{currentCard.subject}</Badge>
                  {currentCard.failure_count > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                      <Flame className="h-3.5 w-3.5" /> Pernah salah {currentCard.failure_count}x
                    </span>
                  )}
                </div>

                <div className="mt-8">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pertanyaan:
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                    {currentCard.question}
                  </h3>
                </div>

                {isFlipped ? (
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-fade-in">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Jawaban Benar:
                      </span>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {currentCard.answer}
                      </p>
                    </div>

                    {currentCard.explanation && (
                      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                        💡 <strong>Penjelasan:</strong> {currentCard.explanation}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    <Eye className="h-4 w-4" /> Klik untuk melihat jawaban
                  </div>
                )}
              </div>

              <p className="mt-4 text-center text-[10px] text-slate-400">
                {isFlipped ? "Pilih tingkat kemudahan mengingat di bawah ini:" : "Coba ingat jawabannya sebelum membuka kartu."}
              </p>
            </div>

            {/* SM-2 Rating Buttons (shown when flipped) */}
            {isFlipped && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={submittingRating}
                  onClick={() => handleRatingSubmit(1)}
                  className="flex-col h-auto py-2 text-xs"
                >
                  <span className="font-bold">Lupa (0-1)</span>
                  <span className="text-[10px] opacity-80">Ulang besok</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={submittingRating}
                  onClick={() => handleRatingSubmit(2)}
                  className="flex-col h-auto py-2 text-xs text-amber-600 dark:text-amber-400"
                >
                  <span className="font-bold">Hampir Ingat (2)</span>
                  <span className="text-[10px] opacity-80">Ulang 1 hari</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={submittingRating}
                  onClick={() => handleRatingSubmit(3)}
                  className="flex-col h-auto py-2 text-xs text-indigo-600 dark:text-indigo-400"
                >
                  <span className="font-bold">Benar (3-4)</span>
                  <span className="text-[10px] opacity-80">Cukup ingat</span>
                </Button>
                <Button
                  size="sm"
                  disabled={submittingRating}
                  onClick={() => handleRatingSubmit(5)}
                  className="flex-col h-auto py-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <span className="font-bold">Sangat Ingat (5)</span>
                  <span className="text-[10px] opacity-80">Kuasai penuh</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header / Hero Action Card */}
            <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/50 dark:border-indigo-950 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/20 p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <Badge variant="default" className="mb-2">
                    Spaced Repetition Algorithm
                  </Badge>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {dueCards.length > 0
                      ? `${dueCards.length} Kartu Pembelajaran Siap Direview`
                      : "Semua Kartu Sedang Dalam Jadwal"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                    Sistem secara otomatis menghitung interval pengulangan optimal agar materi tidak terlupakan dari memori jangka panjang Anda.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={startReviewSession}
                    disabled={dueCards.length === 0}
                    size="lg"
                    className="gap-2 font-bold"
                  >
                    <RotateCcw className="h-5 w-5" /> Mulai Sesi Review
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCreateModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" /> Tambah Kartu
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={exportToAnkiCSV}
                    className="gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    title="Ekspor kartu ke file CSV untuk diimpor ke aplikasi Anki"
                  >
                    <Download className="h-4 w-4" /> Ekspor Anki (.csv)
                  </Button>
                </div>
              </div>
            </Card>

            {/* All Cards Table / Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Semua Kartu Materi ({allCards.length})
                </h3>
              </div>

              {allCards.length === 0 ? (
                <Card className="py-12 text-center border-dashed">
                  <RotateCcw className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-xs text-slate-500">
                    Belum ada kartu review. Kartu dibuat secara otomatis saat Anda salah menjawab soal kuis, atau dapat dibuat manual.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allCards.map((card) => (
                    <Card key={card.id} className="flex flex-col justify-between hover:border-indigo-200 transition-colors">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {card.subject}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {card.failure_count > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                                <Flame className="h-3 w-3" /> {card.failure_count}x
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="mt-3 text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                          {card.question}
                        </h4>
                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold line-clamp-2">
                          Jawaban: {card.answer}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Interval: {card.interval_days} hari</span>
                        <span>Repetisi: {card.repetitions}x</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Manual Card Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tambah Kartu Materi Manual"
        description="Buat kartu pengulangan konsep untuk dijadwalkan dalam Smart Review."
      >
        <form onSubmit={handleCreateCard} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mata Pelajaran
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Matematika, Fisika, Biologi"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pertanyaan / Konsep
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Tuliskan pertanyaan penguji konsep..."
              rows={3}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Jawaban
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Tuliskan jawaban yang tepat..."
              rows={3}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Penjelasan Tambahan (Opsional)
            </label>
            <Input
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Contoh: Rumus atau alasan konsep"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" type="submit" isLoading={creating}>
              Simpan Kartu
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
