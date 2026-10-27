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
  Flame,
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
        {/* Top Hero Section: Clean 2-Column Balanced Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: Study Status, AI Recommendation & Quick Actions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-5.5 shadow-xs dark:border-stone-800 dark:bg-[#1a1918]">
            <div>
              {/* Top row: Level + Streak Pill */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 font-bold text-sm shadow-xs dark:bg-stone-100 dark:text-stone-900">
                    Lv.2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      Pelajar Berdedikasi
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {formatTime(analytics?.total_study_minutes || 0)} belajar • {analytics?.quizzes_taken_count || 0} kuis selesai
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                  <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>3 Hari Beruntun</span>
                </div>
              </div>

              {/* Embedded AI Recommendation */}
              <div className="mt-4 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-900/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-stone-900 dark:text-stone-200">
                        Rekomendasi AI Hari Ini:
                      </span>
                      <a
                        href="/review"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                      >
                        Review Sekarang <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {analytics?.recommendations?.[0] || "Coba kerjakan kuis evaluasi berkala untuk menguji pemahaman materi terkini."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100 dark:border-stone-800/80">
              <a href="/tutor">
                <Button size="sm" className="h-8 rounded-xl text-xs gap-1.5 bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200">
                  <Bot className="h-3.5 w-3.5" /> Tanya AI Tutor
                </Button>
              </a>
              <a href="/review">
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs gap-1.5 border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                  <RotateCcw className="h-3.5 w-3.5" /> Flashcard Review
                </Button>
              </a>
              <a href="/materials">
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs gap-1.5 border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                  <BookOpen className="h-3.5 w-3.5" /> Materi Kuliah
                </Button>
              </a>
            </div>
          </div>

          {/* Right: AI Hikmah & Motivation (5 cols) */}
          <div className="lg:col-span-5">
            <AIMotivationCard compact={true} className="h-full" />
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 shadow-xs hover:border-stone-400 transition-all dark:border-stone-800 dark:bg-[#1a1918]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Total Waktu Belajar</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900 dark:text-white">
                {formatTime(analytics?.total_study_minutes || 0)}
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Dari {analytics?.total_sessions_count || 0} sesi belajar
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 shadow-xs hover:border-stone-400 transition-all dark:border-stone-800 dark:bg-[#1a1918]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Rata-rata Nilai Kuis</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900 dark:text-white">
                {analytics?.average_quiz_score ? `${analytics.average_quiz_score}%` : "Belum Ada"}
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {analytics?.quizzes_taken_count || 0} kuis telah diselesaikan
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 shadow-xs hover:border-stone-400 transition-all dark:border-stone-800 dark:bg-[#1a1918]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Jatuh Tempo Review</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <RotateCcw className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900 dark:text-white">
                {analytics?.cards_due_for_review || 0}
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Dari total {analytics?.total_cards_count || 0} kartu materi
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 shadow-xs hover:border-stone-400 transition-all dark:border-stone-800 dark:bg-[#1a1918]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Target Pembelajaran</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900 dark:text-white">
                {analytics?.study_goals_active || 0} Aktif
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {analytics?.study_goals_completed || 0} target tercapai
              </p>
            </div>
          </div>
        </div>

        {/* Middle Section: Weekly Activity Chart (7 cols) + Gamification Badges (5 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Chart Card (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl border border-stone-200/90 bg-white p-5.5 shadow-xs dark:border-stone-800 dark:bg-[#1a1918]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800/80">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Aktivitas Belajar 7 Hari Terakhir
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Durasi belajar harian (dalam menit)
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                Konsistensi: {analytics?.consistency_score || 0}%
              </span>
            </div>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#a8a29e" fontSize={12} tickLine={false} />
                  <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-stone-200 bg-white p-2.5 text-xs shadow-md dark:border-stone-800 dark:bg-stone-900">
                            <span className="font-semibold text-stone-800 dark:text-stone-200">{payload[0].payload.day}:</span>{" "}
                            <span className="font-bold text-stone-900 dark:text-white">{payload[0].value} menit</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="minutes" fill="#1c1917" className="dark:fill-[#f5f5f4]" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gamification Badges Showcase (5 cols) */}
          <div className="lg:col-span-5">
            <GamificationBadges
              studyMinutes={analytics?.total_study_minutes || 0}
              quizCount={analytics?.quizzes_taken_count || 0}
              avgScore={analytics?.average_quiz_score || 0}
              cardsReviewed={analytics?.total_cards_count || 0}
              className="h-full"
            />
          </div>
        </div>

        {/* Bottom Section: Active Tasks & Study Goals */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tasks List */}
          <div className="rounded-3xl border border-stone-200/90 bg-white p-5.5 shadow-xs dark:border-stone-800 dark:bg-[#1a1918]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800/80">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Tugas Belajar Hari Ini
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Tandai selesai untuk mencatat progres
                </p>
              </div>
              <a href="/planner">
                <Button size="sm" variant="ghost" className="text-xs text-stone-600 dark:text-stone-400">
                  Kelola <ArrowRight className="h-3 w-3" />
                </Button>
              </a>
            </div>
            <div className="pt-4">
              {tasks.length === 0 ? (
                <div className="py-8 text-center">
                  <Circle className="mx-auto h-8 w-8 text-stone-300 dark:text-stone-600" />
                  <p className="mt-2 text-xs font-medium text-stone-500">Belum ada tugas belajar yang dibuat.</p>
                  <a href="/planner" className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="text-xs gap-1 rounded-xl border-stone-200">
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
                      className="flex items-center justify-between p-3 rounded-2xl border border-stone-100 bg-stone-50/60 hover:bg-stone-100/70 dark:border-stone-800 dark:bg-stone-900/40 dark:hover:bg-stone-900/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {task.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-stone-300 dark:text-stone-600 shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            task.is_completed
                              ? "line-through text-stone-400 dark:text-stone-500"
                              : "font-medium text-stone-800 dark:text-stone-200"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10.5px] rounded-lg">
                        {task.duration_minutes} mnt
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Goals */}
          <div className="rounded-3xl border border-stone-200/90 bg-white p-5.5 shadow-xs dark:border-stone-800 dark:bg-[#1a1918]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800/80">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Target Belajar
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Tujuan pembelajaran yang sedang ditempuh
                </p>
              </div>
              <a href="/planner">
                <Button size="sm" variant="ghost" className="text-xs text-stone-600 dark:text-stone-400">
                  Semua Target <ArrowRight className="h-3 w-3" />
                </Button>
              </a>
            </div>
            <div className="pt-4">
              {goals.length === 0 ? (
                <div className="py-8 text-center">
                  <Award className="mx-auto h-8 w-8 text-stone-300 dark:text-stone-600" />
                  <p className="mt-2 text-xs font-medium text-stone-500">Belum ada target belajar yang ditentukan.</p>
                  <a href="/planner" className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="text-xs gap-1 rounded-xl border-stone-200">
                      <Plus className="h-3.5 w-3.5" /> Buat Target
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.slice(0, 4).map((goal) => (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                          {goal.title}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {goal.progress_percentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                        <div
                          className="h-full bg-stone-900 dark:bg-stone-100 transition-all duration-500 rounded-full"
                          style={{ width: `${goal.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
