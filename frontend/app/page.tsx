"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  BookOpen,
  Award,
  RotateCcw,
  Bot,
  ArrowRight,
  CheckCircle2,
  Circle,
  Sparkles,
  TrendingUp,
  FileText,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalyticsOverview, StudyGoalItem, StudyTaskItem, UserProfile } from "@/lib/types";
import { formatTime, formatDate } from "@/lib/utils";
import { GamificationBadges } from "@/components/study/gamification-badges";
import { AIMotivationCard } from "@/components/study/ai-motivation-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [goals, setGoals] = useState<StudyGoalItem[]>([]);
  const [tasks, setTasks] = useState<StudyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [profData, analyticsData, goalsData, tasksData] = await Promise.allSettled([
          api.auth.me(),
          api.analytics.overview(),
          api.planner.getGoals(),
          api.planner.getTasks(),
        ]);

        if (profData.status === "fulfilled") setProfile(profData.value);
        if (analyticsData.status === "fulfilled") setAnalytics(analyticsData.value);
        if (goalsData.status === "fulfilled" && Array.isArray(goalsData.value)) setGoals(goalsData.value);
        if (tasksData.status === "fulfilled" && Array.isArray(tasksData.value)) setTasks(tasksData.value);
      } catch (e) {
        console.error("Dashboard data load error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleToggleTask = async (taskId: string) => {
    try {
      const updated = await api.planner.toggleTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: updated.is_completed } : t))
      );
      // Reload analytics overview to reflect study session increment
      const newAnalytics = await api.analytics.overview();
      setAnalytics(newAnalytics);
    } catch (e) {
      console.error("Error toggling task:", e);
    }
  };

  const chartData = analytics?.weekly_study_trends || [
    { day: "Sen", minutes: 0 },
    { day: "Sel", minutes: 0 },
    { day: "Rab", minutes: 0 },
    { day: "Kam", minutes: 0 },
    { day: "Jum", minutes: 0 },
    { day: "Sab", minutes: 0 },
    { day: "Min", minutes: 0 },
  ];

  return (
    <AppLayout
      title={`Halo, ${profile?.full_name?.split(" ")[0] || "Pelajar"} 👋`}
      subtitle="Selamat datang di AI Study Companion. Siap melanjutkan pembelajaran hari ini?"
    >
      <div className="space-y-6">
        {/* AI Dynamic Motivation & Hikmah Card */}
        <AIMotivationCard />

        {/* Recommendation / Motivation Alert Banner */}
        {analytics?.recommendations && analytics.recommendations.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 p-4 shadow-xs dark:border-indigo-950 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                  Rekomendasi AI Hari Ini:
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {analytics.recommendations[0]}
                </p>
              </div>
              <a href="/review">
                <Button size="sm" variant="outline" className="hidden sm:inline-flex text-xs">
                  Review Sekarang <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Gamification, Streak & Badges */}
        <GamificationBadges
          studyMinutes={analytics?.total_study_minutes || 0}
          quizCount={analytics?.quizzes_taken_count || 0}
          avgScore={analytics?.average_quiz_score || 0}
          cardsReviewed={analytics?.total_cards_count || 0}
        />

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Waktu Belajar</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatTime(analytics?.total_study_minutes || 0)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Dari {analytics?.total_sessions_count || 0} sesi belajar
              </p>
            </div>
          </Card>

          <Card className="hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rata-rata Nilai Kuis</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics?.average_quiz_score ? `${analytics.average_quiz_score}%` : "Belum Ada"}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {analytics?.quizzes_taken_count || 0} kuis telah diselesaikan
              </p>
            </div>
          </Card>

          <Card className="hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Jatuh Tempo Review</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <RotateCcw className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics?.cards_due_for_review || 0}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Dari total {analytics?.total_cards_count || 0} kartu materi
              </p>
            </div>
          </Card>

          <Card className="hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Target Pembelajaran</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics?.study_goals_active || 0} Aktif
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {analytics?.study_goals_completed || 0} target tercapai
              </p>
            </div>
          </Card>
        </div>

        {/* Middle Section: Weekly Activity & AI Tutor Fast Entry */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Chart Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Aktivitas Belajar 7 Hari Terakhir</CardTitle>
                <CardDescription>Durasi belajar harian (dalam menit)</CardDescription>
              </div>
              <Badge variant="secondary">
                Konsistensi: {analytics?.consistency_score || 0}%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-md dark:border-slate-800 dark:bg-slate-900">
                              <span className="font-semibold">{payload[0].payload.day}:</span>{" "}
                              {payload[0].value} menit
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="minutes" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick AI Tutor Card */}
          <Card className="flex flex-col justify-between border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white dark:border-indigo-950 dark:from-slate-900 dark:to-slate-900">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none mb-4">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Mulai Tanya AI Tutor
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Bingung dengan konsep sulit? Dapatkan penjelasan bertahap, analogi ramah, atau latihan soal yang adaptif.
              </p>

              <div className="mt-4 space-y-2">
                <div className="rounded-lg bg-white/80 p-2.5 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                  💡 &quot;Jelaskan cara kerja algoritma Dijkstra dengan analogi peta kota.&quot;
                </div>
                <div className="rounded-lg bg-white/80 p-2.5 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                  💡 &quot;Bagaimana perbedaan mitosis dan meiosis pada biologi sel?&quot;
                </div>
              </div>
            </div>

            <div className="pt-6">
              <a href="/tutor" className="block w-full">
                <Button className="w-full gap-2">
                  Buka AI Tutor <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </Card>
        </div>

        {/* Bottom Section: Active Tasks & Study Goals */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tasks List */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Tugas Belajar Hari Ini</CardTitle>
                <CardDescription>Tandai selesai untuk mencatat progres</CardDescription>
              </div>
              <a href="/planner">
                <Button size="sm" variant="ghost" className="text-xs">
                  Kelola <ArrowRight className="h-3 w-3" />
                </Button>
              </a>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="py-8 text-center">
                  <Circle className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-xs font-medium text-slate-500">Belum ada tugas belajar yang dibuat.</p>
                  <a href="/planner" className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Plus className="h-3.5 w-3.5" /> Tambah Tugas
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {task.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            task.is_completed
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "font-medium text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {task.duration_minutes} mnt
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Goals */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Target Belajar</CardTitle>
                <CardDescription>Tujuan pembelajaran yang sedang ditempuh</CardDescription>
              </div>
              <a href="/planner">
                <Button size="sm" variant="ghost" className="text-xs">
                  Semua Target <ArrowRight className="h-3 w-3" />
                </Button>
              </a>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="py-8 text-center">
                  <Award className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-xs font-medium text-slate-500">Belum ada target belajar yang ditentukan.</p>
                  <a href="/planner" className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Plus className="h-3.5 w-3.5" /> Buat Target
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.slice(0, 4).map((goal) => (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {goal.title}
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {goal.progress_percentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                          style={{ width: `${goal.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
