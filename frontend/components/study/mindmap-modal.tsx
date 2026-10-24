"use client";

import React, { useState, useEffect } from "react";
import { X, Share2, Copy, Check, Download, Sparkles, RefreshCw } from "lucide-react";
import { MermaidDiagram } from "./mermaid-diagram";
import { api } from "@/lib/api";

interface MindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  seedContent: string;
  topicTitle?: string;
  model?: string;
}

export function MindMapModal({
  isOpen,
  onClose,
  seedContent,
  topicTitle = "Konsep Materi",
  model,
}: MindMapModalProps) {
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (isOpen && seedContent && !mermaidCode) {
      handleGenerate();
    }
  }, [isOpen, seedContent]);

  const handleGenerate = async () => {
    if (!seedContent.trim()) return;
    setLoading(true);
    try {
      const res = await api.ai.generateMindmap(seedContent, model);
      setMermaidCode(res.mermaid_code || "");
    } catch (err: any) {
      alert("Gagal menghasilkan mind map: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Visual Mind Map Konsep
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {topicTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Regenerasi</span>
            </button>
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-semibold"
            >
              {showCode ? "Tampilkan Bagan" : "Sintaks Mermaid"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                AI sedang merancang pohon konsep visual...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Menghubungkan hierarki topik, subtopik, dan relasi kunci.
              </p>
            </div>
          ) : showCode ? (
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                {mermaidCode}
              </pre>
              <button
                onClick={handleCopyCode}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Disalin" : "Salin Kode"}</span>
              </button>
            </div>
          ) : mermaidCode ? (
            <div className="w-full flex justify-center">
              <MermaidDiagram chart={mermaidCode} className="w-full" />
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Belum ada diagram yang dibuat. Klik tombol di atas untuk membuat.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Format didukung oleh Mermaid.js Graph Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
