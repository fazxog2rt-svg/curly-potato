"use client";

import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Terminal,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface AgentCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  model?: string;
}

export function AgentCopilotModal({ isOpen, onClose, model = "minimax-m3.1-flash" }: AgentCopilotModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [missionResult, setMissionResult] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  const handleRunMission = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    setMissionResult(null);
    setAppliedMessage(null);
    try {
      const res = await api.agentCopilot.execute(finalPrompt, model);
      setMissionResult(res);
    } catch (err: any) {
      alert("Gagal menjalankan misi co-pilot: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!missionResult) return;
    setApplying(true);
    try {
      const res = await api.agentCopilot.applyPlan(
        missionResult.mission_title,
        missionResult.actionable_plan || [],
        missionResult.generated_flashcards || []
      );
      setAppliedMessage(res.message);
    } catch (err: any) {
      alert("Gagal menerapkan rencana: " + (err.message || err));
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-3xl max-h-[92vh] rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/80 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Autonomous Study Co-Pilot (ReAct Agent)
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Multi-Tool
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agen otonom dengan siklus Thought → Action → Observation untuk menyusun strategi belajar
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Prompt Input Box */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Instruksi Misi Belajar Anda:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunMission()}
                placeholder="Contoh: Saya butuh persiapan ujian kalkulus & aljabar 3 hari ke depan, carikan celah kelemahan dan buat sprint target."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
              <Button onClick={() => handleRunMission()} isLoading={loading} disabled={!prompt.trim() || loading}>
                Eksekusi Agen <Zap className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Contoh Cepat:</span>
              {[
                "Audit kelemahan materi & susun sprint 3 hari",
                "Buat rencana review kartu memori dan kuis intensif",
                "Petakan konsep kalkulus dari dasar hingga lanjut",
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(preset);
                    handleRunMission(preset);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State with simulated Agent loop */}
          {loading && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-6 text-center dark:border-purple-950 dark:bg-purple-950/20 space-y-3">
              <Sparkles className="mx-auto h-8 w-8 text-purple-600 dark:text-purple-400 animate-spin" />
              <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                Agen otonom sedang menjalankan siklus penalaran ReAct...
              </p>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-400">
                Memindai catatan → Menganalisis celah pemahaman → Merumuskan sprint target belajar
              </p>
            </div>
          )}

          {/* Mission Results */}
          {missionResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Mission Summary Card */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 p-4 dark:border-indigo-950 dark:bg-slate-950">
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
                  {missionResult.mission_title}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {missionResult.summary}
                </p>
              </div>

              {/* Step-by-Step ReAct Thought Stream */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200 font-mono space-y-3 shadow-inner">
                <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-800 pb-2">
                  <Terminal className="h-4 w-4" />
                  <span>Jejak Penalaran Agen (ReAct Autonomous Log):</span>
                </div>
                {missionResult.thought_steps?.map((step: any, idx: number) => (
                  <div key={idx} className="space-y-1 pl-2 border-l-2 border-indigo-500/50">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">Step {step.step}:</span>
                      <span className="text-slate-300">{step.thought}</span>
                    </div>
                    <div className="text-[11px] text-purple-300">
                      ⚡ Action Tool: <span className="underline">{step.action}</span>
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      👁 Observation: {step.observation}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actionable Daily Sprint Plan */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Jadwal Rencana Aksi Harian:
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {missionResult.actionable_plan?.map((day: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {day.day}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {day.recommended_duration_minutes} mnt
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                        {day.focus}
                      </p>
                      <ul className="space-y-1 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                        {day.tasks?.map((t: string, tidx: number) => (
                          <li key={tidx} className="flex items-start gap-1.5">
                            <span className="text-indigo-500">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesized Flashcards */}
              {missionResult.generated_flashcards && missionResult.generated_flashcards.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    Kartu Memori Kunci yang Disintesis:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {missionResult.generated_flashcards.map((card: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-xs dark:border-purple-950 dark:bg-slate-950"
                      >
                        <p className="font-bold text-purple-900 dark:text-purple-300">
                          Q: {card.front}
                        </p>
                        <p className="mt-1 text-slate-600 dark:text-slate-400 text-[11px]">
                          A: {card.back}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proactive Advice Banner */}
              {missionResult.proactive_advice && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-950 dark:bg-amber-950/20 dark:text-amber-200">
                  <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-bold">Tips Efisiensi Kognitif:</span> {missionResult.proactive_advice}
                  </p>
                </div>
              )}

              {/* Success Notification if applied */}
              {appliedMessage && (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{appliedMessage} Anda dapat melihatnya di menu Study Planner dan Smart Review!</span>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">
                  Otomatis simpan rencana harian dan kartu memori langsung ke akun Anda.
                </p>
                <Button
                  onClick={handleApplyPlan}
                  isLoading={applying}
                  disabled={applying || !!appliedMessage}
                  className="shadow-md"
                >
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Terapkan ke Jadwal & Flashcards
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
