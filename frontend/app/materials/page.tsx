"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileText,
  FileCode,
  File,
  Trash2,
  Sparkles,
  HelpCircle,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Send,
  Share2,
  Video,
  Headphones,
} from "lucide-react";
import { AudioPlayerButton } from "@/components/study/audio-player-button";
import { MindMapModal } from "@/components/study/mindmap-modal";
import { CheatSheetModal } from "@/components/study/cheatsheet-modal";
import { YouTubeAnalyzerModal } from "@/components/study/youtube-analyzer-modal";
import { PodcastModal } from "@/components/study/podcast-modal";
import { api } from "@/lib/api";
import { LearningMaterialItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<LearningMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");

  // Summary modal state
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<LearningMaterialItem | null>(null);
  const [summaryData, setSummaryData] = useState<{
    summary: string;
    key_concepts: string;
    glossary: any[];
  } | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // Ask document modal state
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [docQuestion, setDocQuestion] = useState("");
  const [docAnswer, setDocAnswer] = useState<string | null>(null);
  const [docSources, setDocSources] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);

  // Mind map & Cheatsheet modal state
  const [mindmapOpen, setMindmapOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [podcastModalOpen, setPodcastModalOpen] = useState(false);
  const [podcastTopic, setPodcastTopic] = useState("");
  const [podcastSource, setPodcastSource] = useState("");
  const [modalSeed, setModalSeed] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const loadMaterials = async () => {
    try {
      const data = await api.materials.list();
      if (Array.isArray(data)) setMaterials(data);
    } catch (e) {
      console.error("Error loading materials:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    if (docTitle.trim()) {
      formData.append("title", docTitle.trim());
    }

    try {
      await api.materials.upload(formData);
      setUploadModalOpen(false);
      setSelectedFile(null);
      setDocTitle("");
      await loadMaterials();
    } catch (err: any) {
      alert("Gagal mengunggah materi: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus dokumen materi ini?")) return;
    try {
      await api.materials.delete(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleOpenSummary = async (mat: LearningMaterialItem) => {
    setSelectedMaterial(mat);
    setSummaryModalOpen(true);

    if (mat.summary) {
      setSummaryData({
        summary: mat.summary,
        key_concepts: mat.key_concepts || "",
        glossary: [],
      });
      return;
    }

    // Call summarize endpoint
    setSummarizing(true);
    try {
      const res = await api.materials.summarize(mat.id);
      setSummaryData(res);
      // update local list with new summary
      setMaterials((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, summary: res.summary, key_concepts: res.key_concepts } : m))
      );
    } catch (err: any) {
      alert("Gagal membuat ringkasan: " + err.message);
      setSummaryModalOpen(false);
    } finally {
      setSummarizing(false);
    }
  };

  const handleOpenAsk = (mat: LearningMaterialItem) => {
    setSelectedMaterial(mat);
    setDocQuestion("");
    setDocAnswer(null);
    setDocSources([]);
    setAskModalOpen(true);
  };

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !docQuestion.trim() || asking) return;

    setAsking(true);
    try {
      const res = await api.materials.ask(selectedMaterial.id, docQuestion.trim());
      setDocAnswer(res.answer);
      setDocSources(res.sources || []);
    } catch (err: any) {
      alert("Gagal bertanya pada dokumen: " + err.message);
    } finally {
      setAsking(false);
    }
  };

  const handleGenerateQuizFromDoc = (mat: LearningMaterialItem) => {
    sessionStorage.setItem("quiz_target_material_id", mat.id);
    sessionStorage.setItem("quiz_target_subject", mat.title);
    window.location.href = "/quiz";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppLayout
      title="My Materials (Dokumen Pembelajaran)"
      subtitle="Unggah modul atau buku teks Anda dan biarkan AI membuat ringkasan, kuis, dan menjawab pertanyaan."
    >
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Dokumen Terunggah ({materials.length})
            </h2>
            <p className="text-xs text-slate-500">Mendukung file PDF, DOCX, TXT, dan Markdown hingga 25 MB.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPodcastTopic("Topik Pembelajaran Bebas");
                setPodcastSource("");
                setPodcastModalOpen(true);
              }}
              className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              <Headphones className="h-4 w-4 text-amber-600" />
              <span>Audio Diskusi (2 Host)</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setYoutubeModalOpen(true)}
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Video className="h-4 w-4 text-red-600" />
              <span>Analisis Video YouTube</span>
            </Button>
            <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" /> Unggah Dokumen Baru
            </Button>
          </div>
        </div>

        {/* Materials Grid / List */}
        {materials.length === 0 ? (
          <Card className="py-16 text-center border-dashed">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Belum Ada Dokumen Pembelajaran
            </h3>
            <p className="mt-1 max-w-sm mx-auto text-xs text-slate-500">
              Unggah file materi kuliah, slide presentasi, atau rangkuman ujian Anda untuk mulai belajar berbantuan AI.
            </p>
            <Button onClick={() => setUploadModalOpen(true)} className="mt-4 gap-2 text-xs" size="sm">
              <Upload className="h-4 w-4" /> Unggah Sekarang
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((mat) => (
              <Card key={mat.id} className="flex flex-col justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                        {mat.file_type === "pdf" ? (
                          <FileText className="h-5 w-5 text-red-500" />
                        ) : mat.file_type === "docx" ? (
                          <FileText className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileCode className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1" title={mat.title}>
                          {mat.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="uppercase font-semibold">{mat.file_type}</span>
                          <span>•</span>
                          <span>{formatFileSize(mat.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(mat.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {mat.summary || "Dokumen siap dipelajari. Buat ringkasan atau kuis untuk memulai."}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-xs">
                  <button
                    onClick={() => handleOpenSummary(mat)}
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Ringkasan
                  </button>

                  <button
                    onClick={() => handleOpenAsk(mat)}
                    className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium"
                  >
                    <HelpCircle className="h-3.5 w-3.5" /> Tanya Dokumen
                  </button>

                  <button
                    onClick={() => handleGenerateQuizFromDoc(mat)}
                    className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium"
                  >
                    <Award className="h-3.5 w-3.5" /> Buat Kuis
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Unggah Dokumen Pembelajaran"
        description="Unggah materi untuk ekstraksi teks, ringkasan, dan kuis otomatis."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Materi (Opsional)
            </label>
            <Input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Contoh: Modul Jaringan Komputer Bab 3"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pilih Berkas (PDF, DOCX, TXT, MD)
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              required
              className="mt-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300"
            />
            {selectedFile && (
              <p className="mt-1 text-[11px] text-slate-500">
                Ukuran: {formatFileSize(selectedFile.size)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setUploadModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" type="submit" isLoading={uploading} disabled={!selectedFile}>
              Unggah & Proses
            </Button>
          </div>
        </form>
      </Modal>

      {/* Summary Modal */}
      <Modal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        title={`Ringkasan AI: ${selectedMaterial?.title || ""}`}
        maxWidth="lg"
      >
        {summarizing ? (
          <div className="py-12 text-center space-y-3">
            <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 animate-spin">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              AI sedang menganalisis dokumen dan mengekstrak konsep penting...
            </p>
          </div>
        ) : summaryData ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ringkasan Utama
              </h4>
              <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {summaryData.summary}
              </p>
            </div>

            {summaryData.key_concepts && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Konsep Kunci
                </h4>
                <div className="mt-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-pre-line">
                  {summaryData.key_concepts}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <AudioPlayerButton text={summaryData.summary} />

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalSeed(`${selectedMaterial?.title}\n\n${summaryData.summary}\n\n${summaryData.key_concepts}`);
                    setModalTitle(selectedMaterial?.title || "Bagan Materi");
                    setMindmapOpen(true);
                  }}
                  className="gap-1.5 text-indigo-600 dark:text-indigo-400"
                >
                  <Share2 className="h-3.5 w-3.5" /> Mind Map
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalSeed(`${selectedMaterial?.title}\n\n${summaryData.summary}\n\n${summaryData.key_concepts}`);
                    setModalTitle(selectedMaterial?.title || "Cheatsheet Ujian");
                    setCheatsheetOpen(true);
                  }}
                  className="gap-1.5 text-amber-600 dark:text-amber-400"
                >
                  <FileText className="h-3.5 w-3.5" /> Cheatsheet
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPodcastTopic(selectedMaterial?.title || "Materi Dokumen");
                    setPodcastSource(`${summaryData.summary}\n\nKonsep Kunci:\n${summaryData.key_concepts}`);
                    setPodcastModalOpen(true);
                  }}
                  className="gap-1.5 text-orange-600 dark:text-orange-400"
                >
                  <Headphones className="h-3.5 w-3.5" /> Podcast
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await api.notes.create({
                        title: `Ringkasan: ${selectedMaterial?.title}`,
                        content: `${summaryData.summary}\n\nKonsep Kunci:\n${summaryData.key_concepts}`,
                        material_id: selectedMaterial?.id,
                        tags: "Ringkasan Dokumen",
                      });
                      alert("Berhasil disimpan ke Catatan!");
                    } catch (e: any) {
                      alert("Gagal menyimpan catatan: " + e.message);
                    }
                  }}
                  className="gap-1.5"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Simpan Catatan
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Ask Document Modal */}
      <Modal
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        title={`Tanya Berdasarkan: ${selectedMaterial?.title || ""}`}
        description="Pertanyaan akan dijawab secara spesifik menggunakan kutipan konteks dari dokumen ini."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <form onSubmit={handleAskSubmit} className="flex gap-2">
            <Input
              value={docQuestion}
              onChange={(e) => setDocQuestion(e.target.value)}
              placeholder="Contoh: Apa kesimpulan bab terakhir modul ini?"
              disabled={asking}
            />
            <Button size="md" type="submit" isLoading={asking} disabled={!docQuestion.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {docAnswer && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Jawaban AI</h5>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {docAnswer}
              </p>

              {docSources.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Sumber Halaman Rujukan:
                  </span>
                  <div className="mt-1 space-y-1">
                    {docSources.map((src, i) => (
                      <p key={i} className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        {src}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Visual Mind Map Modal */}
      <MindMapModal
        isOpen={mindmapOpen}
        onClose={() => setMindmapOpen(false)}
        seedContent={modalSeed}
        topicTitle={modalTitle}
      />

      {/* Quick Exam Cheatsheet Modal */}
      <CheatSheetModal
        isOpen={cheatsheetOpen}
        onClose={() => setCheatsheetOpen(false)}
        seedContent={modalSeed}
        subjectTitle={modalTitle}
      />

      {/* YouTube Video Summarizer & Quiz Modal */}
      <YouTubeAnalyzerModal
        isOpen={youtubeModalOpen}
        onClose={() => setYoutubeModalOpen(false)}
      />

      {/* AI Podcast Studio Modal (NotebookLM Style 2-Host) */}
      <PodcastModal
        isOpen={podcastModalOpen}
        onClose={() => setPodcastModalOpen(false)}
        initialTopic={podcastTopic}
        initialSourceText={podcastSource}
      />
    </AppLayout>
  );
}
