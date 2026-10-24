"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Settings,
  ShieldCheck,
  BrainCircuit,
  Database,
  Sparkles,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Key,
} from "lucide-react";
import { api } from "@/lib/api";
import { UserMemoryItem, UserProfile } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sysSettings, setSysSettings] = useState<any>(null);
  const [memories, setMemories] = useState<UserMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Connection test state
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Memory modal state
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [memCategory, setMemCategory] = useState<
    "preference" | "weakness" | "goal" | "topic_interest" | "habit"
  >("preference");
  const [memKey, setMemKey] = useState("");
  const [memValue, setMemValue] = useState("");
  const [savingMemory, setSavingMemory] = useState(false);

  const loadSettingsData = async () => {
    try {
      const [profData, settsData, memsData] = await Promise.all([
        api.auth.me(),
        api.settings.get(),
        api.memory.list(),
      ]);
      setProfile(profData);
      setSysSettings(settsData);
      if (Array.isArray(memsData)) setMemories(memsData);
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleTestAi = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await api.settings.testAI();
      setAiTestResult({ success: true, message: res.message });
    } catch (err: any) {
      setAiTestResult({ success: false, message: err.message });
    } finally {
      setTestingAi(false);
    }
  };

  const handleToggleMemory = async () => {
    if (!profile) return;
    const newState = !profile.memory_enabled;
    try {
      const updated = await api.auth.updateProfile({ memory_enabled: newState });
      setProfile(updated);
    } catch (err: any) {
      alert("Gagal memperbarui pengaturan memori: " + err.message);
    }
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memKey.trim() || !memValue.trim()) return;

    setSavingMemory(true);
    try {
      const created = await api.memory.create({
        category: memCategory,
        key: memKey.trim(),
        value: memValue.trim(),
      });
      setMemories((prev) => [created, ...prev]);
      setMemoryModalOpen(false);
      setMemKey("");
      setMemValue("");
    } catch (err: any) {
      alert("Gagal menyimpan memori: " + err.message);
    } finally {
      setSavingMemory(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.memory.delete(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert("Gagal menghapus memori: " + err.message);
    }
  };

  return (
    <AppLayout
      title="Pengaturan Aplikasi & Gateway"
      subtitle="Konfigurasi integrasi GutsAI Gateway, database, preferensi belajar, dan memori personal."
    >
      <div className="space-y-6 max-w-4xl">
        {/* GutsAI Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Integrasi GutsAI Gateway</CardTitle>
                  <CardDescription>Gateway resmi OpenAI-compatible di https://api.gutsai.id/v1</CardDescription>
                </div>
              </div>
              <Badge variant={sysSettings?.gutsai_api_key_configured ? "success" : "warning"}>
                {sysSettings?.gutsai_api_key_configured ? "Terhubung" : "Belum Dikonfigurasi"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-slate-400 font-medium">Base URL</span>
                <p className="mt-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {sysSettings?.gutsai_base_url || "https://api.gutsai.id/v1"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-slate-400 font-medium">Model Default</span>
                <p className="mt-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {sysSettings?.gutsai_default_model || "claude-sonnet-4.5"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-slate-400 font-medium">API Key Status</span>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200">
                  <Key className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {sysSettings?.gutsai_masked_key || "GUTS_API_KEY belum disetel di .env"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-slate-400 font-medium">Mesin Database</span>
                <div className="mt-1 flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <Database className="h-3.5 w-3.5 text-slate-400" />
                  <span>{sysSettings?.database_type || "SQLite / PostgreSQL"}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestAi}
                isLoading={testingAi}
                className="gap-2 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" /> Uji Koneksi GutsAI
              </Button>
              <a
                href="https://gutsai.id/console"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Dapatkan API Key di gutsai.id/console ↗
              </a>
            </div>

            {aiTestResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  aiTestResult.success
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                    : "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200"
                }`}
              >
                {aiTestResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{aiTestResult.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Learning Memory Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Learning Memory</CardTitle>
                <CardDescription>
                  Memori personal yang digunakan AI Tutor untuk menyesuaikan gaya dan tingkat pemahaman Anda.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {profile?.memory_enabled ? "Aktif" : "Nonaktif"}
                </span>
                <button
                  type="button"
                  onClick={handleToggleMemory}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    profile?.memory_enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      profile?.memory_enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {memories.length} item memori tersimpan
              </span>
              <Button size="sm" variant="outline" onClick={() => setMemoryModalOpen(true)} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Tambah Profil Memori
              </Button>
            </div>

            {memories.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Belum ada memori personal tersimpan.
              </div>
            ) : (
              <div className="space-y-2">
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {mem.category}
                        </Badge>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {mem.key}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">{mem.value}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Memory Modal */}
      <Modal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        title="Tambah Memori Belajar Personal"
        description="Informasi ini membantu AI Tutor menyesuaikan cara mengajarkan materi."
      >
        <form onSubmit={handleSaveMemory} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kategori
            </label>
            <select
              value={memCategory}
              onChange={(e: any) => setMemCategory(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="preference">Preferensi Belajar</option>
              <option value="weakness">Kelemahan / Materi Sulit</option>
              <option value="goal">Target Spesifik</option>
              <option value="topic_interest">Minat Bidang Studi</option>
              <option value="habit">Kebiasaan Belajar</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kunci / Label
            </label>
            <Input
              value={memKey}
              onChange={(e) => setMemKey(e.target.value)}
              placeholder="Contoh: Gaya Belajar, Topik Lemah"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Keterangan Memori
            </label>
            <textarea
              value={memValue}
              onChange={(e) => setMemValue(e.target.value)}
              placeholder="Contoh: Lebih mudah paham jika diberi analogi visual dan implementasi kode Python."
              rows={3}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setMemoryModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" type="submit" isLoading={savingMemory}>
              Simpan Memori
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
