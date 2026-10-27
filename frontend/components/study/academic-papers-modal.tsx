"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  BookOpen,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Award,
  Sparkles,
  ArrowRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface AcademicPapersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onImportToNotes?: (paper: any) => void;
}

export function AcademicPapersModal({
  isOpen,
  onClose,
  initialQuery = "",
  onImportToNotes,
}: AcademicPapersModalProps) {
  const [query, setQuery] = useState(initialQuery || "machine learning education");
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.tools.searchPapers(query, 6);
      setPapers(res.papers || []);
    } catch (err) {
      console.error("Error searching papers:", err);
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCitation = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1a1918]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/70 p-4 sm:p-5 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 font-bold dark:bg-stone-100 dark:text-stone-900 shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Pencarian Jurnal Ilmiah (Semantic Scholar API)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Akses jutaan jurnal akademik, sitasi resmi APA, dan tautan Open Access PDF
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

        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200/60 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari topik penelitian, misal: 'neural networks learning', 'metode pembelajaran aktif'..."
                className="w-full rounded-2xl border border-stone-200/90 bg-white pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>
            <Button
              type="submit"
              isLoading={loading}
              className="rounded-2xl bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold px-5"
            >
              Cari Jurnal
            </Button>
          </form>
        </div>

        {/* Papers List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="h-6 w-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto dark:border-stone-100 dark:border-t-transparent" />
              <p className="text-xs text-stone-500">Mencari jurnal di repositori Semantic Scholar...</p>
            </div>
          ) : papers.length === 0 && searched ? (
            <div className="py-12 text-center text-xs text-stone-500">
              Tidak ada jurnal yang ditemukan untuk kata kunci tersebut. Coba gunakan istilah bahasa Inggris.
            </div>
          ) : papers.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Sparkles className="h-8 w-8 text-stone-300 dark:text-stone-600 mx-auto" />
              <p className="text-xs text-stone-500">
                Ketik topik skripsi atau penelitian di atas untuk melihat jurnal ilmiah dan sitasi resmi.
              </p>
            </div>
          ) : (
            papers.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-stone-200/80 bg-white p-4.5 shadow-xs dark:border-stone-800 dark:bg-[#1f1d1b] space-y-2.5 hover:border-stone-400 transition"
              >
                {/* Title & Year */}
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                    {p.title}
                  </h4>
                  <span className="shrink-0 rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10.5px] font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                    {p.year || "Publikasi"}
                  </span>
                </div>

                {/* Authors & Citations */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                  <span>✍️ {p.authors?.join(", ") || "Penulis Akademik"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                    <Award className="h-3.5 w-3.5" /> {p.citation_count} Sitasi
                  </span>
                </div>

                {/* Abstract */}
                {p.abstract && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                    {p.abstract}
                  </p>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyCitation(p.id, p.apa_citation)}
                      className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition"
                      title="Salin Format Sitasi APA"
                    >
                      {copiedId === p.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId === p.id ? "Sitasi Tersalin" : "Kutip (APA)"}</span>
                    </button>

                    {p.pdf_url && (
                      <a
                        href={p.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 transition"
                      >
                        <Download className="h-3 w-3" /> Unduh PDF
                      </a>
                    )}

                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 ml-1"
                      >
                        Lihat Sumber <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {onImportToNotes && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onImportToNotes(p);
                        onClose();
                      }}
                      className="h-7 text-xs rounded-xl border-stone-200 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300"
                    >
                      <FileText className="h-3 w-3 mr-1" /> Impor ke Catatan
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
