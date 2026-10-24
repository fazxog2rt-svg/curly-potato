"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Award,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { QuizItem, QuizPublicResponse, QuizAttemptResult, LearningMaterialItem } from "@/lib/types";
import { CATExamModal } from "@/components/study/cat-exam-modal";

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [materials, setMaterials] = useState<LearningMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Generator form modal state
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [questionCount, setQuestionCount] = useState(5);
  const [materialId, setMaterialId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);

  // Active Quiz Playing State
  const [activeQuiz, setActiveQuiz] = useState<QuizPublicResponse | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);

  const loadQuizzes = async () => {
    try {
      const [quizData, matData] = await Promise.all([
        api.quizzes.list(),
        api.materials.list(),
      ]);
      if (Array.isArray(quizData)) setQuizzes(quizData);
      if (Array.isArray(matData)) setMaterials(matData);
    } catch (e) {
      console.error("Error loading quizzes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();

    // Check if coming from tutor or material page with seed
    const seedContent = sessionStorage.getItem("quiz_seed_content");
    const seedMat = sessionStorage.getItem("quiz_target_material_id");
    const seedSubject = sessionStorage.getItem("quiz_target_subject");

    if (seedSubject) setSubject(seedSubject);
    if (seedMat) setMaterialId(seedMat);
    if (seedContent || seedSubject) {
      setGeneratorModalOpen(true);
      sessionStorage.removeItem("quiz_seed_content");
      sessionStorage.removeItem("quiz_target_material_id");
      sessionStorage.removeItem("quiz_target_subject");
    }
  }, []);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) return;

    setGenerating(true);
    try {
      const generated = await api.quizzes.generate({
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        question_count: questionCount,
        material_id: materialId || undefined,
      });

      setGeneratorModalOpen(false);
      // Start taking the quiz immediately!
      startQuizTaking(generated);
      await loadQuizzes();
    } catch (err: any) {
      alert("Gagal membuat kuis AI: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const startQuizTaking = (quiz: QuizPublicResponse) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setQuizResult(null);
  };

  const handleSelectAnswer = (qId: string, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const answersList = (activeQuiz.questions || []).map((q: any) => ({
        question_id: q.id,
        user_answer: userAnswers[q.id] || "",
      }));

      const result = await api.quizzes.submit(activeQuiz.id, answersList);
      setQuizResult(result);
      await loadQuizzes();
    } catch (err: any) {
      alert("Gagal mengirim kuis: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Quiz Center (Generator & Evaluasi)"
      subtitle="Uji pemahaman materi Anda dengan kuis adaptif buatan AI dan penilaian objektif seketika."
    >
      <div className="space-y-6">
        {/* If user is taking an active quiz */}
        {activeQuiz && !quizResult && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Keluar dari kuis yang sedang berjalan?")) setActiveQuiz(null);
                }}
              >
                ← Kembali ke Daftar Kuis
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Soal {currentQuestionIdx + 1} dari {activeQuiz.questions.length}
                </Badge>
                <Badge variant="default" className="capitalize">
                  {activeQuiz.difficulty}
                </Badge>
              </div>
            </div>

            {/* Question Card */}
            {activeQuiz.questions[currentQuestionIdx] && (
              <Card className="p-6 md:p-8 space-y-6">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {activeQuiz.subject} • {activeQuiz.topic}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                    {activeQuiz.questions[currentQuestionIdx].question_text}
                  </h3>
                </div>

                {/* Options / Answer Input */}
                <div className="space-y-3">
                  {activeQuiz.questions[currentQuestionIdx].options &&
                  activeQuiz.questions[currentQuestionIdx].options!.length > 0 ? (
                    activeQuiz.questions[currentQuestionIdx].options!.map((opt: string, i: number) => {
                      const isSelected =
                        userAnswers[activeQuiz.questions[currentQuestionIdx].id] === opt;
                      return (
                        <div
                          key={i}
                          onClick={() =>
                            handleSelectAnswer(activeQuiz.questions[currentQuestionIdx].id, opt)
                          }
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200"
                              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-500">Ketik jawaban Anda:</label>
                      <Input
                        value={userAnswers[activeQuiz.questions[currentQuestionIdx].id] || ""}
                        onChange={(e) =>
                          handleSelectAnswer(activeQuiz.questions[currentQuestionIdx].id, e.target.value)
                        }
                        placeholder="Tuliskan jawaban singkat Anda di sini..."
                      />
                    </div>
                  )}
                </div>

                {/* Question Navigation Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx((p) => p - 1)}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" /> Sebelumnya
                  </Button>

                  {currentQuestionIdx < activeQuiz.questions.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                      className="gap-1.5"
                    >
                      Selanjutnya <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSubmitQuiz}
                      isLoading={submitting}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Kirim Jawaban <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* If Quiz Result Available */}
        {quizResult && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6 md:p-8 text-center bg-gradient-to-b from-slate-50/60 to-white dark:from-slate-900 dark:to-slate-900">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md ${
                  quizResult.percentage >= 70
                    ? "bg-emerald-600 shadow-emerald-200 dark:shadow-none"
                    : "bg-amber-500 shadow-amber-200 dark:shadow-none"
                }`}
              >
                <Award className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                Hasil Evaluasi Kuis
              </h3>
              <div className="mt-2 text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {quizResult.percentage}%
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Menjawab benar {quizResult.correct_count} dari {quizResult.total_questions} soal
              </p>

              {quizResult.percentage < 100 && (
                <div className="mt-4 mx-auto max-w-md rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50">
                  ✨ Soal yang dijawab salah telah secara otomatis ditambahkan ke jadwal <strong>Smart Review (Spaced Repetition)</strong> untuk Anda pelajari kembali!
                </div>
              )}

              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setActiveQuiz(null)}>
                  Kembali ke Daftar Kuis
                </Button>
                <a href="/review">
                  <Button size="sm" className="gap-1.5">
                    <RotateCcw className="h-4 w-4" /> Buka Smart Review
                  </Button>
                </a>
              </div>
            </Card>

            {/* Detailed Question Review */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pembahasan & Analisis Kesalahan:
              </h4>
              {quizResult.answers.map((ans, idx) => (
                <Card key={idx} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {ans.question_text}
                      </p>
                    </div>
                    {ans.is_correct ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Benar
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Salah
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 text-xs space-y-1 pl-7">
                    <p className="text-slate-600 dark:text-slate-400">
                      Jawaban Anda:{" "}
                      <span className={ans.is_correct ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                        {ans.user_answer || "(Kosong)"}
                      </span>
                    </p>
                    {!ans.is_correct && (
                      <p className="text-slate-600 dark:text-slate-400">
                        Jawaban Benar:{" "}
                        <span className="text-emerald-600 font-semibold">{ans.correct_answer}</span>
                      </p>
                    )}
                    {ans.explanation && (
                      <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                        💡 <strong>Pembahasan AI:</strong> {ans.explanation}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Quiz Hub View (when not playing) */}
        {!activeQuiz && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Daftar Kuis Tersimpan ({quizzes.length})
                </h2>
                <p className="text-xs text-slate-500">Pilih kuis untuk mulai menguji pemahaman atau buat kuis baru.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCatModalOpen(true)}
                  className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
                >
                  <TrendingUp className="h-4 w-4" /> Tryout Adaptif CAT (IRT)
                </Button>
                <Button onClick={() => setGeneratorModalOpen(true)} className="gap-2">
                  <Sparkles className="h-4 w-4" /> Generate Kuis dengan AI
                </Button>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <Card className="py-16 text-center border-dashed">
                <Award className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  Belum Ada Kuis
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Buat kuis pertama Anda berdasarkan topik pilihan atau dari dokumen materi yang telah diunggah.
                </p>
                <Button onClick={() => setGeneratorModalOpen(true)} size="sm" className="mt-4 text-xs gap-1.5">
                  <Sparkles className="h-4 w-4" /> Generate Kuis Sekarang
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id} className="flex flex-col justify-between hover:border-indigo-200 transition-colors">
                    <div>
                      <div className="flex items-start justify-between">
                        <Badge variant="secondary" className="capitalize">
                          {quiz.difficulty}
                        </Badge>
                        {quiz.last_score !== undefined && quiz.last_score !== null && (
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Skor: {quiz.last_score}%
                          </span>
                        )}
                      </div>

                      <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {quiz.topic}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        Mata Pelajaran: {quiz.subject}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {quiz.question_count} Soal
                      </span>
                      <Button
                        size="sm"
                        onClick={async () => {
                          const fullQuiz = await api.quizzes.get(quiz.id);
                          startQuizTaking(fullQuiz);
                        }}
                        className="gap-1.5 text-xs"
                      >
                        <Play className="h-3 w-3" /> Kerjakan Kuis
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Generator Modal */}
      <Modal
        isOpen={generatorModalOpen}
        onClose={() => setGeneratorModalOpen(false)}
        title="Generate Kuis Berbantuan AI"
        description="Tentukan mata pelajaran dan topik untuk membuat soal-soal berkualitas tinggi."
      >
        <form onSubmit={handleGenerateQuiz} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mata Pelajaran
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Jaringan Komputer, Biologi, Matematika"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Topik Pembelajaran
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Subnetting IP Address, Pembelahan Sel"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tingkat Kesulitan
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="beginner">Pemula (Dasar)</option>
                <option value="intermediate">Menengah</option>
                <option value="advanced">Mendalam (Tinggi)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jumlah Soal
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value={3}>3 Soal</option>
                <option value={5}>5 Soal</option>
                <option value={10}>10 Soal</option>
              </select>
            </div>
          </div>

          {materials.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dasarkan pada Dokumen (Opsional)
              </label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="">Tanpa Dokumen Spesifik</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.file_type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setGeneratorModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" type="submit" isLoading={generating}>
              Generate Kuis
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adaptive Computerized Testing (CAT) Modal */}
      <CATExamModal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
      />
    </AppLayout>
  );
}
