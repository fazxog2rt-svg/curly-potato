"use client";

import React, { useState } from "react";
import {
  Network,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  BookOpen,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface KnowledgeNodeData {
  id: string;
  title: string;
  subject: string;
  description: string;
  difficulty: string;
  prerequisites: string[];
  tags: string[];
  p_know: number;
  status: "mastered" | "in_progress" | "needs_remedy";
}

interface KnowledgeGraphViewProps {
  nodes: KnowledgeNodeData[];
  recommendedPath: any[];
  onRefresh: () => void;
}

export function KnowledgeGraphView({
  nodes,
  recommendedPath,
  onRefresh,
}: KnowledgeGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeData | null>(nodes[0] || null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const [testingMastery, setTestingMastery] = useState(false);

  // Position nodes spatially for a clean, intuitive hierarchical flowchart
  // Level 0: Aljabar Dasar (x: 100, y: 150)
  // Level 1: Fungsi Kuadrat (x: 280, y: 80), Hukum Newton (x: 280, y: 220)
  // Level 2: Turunan Dasar (x: 480, y: 80), Usaha Energi (x: 480, y: 220)
  // Level 3: Integral Dasar (x: 680, y: 80)
  // Level 4: Integral Parsial (x: 880, y: 80)
  const nodePositions: Record<string, { x: number; y: number }> = {
    aljabar_dasar: { x: 90, y: 150 },
    fungsi_kuadrat: { x: 280, y: 80 },
    hukum_newton_dasar: { x: 280, y: 220 },
    turunan_dasar: { x: 480, y: 80 },
    usaha_energi: { x: 480, y: 220 },
    integral_dasar: { x: 680, y: 80 },
    integral_parsial: { x: 880, y: 80 },
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case "mastered":
        return {
          fill: "fill-emerald-500/20",
          stroke: "stroke-emerald-500",
          badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
          label: "Dikuasai (Solid)",
        };
      case "in_progress":
        return {
          fill: "fill-amber-500/20",
          stroke: "stroke-amber-500",
          badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
          label: "Sedang Dipelajari",
        };
      default:
        return {
          fill: "fill-rose-500/20",
          stroke: "stroke-rose-500",
          badge: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
          label: "Butuh Remedial",
        };
    }
  };

  const handleDiagnose = async (nodeId: string) => {
    setDiagnosing(true);
    setDiagnosisData(null);
    try {
      const res = await api.knowledgeGraph.diagnose(nodeId);
      setDiagnosisData(res);
    } catch (err: any) {
      alert("Gagal melakukan diagnosa: " + (err.message || err));
    } finally {
      setDiagnosing(false);
    }
  };

  const handleQuickMasteryTest = async (isCorrect: boolean) => {
    if (!selectedNode) return;
    setTestingMastery(true);
    try {
      const res = await api.knowledgeGraph.updateMastery(selectedNode.id, isCorrect);
      setSelectedNode((prev) => (prev ? { ...prev, p_know: res.updated_mastery, status: res.status } : null));
      onRefresh();
    } catch (err: any) {
      alert("Gagal memperbarui pemahaman: " + (err.message || err));
    } finally {
      setTestingMastery(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Interactive Graph Canvas */}
      <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm p-5 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="h-4 w-4 text-indigo-600" />
              Peta Jaringan Ontologi Konsep
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Garis panah menunjukkan dependensi prasyarat. Klik simpul untuk melihat status probabilistik.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> P(L) ≥ 80% (Kuasai)
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 50% - 79% (Progres)
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> &lt; 50% (Lemah)
            </span>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="flex-1 w-full overflow-x-auto py-4 min-h-[360px] flex items-center justify-center">
          <svg className="w-[1000px] h-[340px]" viewBox="0 0 1000 340">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
              </marker>
            </defs>

            {/* Connecting Prerequisite Edges */}
            {nodes.map((node) => {
              const toPos = nodePositions[node.id];
              if (!toPos) return null;

              return node.prerequisites.map((preId) => {
                const fromPos = nodePositions[preId];
                if (!fromPos) return null;

                const isSelectedEdge =
                  selectedNode && (selectedNode.id === node.id || selectedNode.id === preId);

                return (
                  <path
                    key={`${preId}->${node.id}`}
                    d={`M ${fromPos.x + 40} ${fromPos.y + 20} C ${fromPos.x + 110} ${
                      fromPos.y + 20
                    }, ${toPos.x - 70} ${toPos.y + 20}, ${toPos.x - 10} ${toPos.y + 20}`}
                    fill="none"
                    stroke={isSelectedEdge ? "#6366f1" : "#cbd5e1"}
                    strokeWidth={isSelectedEdge ? "2.5" : "1.8"}
                    strokeDasharray={isSelectedEdge ? "none" : "4 2"}
                    markerEnd="url(#arrow)"
                    className="transition-all duration-300"
                  />
                );
              });
            })}

            {/* Concept Nodes */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id] || { x: 500, y: 150 };
              const isSelected = selectedNode?.id === node.id;
              const colorInfo = getNodeColor(node.status);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x - 45}, ${pos.y - 15})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  {/* Outer selection ring */}
                  {isSelected && (
                    <rect
                      x="-6"
                      y="-6"
                      width="122"
                      height="62"
                      rx="18"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Node Card Body */}
                  <rect
                    width="110"
                    height="50"
                    rx="14"
                    className={`transition-all duration-200 ${colorInfo.fill} ${colorInfo.stroke} dark:bg-slate-900 group-hover:scale-105`}
                    strokeWidth="2"
                    fill="currentColor"
                  />

                  {/* Node Title */}
                  <text
                    x="55"
                    y="22"
                    textAnchor="middle"
                    className="text-[11px] font-bold fill-slate-800 dark:fill-slate-100 select-none pointer-events-none"
                  >
                    {node.title.length > 15 ? node.title.slice(0, 14) + "..." : node.title}
                  </text>

                  {/* Mastery Pill */}
                  <text
                    x="55"
                    y="38"
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-indigo-600 dark:fill-indigo-400 select-none pointer-events-none"
                  >
                    P(L): {Math.round(node.p_know * 100)}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right 1 Col: Selected Concept Deep Diagnostic Drawer */}
      <div className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm p-5 space-y-5 flex flex-col">
        {selectedNode ? (
          <>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedNode.subject} • {selectedNode.difficulty}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    getNodeColor(selectedNode.status).badge
                  }`}
                >
                  {getNodeColor(selectedNode.status).label}
                </span>
              </div>
              <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                {selectedNode.title}
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {selectedNode.description}
              </p>
            </div>

            {/* BKT Mastery Metric Bar */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Probabilitas Penguasaan (BKT):
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(selectedNode.p_know * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    selectedNode.p_know >= 0.8
                      ? "bg-emerald-500"
                      : selectedNode.p_know >= 0.5
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${selectedNode.p_know * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Berdasarkan parameter Slip P(S)=0.10, Guess P(G)=0.20, dan Laju Belajar P(T)=0.15.
              </p>
            </div>

            {/* Prerequisite List */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Prasyarat Wajib:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.prerequisites.length > 0 ? (
                  selectedNode.prerequisites.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      {nodes.find((n) => n.id === p)?.title || p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Fondasi paling awal (tanpa prasyarat)</span>
                )}
              </div>
            </div>

            {/* Backtrack Diagnosis Button & Results */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleDiagnose(selectedNode.id)}
                isLoading={diagnosing}
              >
                <ShieldAlert className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                Lacak Akar Kelemahan (Backtrack)
              </Button>

              {diagnosisData && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs dark:border-amber-950 dark:bg-amber-950/20 space-y-2 animate-in fade-in">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    {diagnosisData.diagnosis_summary}
                  </p>
                  {diagnosisData.bottlenecks?.map((b: any, idx: number) => (
                    <div key={idx} className="rounded-lg bg-white/80 p-2 text-[11px] dark:bg-slate-900">
                      <p className="font-semibold text-rose-600 dark:text-rose-400">
                        ⚠️ {b.title} (Pemahaman: {Math.round(b.mastery * 100)}%)
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{b.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Concept Mastery Test simulator */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Simulasi Evaluasi Pemahaman (BKT):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs hover:border-emerald-500 hover:text-emerald-600"
                  onClick={() => handleQuickMasteryTest(true)}
                  disabled={testingMastery}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" /> Jawab Benar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs hover:border-rose-500 hover:text-rose-600"
                  onClick={() => handleQuickMasteryTest(false)}
                  disabled={testingMastery}
                >
                  <AlertTriangle className="mr-1 h-3.5 w-3.5 text-rose-500" /> Jawab Salah
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Network className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs">Pilih salah satu simpul konsep di peta untuk melihat detail analitik BKT.</p>
          </div>
        )}
      </div>
    </div>
  );
}
