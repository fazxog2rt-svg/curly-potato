"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Clock,
  Award,
  RotateCcw,
  TrendingUp,
  Target,
  Flame,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalyticsOverview } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Manual session logger modal
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(25);
  const [activityType, setActivityType] = useState("study");
  const [notes, setNotes] = useState("");
  const [loggingSession, setLoggingSession] = useState(false);

  const loadAnalytics = async () => {
    try {
      const res = await api.analytics.overview();
      setData(res);
    } catch (e) {
      console.error("Error loading analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingSession(true);
    try {
      await api.analytics.logSession({
        subject: subject.trim() || "Belajar Mandiri",
        duration_minutes: duration,
        activity_type: activityType,
        notes: notes.trim() || undefined,
      });
      setSessionModalOpen(false);
      setSubject("");
      setNotes("");
      await loadAnalytics();
      alert("Sesi belajar berhasil dicatat!");
    } catch (err: any) {
      alert("Gagal mencatat sesi: " + err.message);
    } finally {
      setLoggingSession(false);
    }
  };

  const accuracyData =
    data?.accuracy_by_subject && data.accuracy_by_subject.length > 0
      ? data.accuracy_by_subject.map((item) => ({
          name: item.subject,
          value: item.accuracy_percentage,
        }))
      : [];

  return (
    <AppLayout
      title="Statistik & Analisis Belajar"
      subtitle="Data komprehensif perkembangan akademik, tren waktu belajar, dan deteksi materi lemah."
    >
      <div className="space-y-6">
        {/* Top Control */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Ringkasan Evaluasi Belajar
            </h2>
            <p className="text-xs text-slate-500">Seluruh statistik dihitung dari riwayat database nyata.</p>
          </div>
          <Button onClick={() => setSessionModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Catat Sesi Belajar Manual
          </Button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Waktu Belajar</span>
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatTime(data?.total_study_minutes || 0)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Dari {data?.total_sessions_count || 0} sesi belajar
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Rata-rata Akurasi Kuis</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {data?.average_quiz_score ? `${data.average_quiz_score}%` : "0%"}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {data?.quizzes_taken_count || 0} kuis selesai
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Materi Perlu Diulang</span>
              <RotateCcw className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {data?.cards_due_for_review || 0} Kartu
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Total {data?.total_cards_count || 0} kartu konsep
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Skor Konsistensi Belajar</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {data?.consistency_score || 0}%
            </div>
            <p className="mt-1 text-xs text-slate-400">Keaktifan 14 hari terakhir</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Durasi Belajar Mingguan (Menit)</CardTitle>
              <CardDescription>Aktivitas belajar dalam 7 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.weekly_study_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          {/* Accuracy by Subject */}
          <Card>
            <CardHeader>
              <CardTitle>Akurasi per Mata Pelajaran</CardTitle>
              <CardDescription>Persentase keberhasilan kuis berdasarkan bidang studi</CardDescription>
            </CardHeader>
            <CardContent>
              {accuracyData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <Award className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500">Belum ada data kuis yang selesai.</p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.accuracy_by_subject || []} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" />
                      <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} width={80} />
                      <Tooltip />
                      <Bar dataKey="accuracy_percentage" fill="#10b981" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weak Topics Identification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Materi yang Perlu Penguatan (Weak Topics)
            </CardTitle>
            <CardDescription>
              Daftar konsep yang paling sering salah dijawab dalam kuis atau sesi review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.weak_topics || data.weak_topics.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                🎉 Luar biasa! Tidak terdeteksi materi yang sering salah saat ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.weak_topics.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {item.topic}
                      </span>
                      <p className="text-xs text-slate-400">Mata Pelajaran: {item.subject}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Flame className="h-4 w-4" /> {item.failure_count}x salah
                      </span>
                      <a href="/review">
                        <Button size="sm" variant="outline" className="text-xs">
                          Ulas Sekarang
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Session Logger Modal */}
      <Modal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title="Catat Sesi Belajar Mandiri"
        description="Rekam waktu belajar membaca buku, video materi, atau sesi latihan Anda."
      >
        <form onSubmit={handleLogSession} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mata Pelajaran / Topik
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Pemrograman Python, Kimia Dasar"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Durasi Belajar (Menit)
              </label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={5}
                max={480}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jenis Kegiatan
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="study">Membaca / Menelaah</option>
                <option value="practice">Latihan Soal</option>
                <option value="video">Menonton Video Kuliah</option>
                <option value="project">Mengerjakan Proyek</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Catatan Singkat (Opsional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Selesai membaca bab 1-3"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setSessionModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" type="submit" isLoading={loggingSession}>
              Catat Sesi
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
