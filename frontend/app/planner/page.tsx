"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  CalendarCheck,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  Target,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { StudyGoalItem, StudyTaskItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function PlannerPage() {
  const [goals, setGoals] = useState<StudyGoalItem[]>([]);
  const [tasks, setTasks] = useState<StudyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Goal modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);

  // Task modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskDuration, setTaskDuration] = useState(30);
  const [taskGoalId, setTaskGoalId] = useState<string>("");
  const [creatingTask, setCreatingTask] = useState(false);

  // AI Suggest modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState("");
  const [aiGoalDesc, setAiGoalDesc] = useState("");
  const [aiDays, setAiDays] = useState(7);
  const [aiHours, setAiHours] = useState(2);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [gData, tData] = await Promise.all([
        api.planner.getGoals(),
        api.planner.getTasks(),
      ]);
      if (Array.isArray(gData)) setGoals(gData);
      if (Array.isArray(tData)) setTasks(tData);
    } catch (e) {
      console.error("Error loading planner data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTask = async (taskId: string) => {
    try {
      const updated = await api.planner.toggleTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: updated.is_completed } : t))
      );
      // Reload goals to update progress percentages
      const gData = await api.planner.getGoals();
      setGoals(gData);
    } catch (e) {
      console.error("Error toggling task:", e);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setCreatingGoal(true);
    try {
      await api.planner.createGoal({
        title: goalTitle.trim(),
        description: goalDesc.trim() || undefined,
      });
      setGoalModalOpen(false);
      setGoalTitle("");
      setGoalDesc("");
      await loadData();
    } catch (err: any) {
      alert("Gagal membuat target: " + err.message);
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Hapus target belajar ini beserta tugas di dalamnya?")) return;
    try {
      await api.planner.deleteGoal(id);
      await loadData();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setCreatingTask(true);
    try {
      await api.planner.createTask({
        title: taskTitle.trim(),
        subject: taskSubject.trim() || undefined,
        duration_minutes: taskDuration,
        goal_id: taskGoalId || undefined,
      });
      setTaskModalOpen(false);
      setTaskTitle("");
      setTaskSubject("");
      await loadData();
    } catch (err: any) {
      alert("Gagal membuat tugas: " + err.message);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.planner.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      const gData = await api.planner.getGoals();
      setGoals(gData);
    } catch (err: any) {
      alert("Gagal menghapus tugas: " + err.message);
    }
  };

  const handleAiSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSubject.trim() || !aiGoalDesc.trim()) return;

    setSuggesting(true);
    try {
      const res = await api.planner.suggest({
        subject: aiSubject.trim(),
        goal_description: aiGoalDesc.trim(),
        days_available: aiDays,
        hours_per_day: aiHours,
      });
      setSuggestedTasks(res.tasks || []);
    } catch (err: any) {
      alert("Gagal mendapatkan saran AI: " + err.message);
    } finally {
      setSuggesting(false);
    }
  };

  const handleAcceptSuggestedTasks = async () => {
    if (suggestedTasks.length === 0) return;
    try {
      // 1. Create a parent goal
      const newGoal = await api.planner.createGoal({
        title: `${aiSubject}: ${aiGoalDesc}`,
        description: `Rencana AI untuk ${aiDays} hari (${aiHours} jam/hari)`,
      });

      // 2. Create tasks under this goal
      for (const t of suggestedTasks) {
        await api.planner.createTask({
          goal_id: newGoal.id,
          title: t.title,
          subject: t.subject || aiSubject,
          duration_minutes: t.duration_minutes || 30,
        });
      }

      setAiModalOpen(false);
      setSuggestedTasks([]);
      setAiSubject("");
      setAiGoalDesc("");
      await loadData();
      alert("Rencana belajar AI berhasil ditambahkan ke jadwal Anda!");
    } catch (e: any) {
      alert("Gagal menyimpan rencana AI: " + e.message);
    }
  };

  return (
    <AppLayout
      title="Study Planner & Target Belajar"
      subtitle="Bagi target belajar besar menjadi langkah harian yang realistis dengan bimbingan AI."
    >
      <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Rencana Pembelajaran Pribadi
            </h2>
            <p className="text-xs text-slate-500">
              {goals.length} Target Aktif • {tasks.filter((t) => !t.is_completed).length} Tugas Belum Selesai
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setSuggestedTasks([]);
                setAiModalOpen(true);
              }}
              variant="outline"
              className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400"
            >
              <Sparkles className="h-4 w-4" /> Saran Rencana AI
            </Button>
            <Button onClick={() => setGoalModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Buat Target Baru
            </Button>
          </div>
        </div>

        {/* Goals Progress Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Target Belajar (Goals)
          </h3>

          {goals.length === 0 ? (
            <Card className="py-8 text-center border-dashed">
              <p className="text-xs text-slate-500">
                Belum ada target belajar. Buat target untuk memantau kemajuan Anda.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <Card key={goal.id} className="p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {goal.title}
                      </h4>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {goal.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {goal.progress_percentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Daftar Tugas Harian (Tasks)
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTaskModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Tugas
            </Button>
          </div>

          {tasks.length === 0 ? (
            <Card className="py-12 text-center border-dashed">
              <CalendarCheck className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-xs text-slate-500">Belum ada tugas belajar yang dijadwalkan.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900 transition-colors"
                >
                  <div
                    onClick={() => handleToggleTask(task.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <div>
                      <p
                        className={`text-sm ${
                          task.is_completed
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "font-semibold text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.subject && (
                        <span className="text-[11px] text-slate-400">{task.subject}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Clock className="h-3 w-3" /> {task.duration_minutes} mnt
                    </Badge>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Goal Modal */}
      <Modal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title="Buat Target Pembelajaran Baru"
        description="Target belajar membantu memfokuskan pencapaian materi akademik Anda."
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nama Target
            </label>
            <Input
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="Contoh: Menguasai Pemrograman Web Next.js"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi Target
            </label>
            <textarea
              value={goalDesc}
              onChange={(e) => setGoalDesc(e.target.value)}
              placeholder="Detail target dan capaian yang diinginkan..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setGoalModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" type="submit" isLoading={creatingGoal}>
              Simpan Target
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Tambah Tugas Belajar"
        description="Jadwalkan langkah spesifik yang akan diselesaikan."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Tugas
            </label>
            <Input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Contoh: Membaca Bab 2 & Mengerjakan 5 Latihan Soal"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mata Pelajaran
              </label>
              <Input
                value={taskSubject}
                onChange={(e) => setTaskSubject(e.target.value)}
                placeholder="Contoh: Fisika"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Estimasi Durasi (Menit)
              </label>
              <Input
                type="number"
                value={taskDuration}
                onChange={(e) => setTaskDuration(Number(e.target.value))}
                min={5}
                max={300}
                required
                className="mt-1"
              />
            </div>
          </div>

          {goals.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hubungkan dengan Target (Goal)
              </label>
              <select
                value={taskGoalId}
                onChange={(e) => setTaskGoalId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="">Tugas Mandiri (Tanpa Goal)</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setTaskModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" type="submit" isLoading={creatingTask}>
              Simpan Tugas
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Suggest Plan Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Saran Rencana Belajar AI"
        description="Biarkan AI memecah target pembelajaran Anda menjadi jadwal harian yang terukur."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <form onSubmit={handleAiSuggest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mata Pelajaran
                </label>
                <Input
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  placeholder="Contoh: Struktur Data, Biologi Molekuler"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Hari Tersedia & Jam/Hari
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input
                    type="number"
                    value={aiDays}
                    onChange={(e) => setAiDays(Number(e.target.value))}
                    min={1}
                    max={60}
                    placeholder="Hari"
                  />
                  <Input
                    type="number"
                    value={aiHours}
                    onChange={(e) => setAiHours(Number(e.target.value))}
                    min={0.5}
                    max={12}
                    step={0.5}
                    placeholder="Jam/hari"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Capaian Target yang Diinginkan
              </label>
              <textarea
                value={aiGoalDesc}
                onChange={(e) => setAiGoalDesc(e.target.value)}
                placeholder="Contoh: Menguasai pohon biner, graf, dan siap menghadapi ujian tengah semester."
                rows={2}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Button size="sm" type="submit" isLoading={suggesting} className="w-full gap-2">
              <Sparkles className="h-4 w-4" /> Susun Rencana dengan AI
            </Button>
          </form>

          {suggestedTasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Jadwal Tugas yang Disarankan:
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {suggestedTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {t.title}
                    </span>
                    <Badge variant="secondary">{t.duration_minutes} mnt</Badge>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setAiModalOpen(false)}>
                  Batal
                </Button>
                <Button size="sm" onClick={handleAcceptSuggestedTasks} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Terapkan ke Jadwal Saya
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}
