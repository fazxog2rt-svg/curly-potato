"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Bot,
  ArrowRight,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface SnapSolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskTutor?: (solutionText: string) => void;
}

export function SnapSolveModal({ isOpen, onClose, onAskTutor }: SnapSolveModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Harap pilih file gambar (JPG, PNG, WebP).");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!imagePreview) {
      setError("Silakan unggah atau foto soal terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);
    setSolution(null);

    try {
      const res = await api.tools.solveVision(imagePreview, prompt || undefined);
      setSolution(res.solution);
    } catch (err: any) {
      setError(err?.message || "Gagal menganalisis soal dari gambar.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setImagePreview(null);
    setSolution(null);
    setError(null);
    setPrompt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1a1918]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/70 p-4 sm:p-5 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 font-bold dark:bg-stone-100 dark:text-stone-900 shadow-xs">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Snap & Solve (Bedah Soal dari Foto)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                AI Vision membaca rumus & tulisan tangan secara matematis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!imagePreview ? (
            /* Upload State */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-stone-300/90 bg-stone-50/60 p-8 text-center cursor-pointer hover:border-stone-500 hover:bg-stone-50 transition dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-stone-600"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                <Upload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  Klik untuk Memilih Foto atau Seret Gambar ke Sini
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Mendukung foto soal matematika, diagram fisika, atau catatan tulisan tangan (PNG, JPG)
                </p>
              </div>
            </div>
          ) : (
            /* Image Preview & Options */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Left: Image preview */}
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900 max-h-64 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview Soal"
                    className="max-h-64 w-auto object-contain"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 rounded-xl bg-stone-900/70 p-1.5 text-white hover:bg-stone-900 backdrop-blur-xs text-xs font-medium"
                    title="Ganti Foto"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Right: Question Instruction Prompt */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Contoh: Fokus pada cara cepat nomor 3, atau jelaskan konsep dasarnya..."
                      rows={3}
                      className="w-full rounded-2xl border border-stone-200/90 bg-stone-50/70 p-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-hidden dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-100"
                    />
                  </div>

                  <Button
                    onClick={handleSolve}
                    isLoading={loading}
                    className="w-full h-10 rounded-2xl bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 font-semibold text-xs gap-1.5 shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Bedah & Pecahkan Soal
                  </Button>
                </div>
              </div>

              {/* Solution Output */}
              {solution && (
                <div className="space-y-3 pt-3 border-t border-stone-200/70 dark:border-stone-800 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Solusi & Penjelasan Lengkap:
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 text-xs rounded-xl gap-1 border-stone-200"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Tersalin" : "Salin"}
                      </Button>
                      {onAskTutor && (
                        <Button
                          size="sm"
                          onClick={() => {
                            onAskTutor(solution);
                            onClose();
                          }}
                          className="h-7 text-xs rounded-xl bg-stone-900 text-stone-50 gap-1 dark:bg-stone-100 dark:text-stone-900"
                        >
                          <Bot className="h-3 w-3" /> Diskusi di AI Tutor
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-900/50 prose prose-stone dark:prose-invert max-w-none text-xs leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {solution}
                    </ReactMarkdown>
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
