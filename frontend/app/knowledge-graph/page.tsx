"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { KnowledgeGraphView } from "@/components/study/knowledge-graph-view";
import { api } from "@/lib/api";
import { Sparkles, Network, RefreshCw, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KnowledgeGraphPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [recommendedPath, setRecommendedPath] = useState<any[]>([]);
  const [subject, setSubject] = useState("Semua");
  const [loading, setLoading] = useState(true);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await api.knowledgeGraph.getNodes(subject === "Semua" ? undefined : subject);
      setNodes(data.nodes || []);
      setRecommendedPath(data.recommended_path || []);
    } catch (e) {
      console.error("Knowledge graph fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [subject]);

  return (
    <AppLayout
      title="Peta Pengetahuan Adaptif (Knowledge Graph & BKT)"
      subtitle="Visualisasi ontologi dependensi konsep pembelajaran yang dimodelkan dengan Bayesian Knowledge Tracing (BKT)"
    >
      <div className="space-y-6">
        {/* Filter & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bidang Studi:</span>
            {["Semua", "Matematika", "Fisika"].map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  subject === s
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadGraph} isLoading={loading}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Segarkan Peta
            </Button>
          </div>
        </div>

        {/* Knowledge Graph Main Canvas & Drawer */}
        <KnowledgeGraphView
          nodes={nodes}
          recommendedPath={recommendedPath}
          onRefresh={loadGraph}
        />

        {/* Recommended Sequence Section */}
        {recommendedPath.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Rekomendasi Jalur Belajar Adaptif (Optimal Path)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Disusun otomatis berdasarkan status prasyarat yang sudah terbuka dan tingkat pemahaman saat ini
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recommendedPath.slice(0, 4).map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      Langkah #{idx + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.is_unlocked
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.is_unlocked ? "Siap Dipelajari" : "Terkunci Prasyarat"}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Tingkat Penguasaan: {Math.round(item.mastery * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
