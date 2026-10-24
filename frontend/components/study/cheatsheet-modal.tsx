"use client";

import React, { useState, useEffect } from "react";
import { X, Printer, Copy, Check, Sparkles, RefreshCw, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { api } from "@/lib/api";

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  seedContent: string;
  subjectTitle?: string;
  model?: string;
}

export function CheatSheetModal({
  isOpen,
  onClose,
  seedContent,
  subjectTitle = "Materi Pembelajaran",
  model,
}: CheatSheetModalProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && seedContent && !content) {
      handleGenerate();
    }
  }, [isOpen, seedContent]);

  const handleGenerate = async () => {
    if (!seedContent.trim()) return;
    setLoading(true);
    try {
      const res = await api.ai.generateCheatsheet(seedContent, subjectTitle, model);
      setContent(res.cheatsheet_markdown || "");
    } catch (err: any) {
      alert("Gagal membuat lembar rangkuman: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* Header - Hidden in Print */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Lembar Rangkuman Ujian Cepat (Quick Cheatsheet)
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Disusun khusus untuk persiapan ujian & pengulangan cepat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !content}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={handleCopy}
              disabled={loading || !content}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-semibold disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Disalin" : "Salin Teks"}</span>
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Regenerasi"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 print:p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-600 border-t-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                AI sedang menyusun cheatsheet ujian padat...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Menyaring rumus kunci, prinsip esensial, dan jebakan ujian.
              </p>
            </div>
          ) : content ? (
            <div className="markdown-content print:text-black">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Belum ada lembar rangkuman yang dihasilkan.
            </div>
          )}
        </div>

        {/* Footer - Hidden in Print */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 print:hidden">
          <span>Tip: Gunakan layout 2 kolom pada dialog Print untuk format lembar contekan ujian paling hemat kertas.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
